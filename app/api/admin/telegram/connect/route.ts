import { getTelegramRuntimeState, connectTelegramDemo, disconnectTelegramDemo, sendTelegramDemoMessage } from '@/lib/integrations/telegram';
import { requireAdminSession } from '@/lib/integrations/telegram/auth';

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.allowed) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const state = getTelegramRuntimeState();
  return Response.json({ ok: true, state });
}

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.allowed) {
    return Response.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const state = await connectTelegramDemo();
  return Response.json({ ok: true, state });
}
