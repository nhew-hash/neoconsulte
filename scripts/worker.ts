import 'dotenv/config';
import { dispatchPending, expireTimedOut, ingestResponse } from '../lib/queue/service';
import { createTransport } from '../lib/queue/registry';
import type { QueryTransport } from '../lib/queue/types';

const interval = Number(process.env.WORKER_INTERVAL_MS ?? 2000);

// o transporte entrega respostas de volta à fila via ingestResponse
const transport: QueryTransport = createTransport((message) => ingestResponse(message, transport));

let running = true;
for (const sig of ['SIGINT', 'SIGTERM'] as const) process.on(sig, () => (running = false));

async function main() {
  console.log(`[worker] iniciado (transporte: ${transport.name}, intervalo: ${interval}ms)`);
  while (running) {
    try {
      await dispatchPending(transport);
      await expireTimedOut();
    } catch (error) {
      console.error('[worker] erro no ciclo', error instanceof Error ? error.name : 'erro');
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  console.log('[worker] encerrado');
  process.exit(0);
}

main();
