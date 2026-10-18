import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';
import { clientIp, json, sessionCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000)) {
      return json({ ok: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' }, 429);
    }

    const body = bodySchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    const matches = user ? await bcrypt.compare(body.password, user.passwordHash) : false;
    if (!user || !matches) {
      return json({ ok: false, error: 'Credenciais inválidas' }, 401);
    }

    const session = await createSession(user.id);

    return json(
      { ok: true, user: { email: user.email, role: user.role }, redirect: user.role === 'ADMIN' ? '/admin' : '/dashboard' },
      200,
      { 'Set-Cookie': sessionCookie(session.token) },
    );
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return json({ ok: false, error: 'Requisição inválida' }, 400);
    }
    console.error('[login]', error);
    return json({ ok: false, error: 'Erro interno' }, 500);
  }
}
