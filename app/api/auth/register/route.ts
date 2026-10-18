import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';
import { clientIp, json, sessionCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const bodySchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export async function POST(request: Request) {
  try {
    if (!rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
      return json({ ok: false, error: 'Muitas tentativas. Tente novamente mais tarde.' }, 429);
    }

    const body = bodySchema.parse(await request.json());

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: 'CUSTOMER',
        creditAccount: { create: { balance: 0 } },
      },
    });

    const session = await createSession(user.id);

    return json({ ok: true, user: { email: user.email, role: user.role } }, 201, {
      'Set-Cookie': sessionCookie(session.token),
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return json({ ok: false, error: 'E-mail já cadastrado' }, 409);
    }
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return json({ ok: false, error: 'Dados inválidos' }, 400);
    }
    console.error('[register]', error);
    return json({ ok: false, error: 'Erro interno' }, 500);
  }
}
