import { prisma } from './db';
import { QUERY_COST_CREDITS } from './queue/constants';
import { createQuery } from './queue/service';

export { QUERY_COST_CREDITS };

export type QueryCategory = 'CPF' | 'CNPJ' | 'Nome' | 'Telefone' | 'Placa';

export interface QueryRequestInput {
  category: QueryCategory;
  input: string;
  customerId?: string;
  idempotencyKey?: string | null;
}

export interface QueryResponse {
  ok: boolean;
  requestId: string;
  correlationId: string;
  provider: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  costCredits: number;
  category: QueryCategory;
  providerNote: string;
  duplicate?: boolean;
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

/** Provider síncrono antigo, mantido só como referência/demonstração (não toca no banco). */
export class MockQueryProvider implements QueryProvider {
  name = 'mock';
  enabled = true;

  async process(input: QueryRequestInput): Promise<QueryResponse> {
    return {
      ok: true,
      requestId: `demo-${Date.now()}`,
      correlationId: `corr-${Math.random().toString(36).slice(2, 10)}`,
      provider: 'mock',
      status: 'queued',
      costCredits: QUERY_COST_CREDITS,
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
      message: 'Provider de demonstração ativo.',
    };
  }
}

/**
 * Provider assíncrono: registra a solicitação na fila (com débito atômico) e devolve "queued".
 * O envio e o recebimento da resposta acontecem no worker (scripts/worker.ts) via QueryTransport.
 */
export class QueueQueryProvider implements QueryProvider {
  name: string;
  enabled = true;

  constructor(name: string = process.env.QUERY_TRANSPORT ?? 'demo') {
    this.name = name;
  }

  async process(input: QueryRequestInput): Promise<QueryResponse> {
    if (!input.customerId) throw new Error('customerId obrigatório');

    const { request, duplicate } = await createQuery({
      userId: input.customerId,
      category: input.category,
      input: input.input,
      providerName: this.name,
      idempotencyKey: input.idempotencyKey,
    });

    return {
      ok: true,
      requestId: request.id,
      correlationId: request.correlationId ?? '',
      provider: this.name,
      status: 'queued',
      costCredits: request.costCredits,
      category: input.category,
      providerNote: duplicate ? 'Solicitação já registrada (idempotente); sem nova cobrança.' : 'Solicitação enfileirada.',
      duplicate,
    };
  }

  async health(): Promise<ProviderHealthStatus> {
    const oldWaiting = await prisma.queryRequest.count({
      where: { status: 'WAITING', providerName: this.name, createdAt: { lt: new Date(Date.now() - 60_000) } },
    });
    return {
      name: this.name,
      enabled: this.enabled,
      status: oldWaiting > 0 ? 'degraded' : 'healthy',
      lastCheck: new Date().toISOString(),
      message: oldWaiting > 0 ? `${oldWaiting} solicitação(ões) aguardando há mais de 1 min (worker ativo?)` : 'Fila em dia.',
    };
  }
}

export class QueryJobService {
  async enqueue(input: QueryRequestInput): Promise<QueryResponse> {
    return new QueueQueryProvider().process(input);
  }
}

export class ProviderHealthService {
  async checkAll(): Promise<ProviderHealthStatus[]> {
    return [await new QueueQueryProvider().health()];
  }
}
