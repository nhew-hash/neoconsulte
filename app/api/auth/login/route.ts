import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function makeCookie(token: string) {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  return `neo_session=${token}; Path=/; HttpOnly; SameSite=Strict; ${secure}Max-Age=${60 * 60 * 24 * 30}`;
}

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: 'Credenciais inválidas' }), { status: 401 });
    }

    const matches = await bcrypt.compare(body.password, user.passwordHash);
    if (!matches) {
      return new Response(JSON.stringify({ ok: false, error: 'Credenciais inválidas' }), { status: 401 });
    }

    const session = await createSession(user.id);
    const headers = new Headers({ 'Set-Cookie': makeCookie(session.token), 'Content-Type': 'application/json' });

    return new Response(JSON.stringify({ ok: true, user: { email: user.email, role: user.role }, redirect: user.role === 'ADMIN' ? '/admin' : '/dashboard' }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: 'Requisição inválida' }), { status: 400 });
  }
}
