import { z } from 'zod';
import { getAuthUser, json } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { QueryJobService } from '@/lib/providers';
import { InsufficientCreditsError, listQueriesForUser } from '@/lib/queue/service';
import { idempotencyKeySchema, querySchema } from '@/lib/queue/validation';

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return json({ ok: false, error: 'Autenticação necessária' }, 401);
  return json({ ok: true, queries: await listQueriesForUser(user.id) });
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return json({ ok: false, error: 'Autenticação necessária' }, 401);

    if (!rateLimit(`queries:${user.id}`, 30, 60_000)) {
      return json({ ok: false, error: 'Muitas solicitações. Aguarde um instante.' }, 429);
    }

    const body = querySchema.parse(await request.json());

    const rawKey = request.headers.get('idempotency-key');
    const idempotencyKey = rawKey ? idempotencyKeySchema.parse(rawKey) : null;

    const res = await new QueryJobService().enqueue({
      category: body.category,
      input: body.input,
      customerId: user.id,
      idempotencyKey,
    });

    return json({ ok: true, requestId: res.requestId, status: 'WAITING', duplicate: !!res.duplicate }, res.duplicate ? 200 : 202);
  } catch (error) {
    if (error instanceof InsufficientCreditsError) return json({ ok: false, error: 'Saldo insuficiente' }, 402);
    if (error instanceof z.ZodError) return json({ ok: false, error: error.issues[0]?.message ?? 'Payload inválido' }, 400);
    if (error instanceof SyntaxError) return json({ ok: false, error: 'Payload inválido' }, 400);
    console.error('[queries]', error instanceof Error ? error.name : 'erro');
    return json({ ok: false, error: 'Erro interno' }, 500);
  }
}
