import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getAuthUser, json } from '@/lib/auth';
import { QueryJobService, QUERY_COST_CREDITS } from '@/lib/providers';

const CATEGORIES = ['CPF', 'CNPJ', 'Nome', 'Telefone', 'Placa'] as const;
type Category = (typeof CATEGORIES)[number];

const digits = (v: string) => v.replace(/\D/g, '');

const validators: Record<Category, (v: string) => boolean> = {
  CPF: (v) => digits(v).length === 11,
  CNPJ: (v) => digits(v).length === 14,
  Telefone: (v) => digits(v).length >= 10 && digits(v).length <= 13,
  Placa: (v) => /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v.toUpperCase().replace(/[^A-Z0-9]/g, '')),
  Nome: (v) => v.trim().length >= 3,
};

// Avoid persisting the raw search term in plain text: keep only a masked version.
function maskInput(value: string) {
  const clean = value.trim();
  if (clean.length <= 4) return '*'.repeat(clean.length);
  return `${'*'.repeat(clean.length - 2)}${clean.slice(-2)}`;
}

const requestSchema = z
  .object({
    category: z.enum(CATEGORIES),
    input: z.string().trim().min(3).max(120),
  })
  .refine((data) => validators[data.category](data.input), {
    message: 'Valor inválido para a categoria selecionada',
    path: ['input'],
  });

class InsufficientCreditsError extends Error {}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return json({ ok: false, error: 'Autenticação necessária' }, 401);

    const body = requestSchema.parse(await request.json());
    const userId = user.id;

    // 1) Atomic debit + request creation. The balance check lives in the WHERE clause,
    //    so two concurrent requests can never spend the same credits.
    const { requestId, accountId } = await prisma.$transaction(async (tx) => {
      const debited = await tx.creditAccount.updateMany({
        where: { userId, balance: { gte: QUERY_COST_CREDITS } },
        data: { balance: { decrement: QUERY_COST_CREDITS } },
      });
      if (debited.count !== 1) throw new InsufficientCreditsError('Saldo insuficiente');

      const account = await tx.creditAccount.findUniqueOrThrow({ where: { userId } });

      const req = await tx.queryRequest.create({
        data: {
          userId,
          category: body.category,
          rawInput: maskInput(body.input),
          providerName: 'mock',
          status: 'WAITING',
          costCredits: QUERY_COST_CREDITS,
        },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          amount: -QUERY_COST_CREDITS,
          type: 'consumed',
          reason: `Consulta ${body.category}`,
          reference: req.id,
        },
      });

      await tx.queryStatusEvent.create({
        data: { requestId: req.id, status: 'WAITING', note: 'Solicitação enfileirada' },
      });

      return { requestId: req.id, accountId: account.id };
    });

    // 2) Call the provider. If it fails, refund the credits and mark the request as FAILED.
    try {
      const result = await new QueryJobService().enqueue({
        category: body.category,
        input: body.input,
        customerId: userId,
      });

      await prisma.queryRequest.update({
        where: { id: requestId },
        data: { providerRequestId: result.requestId, correlationId: result.correlationId, attempts: { increment: 1 } },
      });

      return json({ ok: true, requestId, provider: result.provider, status: 'queued' });
    } catch (providerError) {
      console.error('[queries] provider failure', providerError);

      await prisma.$transaction([
        prisma.creditAccount.update({
          where: { userId },
          data: { balance: { increment: QUERY_COST_CREDITS } },
        }),
        prisma.creditTransaction.create({
          data: {
            accountId,
            amount: QUERY_COST_CREDITS,
            type: 'refund',
            reason: `Estorno consulta ${body.category}`,
            reference: requestId,
          },
        }),
        prisma.queryRequest.update({ where: { id: requestId }, data: { status: 'FAILED', attempts: { increment: 1 } } }),
        prisma.queryStatusEvent.create({
          data: { requestId, status: 'FAILED', note: 'Falha no provider; créditos estornados' },
        }),
      ]);

      return json({ ok: false, error: 'Não foi possível processar a consulta. Seus créditos foram estornados.' }, 502);
    }
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return json({ ok: false, error: 'Saldo insuficiente' }, 402);
    }
    if (error instanceof z.ZodError) {
      return json({ ok: false, error: error.issues[0]?.message ?? 'Payload inválido' }, 400);
    }
    if (error instanceof SyntaxError) {
      return json({ ok: false, error: 'Payload inválido' }, 400);
    }
    console.error('[queries]', error);
    return json({ ok: false, error: 'Erro interno' }, 500);
  }
}
