/*
  GramJS client wrapper.
  This file dynamically imports gramjs at runtime. If you haven't installed gramjs,
  the client will throw a helpful error explaining the required env vars and command.

  Implementation notes:
  - The actual GramJS usage (auth/QR flows) depends on the gramjs API versions.
  - This wrapper provides a stable interface for the rest of the application.
*/

import { prisma } from '@/lib/db';
import crypto from 'crypto';

export type GramjsLoginResult = {
  qr?: string; // data uri or token
  fallback?: string; // phone/code instructions
};

export class GramjsClient {
  private client: any = null;
  private connected = false;

  constructor(private connectionName = 'default') {}

  private ensureInstalled() {
    try {
      // Attempt to require gramjs dynamically
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('gramjs');
      return mod;
    } catch (err) {
      throw new Error(
        'Missing dependency: gramjs is required for real Telegram integration. Run `npm install gramjs` and provide TELEGRAM_API_ID and TELEGRAM_API_HASH in environment.'
      );
    }
  }

  async initFromLatestSession() {
    // Try to load latest session blob from DB
    const session = await prisma.telegramSession.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!session) return false;

    const blob = session.encryptedBlob;
    const key = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY;
    if (!key) throw new Error('TELEGRAM_SESSION_ENCRYPTION_KEY is not set');

    const decrypted = decryptBlob(blob, key);
    const GramJS = this.ensureInstalled();

    // The real gramjs initialization varies by API; leaving hook for implementer
    // Example (pseudo): this.client = new GramJS.Client({ apiId, apiHash, session: decrypted });
    this.client = { placeholder: true, session: decrypted };
    this.connected = true;
    return true;
  }

  async startQrLogin(): Promise<GramjsLoginResult> {
    const GramJS = this.ensureInstalled();
    // Real implementation must call the appropriate gramjs methods to request QR/login token
    // For now, return a placeholder and instruct the operator to install gramjs and run in real mode.
    return { qr: undefined, fallback: 'QR login not available until gramjs is installed and configured.' };
  }

  async completeLogin(sessionBlob: string) {
    // Save encrypted session blob
    const key = process.env.TELEGRAM_SESSION_ENCRYPTION_KEY;
    if (!key) throw new Error('TELEGRAM_SESSION_ENCRYPTION_KEY is not set');

    const encrypted = encryptBlob(sessionBlob, key);
    await prisma.telegramConnection.upsert({
      where: { name: 'default' },
      update: {},
      create: { name: this.connectionName, provider: 'gramjs', enabled: true },
    });

    const conn = await prisma.telegramConnection.findFirst({ where: { name: this.connectionName } });
    await prisma.telegramSession.create({ data: { connectionId: conn!.id, fingerprint: crypto.createHash('sha256').update(sessionBlob).digest('hex'), encryptedBlob: encrypted } });

    // set local client state
    this.client = { session: sessionBlob };
    this.connected = true;
  }

  async sendMessage(chatId: string, text: string) {
    if (!this.connected) throw new Error('Client not connected');
    // Real implementation: send via gramjs
    // Persist event in DB
    const conn = await prisma.telegramConnection.findFirst({ where: { name: this.connectionName } });
    if (!conn) throw new Error('No TelegramConnection configured');

    const event = await prisma.telegramEvent.create({ data: { connectionId: conn.id, chatId, from: 'system', text, direction: 'outgoing' } });
    return { ok: true, messageId: event.id };
  }

  async consumeEvents(): Promise<any[]> {
    if (!this.connected) return [];
    // Real implementation: fetch events from gramjs listener
    return [];
  }

  async disconnect() {
    this.client = null;
    this.connected = false;
  }
}

function encryptBlob(plain: string, base64Key: string) {
  const key = Buffer.from(base64Key, 'base64');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptBlob(blob: string, base64Key: string) {
  const key = Buffer.from(base64Key, 'base64');
  const data = Buffer.from(blob, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
