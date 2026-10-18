
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionByToken } from '@/lib/session';

export async function requireAdminSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('neo_session')?.value;
  if (!token) {
    return { allowed: false, status: 401 as const, error: 'Autenticação necessária' };
  }

  const session = await getSessionByToken(token);
  if (!session || !session.user) {
    return { allowed: false, status: 401 as const, error: 'Sessão inválida' };
  }

  if (session.user.role !== 'ADMIN') {
    return { allowed: false, status: 403 as const, error: 'Permissão administrativa necessária' };
  }

  return { allowed: true, user: session.user };
}
