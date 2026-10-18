import crypto from 'crypto';
import { Prisma, QueryStatus, type QueryRequest } from '@prisma/client';
import { prisma } from '../db';
import { decrypt, encrypt } from '../crypto';
import { MAX_SEND_ATTEMPTS, QUERY_COST_CREDITS, backoffMs, queryTimeoutMs } from './constants';
import type { IngestOutcome, InboundEnvelope, QueryTransport } from './types';

type Db = Prisma.TransactionClient | typeof prisma;

export class InsufficientCreditsError extends Error {
  constructor() {
    super('Saldo insuficiente');
    this.name = 'InsufficientCreditsError';
  }
}

const isUniqueViolation = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';

const newCorrelationId = () => `nc_${crypto.randomBytes(9).toString('base64url')}`;

export function maskInput(value: string) {
  const clean = value.trim();
  if (clean.length <= 4) return '*'.repeat(clean.length);
  return `${'*'.repeat(clean.length - 2)}${clean.slice(-2)}`;
}

function addEvent(db: Db, requestId: string, status: QueryStatus, note: string) {
  return db.queryStatusEvent.create({ data: { requestId, status, note } });
}

/* ------------------------------------------------------------------ */
/* 1) Criação: débito atômico + registro na fila (idempotente)         */
/* ------------------------------------------------------------------ */
export async function createQuery(p: {
  userId: string;
  category: string;
  input: string;
  providerName: string;
  idempotencyKey?: string | null;
}): Promise<{ request: QueryRequest; duplicate: boolean }> {
  const key = p.idempotencyKey || null;

  const findExisting = () =>
    key
      ? prisma.queryRequest.findUnique({
          where: { userId_idempotencyKey: { userId: p.userId, idempotencyKey: key } },
        })
      : Promise.resolve(null);

  const existing = await findExisting();
  if (existing) return { request: existing, duplicate: true };

  try {
    const request = await prisma.$transaction(async (tx) => {
      const debited = await tx.creditAccount.updateMany({
        where: { userId: p.userId, balance: { gte: QUERY_COST_CREDITS } },
        data: { balance: { decrement: QUERY_COST_CREDITS } },
      });
      if (debited.count !== 1) throw new InsufficientCreditsError();

      const account = await tx.creditAccount.findUniqueOrThrow({ where: { userId: p.userId } });
      const now = new Date();

      const req = await tx.queryRequest.create({
        data: {
          userId: p.userId,
          category: p.category,
          rawInput: maskInput(p.input),
          payloadEnc: encrypt(p.input),
          providerName: p.providerName,
          idempotencyKey: key,
          status: QueryStatus.WAITING,
          costCredits: QUERY_COST_CREDITS,
          correlationId: newCorrelationId(),
          deadlineAt: new Date(now.getTime() + queryTimeoutMs()),
          nextAttemptAt: now,
        },
      });

      await tx.creditTransaction.create({
        data: {
          accountId: account.id,
          amount: -QUERY_COST_CREDITS,
          type: 'consumed',
          reason: `Consulta ${p.category}`,
          reference: req.id,
        },
      });
      await addEvent(tx, req.id, QueryStatus.WAITING, 'Solicitação enfileirada');
      return req;
    });
    return { request, duplicate: false };
  } catch (error) {
    // Corrida entre duas requisições com a mesma chave: a transação perdedora foi revertida (sem débito).
    if (key && isUniqueViolation(error)) {
      const winner = await findExisting();
      if (winner) return { request: winner, duplicate: true };
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* 2) Falha com estorno único                                          */
/* ------------------------------------------------------------------ */
// O UPDATE condicional (refunded=false + status ativo) garante que só UMA chamada estorna.
export async function failRequest(id: string, code: string, note: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const res = await tx.queryRequest.updateMany({
      where: {
        id,
        refunded: false,
        status: { in: [QueryStatus.WAITING, QueryStatus.PROCESSING, QueryStatus.REVIEW] },
      },
      data: {
        status: QueryStatus.FAILED,
        errorCode: code,
        refunded: true,
        completedAt: new Date(),
        payloadEnc: null,
      },
    });
    if (res.count !== 1) return false;

    const req = await tx.queryRequest.findUniqueOrThrow({ where: { id } });
    const account = await tx.creditAccount.update({
      where: { userId: req.userId },
      data: { balance: { increment: req.costCredits } },
    });
    await tx.creditTransaction.create({
      data: {
        accountId: account.id,
        amount: req.costCredits,
        type: 'refund',
        reason: `Estorno consulta ${req.category}`,
        reference: id,
      },
    });
    await addEvent(tx, id, QueryStatus.FAILED, note);
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* 3) Despacho (worker)                                                */
/* ------------------------------------------------------------------ */
export async function dispatchPending(transport: QueryTransport, limit = 10): Promise<number> {
  const now = new Date();
  const candidates = await prisma.queryRequest.findMany({
    where: {
      status: QueryStatus.WAITING,
      providerName: transport.name,
      nextAttemptAt: { lte: now },
      deadlineAt: { gt: now },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true },
  });

  let dispatched = 0;

  for (const { id } of candidates) {
    // "claim" atômico: se outro worker pegou antes, count = 0
    const claimed = await prisma.queryRequest.updateMany({
      where: { id, status: QueryStatus.WAITING },
      data: { status: QueryStatus.PROCESSING, dispatchedAt: new Date(), attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;

    const req = await prisma.queryRequest.findUniqueOrThrow({ where: { id } });
    await addEvent(prisma, id, QueryStatus.PROCESSING, `Envio (tentativa ${req.attempts})`);

    try {
      if (!req.payloadEnc || !req.correlationId) throw new Error('payload ausente');
      const sent = await transport.send({
        correlationId: req.correlationId,
        category: req.category,
        input: decrypt(req.payloadEnc),
      });
      await prisma.queryRequest.updateMany({
        where: { id, status: QueryStatus.PROCESSING },
        data: { payloadEnc: null, providerRequestId: sent?.externalRef ?? null },
      });
      dispatched++;
    } catch (err) {
      // nunca logar a entrada nem a mensagem do erro (pode conter conteúdo sensível)
      console.error('[queue] falha no envio', id, err instanceof Error ? err.name : 'erro');
      if (req.attempts >= MAX_SEND_ATTEMPTS) {
        await failRequest(id, 'SEND_FAILED', 'Falha ao enviar ao provider; créditos estornados');
      } else {
        await prisma.queryRequest.updateMany({
          where: { id, status: QueryStatus.PROCESSING },
          data: { status: QueryStatus.WAITING, nextAttemptAt: new Date(Date.now() + backoffMs(req.attempts)) },
        });
      }
    }
  }
  return dispatched;
}

/* ------------------------------------------------------------------ */
/* 4) Timeouts                                                         */
/* ------------------------------------------------------------------ */
export async function expireTimedOut(): Promise<number> {
  const stale = await prisma.queryRequest.findMany({
    where: {
      status: { in: [QueryStatus.WAITING, QueryStatus.PROCESSING] },
      deadlineAt: { lte: new Date() },
    },
    select: { id: true },
    take: 50,
  });
  let expired = 0;
  for (const { id } of stale) {
    if (await failRequest(id, 'TIMEOUT', 'Tempo esgotado; créditos estornados')) expired++;
  }
  return expired;
}

/* ------------------------------------------------------------------ */
/* 5) Recebimento de respostas                                         */
/* ------------------------------------------------------------------ */
export async function ingestResponse(
  msg: InboundEnvelope,
  parser: Pick<QueryTransport, 'parse'>,
): Promise<IngestOutcome> {
  // Deduplicação: o conteúdo NÃO é guardado, só o id da mensagem.
  const externalId = `${msg.transport}:${msg.externalMessageId}`;
  try {
    await prisma.inboundMessage.create({
      data: { externalId, correlationId: msg.correlationId, outcome: 'PENDING' },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return 'duplicate';
    throw e;
  }

  const finish = async (outcome: IngestOutcome) => {
    await prisma.inboundMessage.update({ where: { externalId }, data: { outcome } });
    return outcome;
  };

  // Associação SOMENTE por correlationId exato (+ mesmo transporte). Nunca por "palpite".
  const req = await prisma.queryRequest.findUnique({ where: { correlationId: msg.correlationId } });
  if (!req || req.providerName !== msg.transport) return finish('unmatched');

  // Resposta atrasada/fora de estado (ex.: após timeout e estorno) não altera nada.
  if (req.status !== QueryStatus.PROCESSING) {
    await addEvent(prisma, req.id, req.status, 'Resposta recebida fora de estado válido; ignorada');
    return finish('ignored');
  }

  const parsed = parser.parse(msg.text);

  if (parsed.kind === 'result') {
    const done = await prisma.queryRequest.updateMany({
      where: { id: req.id, status: QueryStatus.PROCESSING },
      data: {
        status: QueryStatus.COMPLETED,
        providerResult: encrypt(JSON.stringify({ text: parsed.text })),
        completedAt: new Date(),
        payloadEnc: null,
      },
    });
    if (done.count !== 1) return finish('ignored');
    await addEvent(prisma, req.id, QueryStatus.COMPLETED, 'Resposta recebida');
    return finish('completed');
  }

  if (parsed.kind === 'error') {
    const code = /^[A-Z_]{1,40}$/.test(parsed.code) ? parsed.code : 'PROVIDER_ERROR';
    await failRequest(req.id, code, 'Provider retornou erro; créditos estornados');
    return finish('failed');
  }

  // Mensagem inesperada: não inventa resultado e não estorna sozinho; vai para revisão.
  const moved = await prisma.queryRequest.updateMany({
    where: { id: req.id, status: QueryStatus.PROCESSING },
    data: { status: QueryStatus.REVIEW },
  });
  if (moved.count === 1) await addEvent(prisma, req.id, QueryStatus.REVIEW, 'Resposta inesperada; revisão manual');
  return finish('review');
}

/* ------------------------------------------------------------------ */
/* 6) Revisão manual (admin)                                           */
/* ------------------------------------------------------------------ */
export async function resolveReviewAsFailed(id: string): Promise<boolean> {
  const req = await prisma.queryRequest.findUnique({ where: { id }, select: { status: true } });
  if (!req || req.status !== QueryStatus.REVIEW) return false;
  return failRequest(id, 'ADMIN_REVIEW', 'Encerrada pela administração; créditos estornados');
}

/* ------------------------------------------------------------------ */
/* 7) Leitura protegida                                                */
/* ------------------------------------------------------------------ */
const ERROR_MESSAGES: Record<string, string> = {
  TIMEOUT: 'Tempo esgotado. Os créditos foram estornados.',
  SEND_FAILED: 'Não foi possível enviar a solicitação. Os créditos foram estornados.',
  NOT_FOUND: 'Nenhum registro encontrado. Os créditos foram estornados.',
  ADMIN_REVIEW: 'Solicitação encerrada pela administração. Os créditos foram estornados.',
  PROVIDER_ERROR: 'O provedor retornou um erro. Os créditos foram estornados.',
};

export function toDto(r: QueryRequest, withResult = false) {
  let result: string | undefined;
  if (withResult && r.status === QueryStatus.COMPLETED && r.providerResult) {
    try {
      result = JSON.parse(decrypt(r.providerResult)).text as string;
    } catch {
      result = undefined;
    }
  }
  return {
    id: r.id,
    category: r.category,
    maskedInput: r.rawInput,
    status: r.status,
    costCredits: r.costCredits,
    refunded: r.refunded,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
    error: r.status === QueryStatus.FAILED ? (ERROR_MESSAGES[r.errorCode ?? ''] ?? ERROR_MESSAGES.PROVIDER_ERROR) : null,
    result,
  };
}

// Sempre filtra por userId: nenhum usuário lê consulta de outro.
export async function getQueryForUser(userId: string, id: string) {
  const r = await prisma.queryRequest.findFirst({ where: { id, userId } });
  return r ? toDto(r, true) : null;
}

export async function listQueriesForUser(userId: string, take = 20) {
  const rows = await prisma.queryRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
  });
  return rows.map((r) => toDto(r, false));
}
