import crypto from 'crypto';

// AES-256-GCM. Chave em DATA_ENCRYPTION_KEY (32 bytes em base64).
function getKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error('DATA_ENCRYPTION_KEY não configurada (veja .env.example)');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('DATA_ENCRYPTION_KEY deve ter 32 bytes em base64');
  return key;
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload: string): string {
  const [iv, tag, data] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  if (!iv || !tag || !data) throw new Error('payload criptografado inválido');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
