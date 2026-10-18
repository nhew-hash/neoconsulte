import type { InboundEnvelope, QueryTransport } from './types';
import { DemoTransport } from './transports/demo';

/**
 * Ponto único para registrar canais. Para um canal real, implemente QueryTransport
 * (somente para fontes com autorização/contrato legítimo) e adicione um case aqui.
 */
export function createTransport(deliver?: (message: InboundEnvelope) => Promise<unknown>): QueryTransport {
  const name = process.env.QUERY_TRANSPORT ?? 'demo';
  switch (name) {
    case 'demo':
      return new DemoTransport(deliver);
    default:
      throw new Error(`QUERY_TRANSPORT desconhecido: "${name}". Registre o adaptador em lib/queue/registry.ts`);
  }
}
