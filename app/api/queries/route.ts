import { z } from 'zod';
import { QueryJobService } from '@/lib/providers';
import { prisma } from '@/lib/db';
import { getSessionByToken } from '@/lib/session';

const requestSchema = z.object({
  category: z.enum(['CPF', 'CNPJ', 'Nome', 'Telefone', 'Placa']),
  input: z.string().min(3),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());

    // extract neo_session token from cookie
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/neo_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'Autenticação necessária' }), { status: 401 });
    }

    const session = await getSessionByToken(token);
    if (!session || !session.user) {
      return new Response(JSON.stringify({ ok: false, error: 'Sessão inválida' }), { status: 401 });
    }

    const userId = session.user.id;
    const costCredits = 2;

    // Transaction: reserve credits and create request atomically
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.findUnique({ where: { userId } });
      if (!account) throw new Error('Conta de créditos inexistente');
      if (account.balance < costCredits) {
        throw new Error('Saldo insuficiente');
      }

      // debit
      const updated = await tx.creditAccount.update({ where: { userId }, data: { balance: account.balance - costCredits } });

      const transaction = await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          amount: -costCredits,
          type: 'consumed',
          reason: `Consulta ${body.category}`,
          reference: null,
        },
      });

      const req = await tx.queryRequest.create({
        data: {
          userId,
          category: body.category,
          rawInput: body.input,
          providerName: 'mock',
          status: 'WAITING',
          costCredits,
        },
      });

      await tx.queryStatusEvent.create({ data: { requestId: req.id, status: 'WAITING', note: 'Solicitação enfileirada' } });

      return { reqId: req.id };
    });

    const service = new QueryJobService();
    const enqueueResult = await service.enqueue({ category: body.category, input: body.input, customerId: userId });

    return new Response(JSON.stringify({ ok: true, requestId: result.reqId, provider: enqueueResult.provider, status: 'queued' }), { status: 200 });
  } catch (error: any) {
    const msg = error?.message ?? 'Payload inválido';
    const status = msg === 'Saldo insuficiente' ? 402 : 400;
    return new Response(JSON.stringify({ ok: false, error: msg }), { status });
  }
}
