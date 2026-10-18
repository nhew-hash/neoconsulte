import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    if (body.email === 'cliente@neoconsulte.demo' && body.password === 'demo123') {
      return Response.json({ ok: true, user: { email: body.email, role: 'customer' }, redirect: '/dashboard' });
    }

    if (body.email === 'admin@neoconsulte.demo' && body.password === 'demo123') {
      return Response.json({ ok: true, user: { email: body.email, role: 'admin' }, redirect: '/admin' });
    }

    return Response.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
  } catch (error) {
    return Response.json({ ok: false, error: 'Requisição inválida' }, { status: 400 });
  }
}
