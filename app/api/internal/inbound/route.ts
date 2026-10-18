import crypto from 'crypto';
import { z } from 'zod';
import { json } from '@/lib/auth';
import { ingestResponse } from '@/lib/queue/service';
import { createTransport } from '@/lib/queue/registry';

const bodySchema = z.object({
  externalMessageId: z.string().min(1).max(200),
  correlationId: z.string().min(1).max(100),
  text: z.string().min(1).max(8000),
});

function authorized(request: Request) {
  const secret = process.env.INBOUND_SECRET;
  if (!secret) return false; // sem segredo configurado, o endpoint fica fechado
  const received = Buffer.from(request.headers.get('x-inbound-secret') ?? '');
  const expected = Buffer.from(secret);
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

// Entrada genérica para canais que entregam respostas por webhook.
export async function POST(request: Request) {
  if (!authorized(request)) return json({ ok: false, error: 'Não autorizado' }, 401);

  try {
    const body = bodySchema.parse(await request.json());
    const transport = createTransport();
    const outcome = await ingestResponse({ transport: transport.name, ...body }, transport);
    return json({ ok: true, outcome });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return json({ ok: false, error: 'Payload inválido' }, 400);
    console.error('[inbound]', error instanceof Error ? error.name : 'erro');
    return json({ ok: false, error: 'Erro interno' }, 500);
  }
}
