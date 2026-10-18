import { prisma } from '@/lib/db';
import { getSessionByToken } from '@/lib/session';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/neo_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (!token) {
    return Response.json({ ok: true, user: null });
  }

  const session = await getSessionByToken(token);
  if (!session?.user) {
    return Response.json({ ok: true, user: null });
  }

  return Response.json({
    ok: true,
    user: {
      email: session.user.email,
      role: session.user.role,
      name: session.user.name,
    },
  });
}
