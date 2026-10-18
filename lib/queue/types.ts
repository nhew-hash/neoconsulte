// Contrato entre a fila e qualquer canal de saída/entrada.
// Implemente QueryTransport apenas para fontes com autorização/contrato legítimo.

export interface OutboundMessage {
  correlationId: string; // único e imprevisível; o canal deve devolvê-lo na resposta
  category: string;
  input: string;
}

export type ParsedResponse =
  | { kind: 'result'; text: string }
  | { kind: 'error'; code: string }
  | { kind: 'unexpected' };

export interface QueryTransport {
  readonly name: string;
  /** Lance erro SOMENTE se tiver certeza de que nada foi enviado (o envio será repetido). */
  send(message: OutboundMessage): Promise<{ externalRef?: string } | void>;
  /** Interpreta o texto cru recebido. Nunca deve inventar conteúdo. */
  parse(text: string): ParsedResponse;
}

export interface InboundEnvelope {
  transport: string;
  externalMessageId: string; // id único da mensagem no canal (deduplicação)
  correlationId: string;
  text: string;
}

export type IngestOutcome = 'completed' | 'failed' | 'review' | 'duplicate' | 'unmatched' | 'ignored';
