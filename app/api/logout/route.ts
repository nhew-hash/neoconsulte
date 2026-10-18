import { clearSessionCookie, getTokenFromRequest } from '@/lib/auth';
import { deleteSession } from '@/lib/session';

export async function POST(request: Request) {
  const token = getTokenFromRequest(request);
  if (token) {
    await deleteSession(token);
  }

  const isFormPost = (request.headers.get('content-type') || '').includes('application/x-www-form-urlencoded');

  // <form action="/api/logout" method="POST"> sends a form post: redirect instead of showing raw JSON
  if (isFormPost) {
    return new Response(null, {
      status: 303,
      headers: { Location: new URL('/login', request.url).toString(), 'Set-Cookie': clearSessionCookie() },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
  });
}
