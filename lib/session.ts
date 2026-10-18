import crypto from 'crypto';
import { prisma } from './db';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  return prisma.session.create({
    data: { userId, token, expiresAt },
  });
}

export async function getSessionByToken(token: string) {
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;

  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    await prisma.session.deleteMany({ where: { token } });
    return null;
  }

  return session;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}
