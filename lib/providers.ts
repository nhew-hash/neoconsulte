export type QueryCategory = 'CPF' | 'CNPJ' | 'Nome' | 'Telefone' | 'Placa';

export interface QueryRequestInput {
  category: QueryCategory;
  input: string;
  customerId?: string;
}

export interface QueryResponse {
  ok: boolean;
  requestId: string;
  correlationId: string;
  provider: 'mock';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  costCredits: number;
  category: QueryCategory;
  providerNote: string;
}

export interface ProviderHealthStatus {
  name: string;
  enabled: boolean;
  status: 'healthy' | 'degraded' | 'offline';
  lastCheck: string;
  message: string;
}

export interface QueryProvider {
  name: string;
  enabled: boolean;
  process(input: QueryRequestInput): Promise<QueryResponse>;
  health(): Promise<ProviderHealthStatus>;
}

export class MockQueryProvider implements QueryProvider {
  name = 'mock';
  enabled = true;

  async process(input: QueryRequestInput): Promise<QueryResponse> {
    const requestId = `demo-${Date.now()}`;
    const correlationId = `corr-${Math.random().toString(36).slice(2, 10)}`;

    return {
      ok: true,
      requestId,
      correlationId,
      provider: 'mock',
      status: 'queued',
      costCredits: 2,
      category: input.category,
      providerNote: 'Provider em modo de demonstração. Nenhum dado real é apresentado.',
    };
  }

  async health(): Promise<ProviderHealthStatus> {
    return {
      name: this.name,
      enabled: this.enabled,
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      message: 'Demo provider ativo sem conexão real com Telegram.',
    };
  }
}

export class QueryJobService {
  async enqueue(input: QueryRequestInput): Promise<QueryResponse> {
    const provider = new MockQueryProvider();
    return provider.process(input);
  }
}

export class ProviderHealthService {
  async checkAll(): Promise<ProviderHealthStatus[]> {
    const provider = new MockQueryProvider();
    return [await provider.health()];
  }
}
