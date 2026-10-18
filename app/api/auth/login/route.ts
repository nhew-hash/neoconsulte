import { z } from 'zod';
import bcrypt from 'bcryptjs';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const validDemo = body.email === 'cliente@neoconsulte.demo' || body.email === 'admin@neoconsulte.demo';
    const matches = validDemo && body.password === 'demo123';

    if (!matches) {
      return Response.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
    }

    return Response.json({
      ok: true,
      user: {
        email: body.email,
        role: body.email.includes('admin') ? 'admin' : 'customer',
      },
      message: 'Login validado em modo demo. Para produção, usar autenticação server-side com cookies seguros e hashing forte.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: 'Credenciais inválidas' }, { status: 400 });
  }
}
