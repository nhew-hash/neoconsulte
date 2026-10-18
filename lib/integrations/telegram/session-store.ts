import { prisma } from '@/lib/db';
import crypto from 'crypto';

const keyFromEnv = () => {
  const key = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY;
  if (!key) throw new Error('TELEGRAM_SESSION_ENCRYPTION_KEY not set. Generate 32 random bytes base64 and set this env var.');
  const buf = Buffer.from(key, 'base64');
  if (buf.length !== 32) throw new Error('TELEGRAM_SESSION_ENCRYPTION_KEY must be 32 bytes (base64).');
  return buf;
};

export async function saveSessionBlob(connectionName: string, sessionBlob: string, fingerprint?: string) {
  const key = keyFromEnv();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(sessionBlob, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  const stored = Buffer.concat([iv, tag, encrypted]).toString('base64');

  // ensure connection exists
  const conn = await prisma.telegramConnection.upsert({ where: { name: connectionName }, create: { name: connectionName, provider: 'gramjs', enabled: true }, update: {} });

  const s = await prisma.telegramSession.create({ data: { connectionId: conn.id, fingerprint: fingerprint ?? crypto.createHash('sha256').update(sessionBlob).digest('hex'), encryptedBlob: stored } });
  return s;
}

export async function loadLatestSession(connectionName: string) {
  const key = keyFromEnv();
  const conn = await prisma.telegramConnection.findFirst({ where: { name: connectionName } });
  if (!conn) return null;
  const s = await prisma.telegramSession.findFirst({ where: { connectionId: conn.id }, orderBy: { createdAt: 'desc' } });
  if (!s) return null;
  const data = Buffer.from(s.encryptedBlob, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return { sessionBlob: decrypted.toString('utf8'), sessionRecord: s };
}

export async function deleteSessions(connectionName: string) {
  const conn = await prisma.telegramConnection.findFirst({ where: { name: connectionName } });
  if (!conn) return 0;
  await prisma.telegramSession.deleteMany({ where: { connectionId: conn.id } });
  return 1;
}
