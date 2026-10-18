import crypto from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../lib/db';
import { decrypt, encrypt } from '../lib/crypto';
import { DemoTransport } from '../lib/queue/transports/demo';
import { querySchema } from '../lib/queue/validation';
import {
  InsufficientCreditsError,
  createQuery,
  dispatchPending,
  expireTimedOut,
  failRequest,
  getQueryForUser,
  ingestResponse,
  resolveReviewAsFailed,
} from '../lib/queue/service';
import type { OutboundMessage, ParsedResponse, QueryTransport } from '../lib/queue/types';

class FakeTransport implements QueryTransport {
  readonly name = 'demo';
  sent: OutboundMessage[] = [];
  failTimes = 0;

  async send(m: OutboundMessage) {
    if (this.failTimes > 0) {
      this.failTimes--;
      throw new Error('falha simulada');
    }
    this.sent.push(m);
    return { externalRef: 'ref' };
  }

  parse(text: string): ParsedResponse {
    if (text.startsWith('OK ')) return { kind: 'result', text: text.slice(3) };
    if (text.startsWith('ERR ')) return { kind: 'error', code: text.slice(4) };
    return { kind: 'unexpected' };
  }
}

async function makeUser(balance = 10) {
  return prisma.user.create({
    data: { email: `${crypto.randomUUID()}@teste.dev`, passwordHash: 'x', creditAccount: { create: { balance } } },
  });
}

async function balanceOf(userId: string) {
  return (await prisma.creditAccount.findUniqueOrThrow({ where: { userId } })).balance;
}

async function enqueue(userId: string, input = '12345678901', key?: string) {
  return createQuery({ userId, category: 'CPF', input, providerName: 'demo', idempotencyKey: key });
}

const inbound = (correlationId: string, text: string, id = crypto.randomUUID()) => ({
  transport: 'demo',
  externalMessageId: id,
  correlationId,
  text,
});

beforeEach(async () => {
  await prisma.queryStatusEvent.deleteMany();
  await prisma.inboundMessage.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.queryRequest.deleteMany();
});

describe('utilitários', () => {
  it('criptografa e descriptografa; rejeita adulteração', () => {
    const enc = encrypt('texto secreto');
    expect(enc).not.toContain('texto secreto');
    expect(decrypt(enc)).toBe('texto secreto');
    const [iv, tag, data] = enc.split('.');
    const tampered = [iv, tag, Buffer.from('xx').toString('base64') + data.slice(4)].join('.');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('valida a entrada por categoria', () => {
    expect(querySchema.safeParse({ category: 'CPF', input: '12345678901' }).success).toBe(true);
    expect(querySchema.safeParse({ category: 'CPF', input: '123' }).success).toBe(false);
    expect(querySchema.safeParse({ category: 'Placa', input: 'ABC1D23' }).success).toBe(true);
    expect(querySchema.safeParse({ category: 'CNPJ', input: '1234' }).success).toBe(false);
  });
});

describe('fila de consultas', () => {
  it('fluxo completo: débito, envio, resposta, resultado protegido', async () => {
    const user = await makeUser(10);
    const fake = new FakeTransport();
    const { request } = await enqueue(user.id);
    expect(await balanceOf(user.id)).toBe(8);
    expect(request.rawInput).not.toContain('1234567');

    await dispatchPending(fake, 100);
    const sent = fake.sent.find((m) => m.correlationId === request.correlationId);
    expect(sent?.input).toBe('12345678901');

    let row = await prisma.queryRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(row.status).toBe('PROCESSING');
    expect(row.payloadEnc).toBeNull();

    const outcome = await ingestResponse(inbound(request.correlationId!, 'OK resultado de demonstração'), fake);
    expect(outcome).toBe('completed');

    const dto = await getQueryForUser(user.id, request.id);
    expect(dto?.status).toBe('COMPLETED');
    expect(dto?.result).toBe('resultado de demonstração');
    expect(await balanceOf(user.id)).toBe(8);

    row = await prisma.queryRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(row.providerResult).not.toContain('demonstração');
  });

  it('idempotência: mesma chave não cobra duas vezes', async () => {
    const user = await makeUser(10);
    const a = await enqueue(user.id, '12345678901', 'chave-de-teste-1');
    const b = await enqueue(user.id, '12345678901', 'chave-de-teste-1');
    expect(b.duplicate).toBe(true);
    expect(b.request.id).toBe(a.request.id);
    expect(await balanceOf(user.id)).toBe(8);
    expect(await prisma.queryRequest.count({ where: { userId: user.id } })).toBe(1);
  });

  it('saldo insuficiente não cria solicitação nem debita', async () => {
    const user = await makeUser(1);
    await expect(enqueue(user.id)).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(await balanceOf(user.id)).toBe(1);
    expect(await prisma.queryRequest.count()).toBe(0);
  });

  it('timeout falha a consulta e estorna uma única vez', async () => {
    const user = await makeUser(10);
    const { request } = await enqueue(user.id);
    await prisma.queryRequest.update({ where: { id: request.id }, data: { deadlineAt: new Date(Date.now() - 1000) } });

    expect(await expireTimedOut()).toBe(1);
    expect(await expireTimedOut()).toBe(0);
    expect(await balanceOf(user.id)).toBe(10);

    const row = await prisma.queryRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(row.status).toBe('FAILED');
    expect(row.errorCode).toBe('TIMEOUT');
    expect(await prisma.creditTransaction.count({ where: { reference: request.id, type: 'refund' } })).toBe(1);
  });

  it('estornos concorrentes: só um é aplicado', async () => {
    const user = await makeUser(10);
    const { request } = await enqueue(user.id);
    const results = await Promise.all([
      failRequest(request.id, 'TIMEOUT', 'a'),
      failRequest(request.id, 'TIMEOUT', 'b'),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await balanceOf(user.id)).toBe(10);
  });

  it('ignora duplicadas, sem correlação e respostas atrasadas', async () => {
    const user = await makeUser(10);
    const fake = new FakeTransport();
    const first = await enqueue(user.id, '12345678901');
    const second = await enqueue(user.id, '10987654321');
    await dispatchPending(fake, 100);

    expect(await ingestResponse(inbound(first.request.correlationId!, 'OK a', 'msg-1'), fake)).toBe('completed');
    expect(await ingestResponse(inbound(first.request.correlationId!, 'OK a', 'msg-1'), fake)).toBe('duplicate');
    expect(await ingestResponse(inbound('nc_inexistente', 'OK x'), fake)).toBe('unmatched');

    // segunda expira e é estornada; resposta tardia não a reabre
    await prisma.queryRequest.update({ where: { id: second.request.id }, data: { deadlineAt: new Date(Date.now() - 1000) } });
    await expireTimedOut();
    expect(await ingestResponse(inbound(second.request.correlationId!, 'OK tardio'), fake)).toBe('ignored');

    const late = await getQueryForUser(user.id, second.request.id);
    expect(late?.status).toBe('FAILED');
    expect(late?.result).toBeUndefined();
    expect(await balanceOf(user.id)).toBe(8); // 10 - 2 (primeira concluída); segunda estornada
  });

  it('erro do provider falha e estorna', async () => {
    const user = await makeUser(10);
    const fake = new FakeTransport();
    const { request } = await enqueue(user.id);
    await dispatchPending(fake, 100);

    expect(await ingestResponse(inbound(request.correlationId!, 'ERR NOT_FOUND'), fake)).toBe('failed');
    expect(await balanceOf(user.id)).toBe(10);
    const dto = await getQueryForUser(user.id, request.id);
    expect(dto?.status).toBe('FAILED');
    expect(dto?.error).toContain('estornados');
  });

  it('mensagem inesperada vai para revisão sem inventar resultado; admin encerra com estorno único', async () => {
    const user = await makeUser(10);
    const fake = new FakeTransport();
    const { request } = await enqueue(user.id);
    await dispatchPending(fake, 100);

    expect(await ingestResponse(inbound(request.correlationId!, 'texto aleatório'), fake)).toBe('review');
    let dto = await getQueryForUser(user.id, request.id);
    expect(dto?.status).toBe('REVIEW');
    expect(dto?.result).toBeUndefined();
    expect(await balanceOf(user.id)).toBe(8);

    expect(await resolveReviewAsFailed(request.id)).toBe(true);
    expect(await resolveReviewAsFailed(request.id)).toBe(false);
    expect(await balanceOf(user.id)).toBe(10);
    dto = await getQueryForUser(user.id, request.id);
    expect(dto?.status).toBe('FAILED');
  });

  it('falha de envio: tenta novamente e, esgotadas as tentativas, estorna', async () => {
    const user = await makeUser(10);
    const fake = new FakeTransport();
    fake.failTimes = 99;
    const { request } = await enqueue(user.id);

    for (let i = 0; i < 3; i++) {
      await dispatchPending(fake, 100);
      await prisma.queryRequest.updateMany({
        where: { id: request.id, status: 'WAITING' },
        data: { nextAttemptAt: new Date(Date.now() - 1000) },
      });
    }

    const row = await prisma.queryRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(row.status).toBe('FAILED');
    expect(row.errorCode).toBe('SEND_FAILED');
    expect(row.attempts).toBe(3);
    expect(row.payloadEnc).toBeNull();
    expect(await balanceOf(user.id)).toBe(10);
  });

  it('outro usuário não lê a consulta', async () => {
    const owner = await makeUser(10);
    const other = await makeUser(10);
    const { request } = await enqueue(owner.id);
    expect(await getQueryForUser(other.id, request.id)).toBeNull();
    expect(await getQueryForUser(owner.id, request.id)).not.toBeNull();
  });
});

describe('transporte de demonstração (ponta a ponta)', () => {
  async function waitFor(check: () => Promise<boolean>, ms = 2000) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (await check()) return true;
      await new Promise((r) => setTimeout(r, 20));
    }
    return false;
  }

  it('entrada terminada em 1 conclui; terminada em 0 falha e estorna', async () => {
    const user = await makeUser(10);
    const transport: DemoTransport = new DemoTransport((m) => ingestResponse(m, transport), 10);

    const ok = await enqueue(user.id, '12345678901');
    const bad = await enqueue(user.id, '12345678900');
    await dispatchPending(transport, 100);

    const done = await waitFor(async () => {
      const rows = await prisma.queryRequest.findMany({ where: { userId: user.id } });
      return rows.every((r) => r.status === 'COMPLETED' || r.status === 'FAILED');
    });
    expect(done).toBe(true);

    expect((await getQueryForUser(user.id, ok.request.id))?.result).toContain('simulado');
    expect((await getQueryForUser(user.id, bad.request.id))?.status).toBe('FAILED');
    expect(await balanceOf(user.id)).toBe(8);
  });
});
