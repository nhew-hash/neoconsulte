import crypto from 'crypto';
import { prisma } from './db';

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return session;
}

export async function getSessionByToken(token: string) {
  if (!token) return null;
  return prisma.session.findUnique({ where: { token }, include: { user: true } });
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}
