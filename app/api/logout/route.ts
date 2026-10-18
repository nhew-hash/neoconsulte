import { deleteSession, getSessionByToken } from '@/lib/session';

export async function POST(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/neo_session=([^;]+)/);
  const token = match ? match[1] : null;

  if (token) {
    const session = await getSessionByToken(token);
    if (session) {
      await deleteSession(token);
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Set-Cookie': 'neo_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict',
      'Content-Type': 'application/json',
    },
  });
}
