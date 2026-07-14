import { UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const RECOVERY_CODE_COUNT = 10;

export function generateAdminTwoFactorSecret() {
  const bytes = randomBytes(20);
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  }
  return output;
}

export function generateAdminRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const value = randomBytes(9)
      .toString('base64url')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .padEnd(12, '0')
      .slice(0, 12);
    return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
  });
}

export function normalizeAdminRecoveryCode(value: string) {
  return String(value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function assertAdminTotp(secret: string | null, code: string, now = Date.now()) {
  if (!secret) throw new UnauthorizedException('Two factor secret is missing');
  const normalized = String(code ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) throw new UnauthorizedException('Invalid code');
  const counter = Math.floor(now / 1000 / 30);
  const valid = [-1, 0, 1].some((offset) => generateTotp(secret, counter + offset) === normalized);
  if (!valid) throw new UnauthorizedException('Invalid code');
}

function generateTotp(secret: string, counter: number) {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buffer.writeUInt32BE(counter >>> 0, 4);
  const hmac = createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

function base32Decode(value: string) {
  const clean = value.toUpperCase().replace(/=+$/g, '').replace(/\s/g, '');
  let bits = '';
  for (const char of clean) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) throw new UnauthorizedException('Invalid two factor secret');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
