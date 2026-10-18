import { ProviderHealthService } from '@/lib/providers';

export async function GET() {
  const service = new ProviderHealthService();
  const health = await service.checkAll();

  return Response.json({
    ok: true,
    providers: health,
    note: 'Provider mock ativo. Conexão com Telegram deve ser validada com autorização do fornecedor antes da ativação em produção.',
  });
}
