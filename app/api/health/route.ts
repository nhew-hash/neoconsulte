export async function GET() {
  return Response.json({
    ok: true,
    provider: 'mock',
    status: 'demo-only',
    enabled: true,
    lastCheck: new Date().toISOString(),
    note: 'Provider simulado. A integração autorizada com Telegram deve ser validada antes da ativação em produção.',
  });
}
