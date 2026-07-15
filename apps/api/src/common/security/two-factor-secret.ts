import type { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1';

function encryptionKey(config: Pick<ConfigService, 'get'>) {
  const source =
    config.get<string>('TWO_FACTOR_ENCRYPTION_KEY')?.trim() ?? process.env.TWO_FACTOR_ENCRYPTION_KEY?.trim();
  if (!source) {
    if (process.env.NODE_ENV === 'production') throw new Error('TWO_FACTOR_ENCRYPTION_KEY is required in production');
    return createHash('sha256').update('local_two_factor_encryption_key').digest();
  }
  return createHash('sha256').update(source).digest();
}

export function protectTwoFactorSecret(secret: string, config: Pick<ConfigService, 'get'>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(config), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function revealTwoFactorSecret(value: string | null | undefined, config: Pick<ConfigService, 'get'>) {
  if (!value) return null;
  if (!value.startsWith(`${PREFIX}:`)) return value;
  const [, , ivRaw, tagRaw, encryptedRaw] = value.split(':');
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error('Stored two-factor secret is invalid');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(config), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8');
}
