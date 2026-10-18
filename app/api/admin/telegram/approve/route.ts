import { approveTelegramDemoSession, getTelegramRuntimeState } from '@/lib/integrations/telegram';
import { requireAdminSession } from '@/lib/integrations/telegram/auth';

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.allowed) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const state = await approveTelegramDemoSession();
  return Response.json({ ok: true, state, message: 'Sessão do Telegram validada em modo demonstrativo.' });
}

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.allowed) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const state = getTelegramRuntimeState();
  return Response.json({ ok: true, state });
}
