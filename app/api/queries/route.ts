import { z } from 'zod';
import { QueryJobService } from '@/lib/providers';

const requestSchema = z.object({
  category: z.enum(['CPF', 'CNPJ', 'Nome', 'Telefone', 'Placa']),
  input: z.string().min(3),
  customerId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const service = new QueryJobService();
    const result = await service.enqueue(body);

    return Response.json({
      ok: true,
      ...result,
      message: 'Solicitação registrada em modo demonstrativo. Nenhum dado real é apresentado.',
    });
  } catch (error) {
    return Response.json({ ok: false, error: 'Payload inválido' }, { status: 400 });
  }
}
