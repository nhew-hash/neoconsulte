import { getSessionByToken } from './session';

export const SESSION_COOKIE = 'neo_session';
const MAX_AGE = 60 * 60 * 24 * 30;

export function getTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)neo_session=([^;]+)/);
  return match ? match[1] : null;
}

export async function getAuthUser(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const session = await getSessionByToken(token);
  return session?.user ?? null;
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function clientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
