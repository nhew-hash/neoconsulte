import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    const demoUsers = {
      'cliente@neoconsulte.demo': { role: 'customer', redirect: '/dashboard' },
      'admin@neoconsulte.demo': { role: 'admin', redirect: '/admin' },
    } as const;

    const user = demoUsers[body.email as keyof typeof demoUsers];
    if (!user || body.password !== 'demo123') {
      return Response.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
    }

    return Response.json({
      ok: true,
      user: {
        email: body.email,
        role: user.role,
      },
      redirect: user.redirect,
      message: 'Login validado em modo demo. Para produção, usar autenticação server-side com cookies seguros e hashing forte.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: 'Credenciais inválidas' }, { status: 400 });
  }
}
