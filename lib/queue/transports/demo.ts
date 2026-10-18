import crypto from 'crypto';
import type { InboundEnvelope, OutboundMessage, ParsedResponse, QueryTransport } from '../types';

/**
 * Transporte de demonstração: simula um canal assíncrono SEM dados reais.
 * Comportamento pelo ÚLTIMO caractere da entrada:
 *   '0' -> erro simulado (NOT_FOUND)      '8' -> mensagem fora do formato (vai para revisão)
 *   '9' -> nunca responde (timeout)       qualquer outro -> resultado simulado
 */
export class DemoTransport implements QueryTransport {
  readonly name = 'demo';

  constructor(
    private deliver?: (message: InboundEnvelope) => Promise<unknown>,
    private delayMs = 1500,
  ) {}

  async send(message: OutboundMessage) {
    if (!this.deliver) throw new Error('DemoTransport sem callback de entrega');
    const deliver = this.deliver;
    const externalRef = `demo-${message.correlationId}`;
    const last = message.input.trim().slice(-1);

    if (last === '9') return { externalRef }; // silêncio proposital

    const text =
      last === '0'
        ? '[DEMO] ERRO NOT_FOUND'
        : last === '8'
          ? 'mensagem fora do formato esperado'
          : `[DEMO] OK Resultado simulado para a categoria ${message.category}. Nenhum dado real.`;

    setTimeout(() => {
      deliver({
        transport: this.name,
        externalMessageId: `demo-msg-${crypto.randomUUID()}`,
        correlationId: message.correlationId,
        text,
      }).catch(() => undefined);
    }, this.delayMs);

    return { externalRef };
  }

  parse(text: string): ParsedResponse {
    if (text.startsWith('[DEMO] OK')) return { kind: 'result', text: text.slice('[DEMO] OK'.length).trim() };
    const m = /^\[DEMO\] ERRO ([A-Z_]{1,40})$/.exec(text);
    if (m) return { kind: 'error', code: m[1] };
    return { kind: 'unexpected' };
  }
}
