import { QueryProvider, QueryResponse, QueryRequestInput, ProviderHealthStatus } from '@/lib/providers';
import { GramjsClient } from './gramjs-client';
import { prisma } from '@/lib/db';

export class GramjsTelegramProvider implements QueryProvider {
  name = 'telegram-gramjs';
  enabled = process.env.PROVIDER_TELEGRAM_ENABLED === 'true';
  client: GramjsClient | null = null;

  constructor() {
    if (this.enabled) {
      this.client = new GramjsClient('default');
    }
  }

  async process(input: QueryRequestInput): Promise<QueryResponse> {
    if (!this.enabled || !this.client) {
      return {
        ok: false,
        requestId: `tg-disabled-${Date.now()}`,
        correlationId: `corr-${Math.random().toString(36).slice(2, 10)}`,
        provider: 'telegram-gramjs',
        status: 'failed',
        costCredits: 0,
        category: input.category,
        providerNote: 'Telegram provider disabled or not configured.',
      };
    }

    // For a real integration, map input to a chatId and send a message or trigger a flow.
    // For now, we attempt to send to a configured chat id.
    const chatId = process.env.PROVIDER_TELEGRAM_CHAT_ID;
    try {
      const res = await this.client.sendMessage(chatId ?? 'me', `${input.category}: ${input.input}`);
      return {
        ok: true,
        requestId: `tg-${Date.now()}`,
        correlationId: `corr-${Math.random().toString(36).slice(2, 10)}`,
        provider: 'telegram-gramjs',
        status: 'queued',
        costCredits: 2,
        category: input.category,
        providerNote: 'Mensagem enviada ao chat configurado via gramjs client (verificar delivery).',
      };
    } catch (err: any) {
      return {
        ok: false,
        requestId: `tg-err-${Date.now()}`,
        correlationId: `corr-${Math.random().toString(36).slice(2, 10)}`,
        provider: 'telegram-gramjs',
        status: 'failed',
        costCredits: 0,
        category: input.category,
        providerNote: `Erro ao enviar via Telegram: ${err?.message ?? String(err)}`,
      };
    }
  }

  async health(): Promise<ProviderHealthStatus> {
    return {
      name: this.name,
      enabled: this.enabled,
      status: this.enabled ? 'healthy' : 'offline',
      lastCheck: new Date().toISOString(),
      message: this.enabled ? 'Gramjs provider enabled' : 'Disabled',
    };
  }
}
