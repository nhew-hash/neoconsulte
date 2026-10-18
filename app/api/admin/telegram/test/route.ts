import { getTelegramRuntimeState, sendTelegramDemoMessage } from '@/lib/integrations/telegram';
import { requireAdminSession } from '@/lib/integrations/telegram/auth';

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.allowed) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({ message: 'Teste do Telegram' }));
  const result = await sendTelegramDemoMessage(String(body.message ?? 'Teste do Telegram'));

  return Response.json({ ok: result.ok, result, state: getTelegramRuntimeState() });
}
