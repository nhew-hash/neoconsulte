import { z } from 'zod';
import bcrypt from 'bcryptjs';

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, 10);

    return Response.json({
      ok: true,
      user: {
        name: body.name,
        email: body.email,
        role: 'customer',
      },
      passwordHash,
      note: 'Registro em modo demonstrativo. A autenticação real deve operar com sessão segura no backend e armazenamento seguro de senhas.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: 'Dados inválidos' }, { status: 400 });
  }
}
