import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { createSession } from '@/lib/session';

const bodySchema = z.object({
  name: z.string().min(2),
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

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return new Response(JSON.stringify({ ok: false, error: 'E-mail já cadastrado' }), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

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
    const headers = new Headers({ 'Set-Cookie': makeCookie(session.token), 'Content-Type': 'application/json' });

    return new Response(JSON.stringify({ ok: true, user: { email: user.email, role: user.role } }), { status: 201, headers });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: 'Dados inválidos' }), { status: 400 });
  }
}
