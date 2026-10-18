import { QueryJobService, MockQueryProvider, type QueryProvider, type QueryRequestInput, type QueryResponse, type ProviderHealthStatus } from '@/lib/providers';

export type QueryCategory = 'CPF' | 'CNPJ' | 'Nome' | 'Telefone' | 'Placa';

export { MockQueryProvider };

export class TelegramDemoProvider implements QueryProvider {
  name = 'telegram-demo';
  enabled = process.env.PROVIDER_TELEGRAM_ENABLED === 'true' || process.env.PROVIDER_TELEGRAM_DEMO_MODE === 'true';

  async process(input: QueryRequestInput): Promise<QueryResponse> {
    if (!this.enabled) {
      return {
        ok: false,
        requestId: `telegram-disabled-${Date.now()}`,
        correlationId: `corr-${Math.random().toString(36).slice(2, 10)}`,
        provider: 'telegram-demo',
        status: 'failed',
        costCredits: 0,
        category: input.category,
        providerNote: 'Integração Telegram desligada. O projeto permanece em modo demonstrativo até validação do cliente autorizado.',
      };
    }

    const service = new QueryJobService();
    const queued = await service.enqueue({ category: input.category, input: input.input, customerId: input.customerId });

    return {
      ok: queued.ok,
      requestId: queued.requestId,
      correlationId: queued.correlationId,
      provider: 'telegram-demo',
      status: queued.status,
      costCredits: queued.costCredits,
      category: input.category,
      providerNote: 'A comunicação Telegram está em adaptação modular. O canal permanece em modo demonstrativo até validação do cliente e das permissões.',
    };
  }

  async health(): Promise<ProviderHealthStatus> {
    return {
      name: this.name,
      enabled: this.enabled,
      status: this.enabled ? 'healthy' : 'offline',
      lastCheck: new Date().toISOString(),
      message: this.enabled
        ? 'Adaptador Telegram em modo demo, pronto para receber autenticação autorizada e troca de sessão segura.'
        : 'Telegram disabled; mock provider is the active fallback.',
    };
  }
}
