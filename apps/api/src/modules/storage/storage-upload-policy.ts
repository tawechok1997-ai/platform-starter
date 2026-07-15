import { BadRequestException } from '@nestjs/common';

const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;

const SIGNATURES: Record<string, (data: Buffer) => boolean> = {
  'image/jpeg': (data) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  'image/png': (data) =>
    data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (data) =>
    data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP',
  'application/pdf': (data) => data.length >= 5 && data.subarray(0, 5).toString('ascii') === '%PDF-',
  'text/plain': (data) => !data.includes(0),
};

const ALLOWED_MIME_TYPES = new Set([
  ...Object.keys(SIGNATURES),
  'image/gif',
  'image/svg+xml',
  'application/json',
  'application/octet-stream',
]);

const BLOCKED_MIME_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'application/javascript',
  'text/javascript',
  'application/x-httpd-php',
  'application/x-sh',
  'application/x-executable',
]);

export function validateStoredUpload(data: Buffer, contentType: string): void {
  if (!Buffer.isBuffer(data) || data.length === 0) throw new BadRequestException('Stored file must not be empty');

  const maxBytes = readMaxBytes();
  if (data.length > maxBytes) throw new BadRequestException(`Stored file exceeds ${maxBytes} byte limit`);

  const normalized = normalizeContentType(contentType);
  if (!normalized || BLOCKED_MIME_TYPES.has(normalized) || !ALLOWED_MIME_TYPES.has(normalized)) {
    throw new BadRequestException('Stored file MIME type is not allowed');
  }

  const signature = SIGNATURES[normalized];
  if (signature && !signature(data)) throw new BadRequestException('Stored file signature does not match MIME type');

  if (normalized === 'image/svg+xml') validateSvg(data);
}

function readMaxBytes(): number {
  const value = Number(process.env.STORAGE_MAX_UPLOAD_BYTES ?? DEFAULT_MAX_BYTES);
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_MAX_BYTES;
}

function normalizeContentType(value: string): string {
  return String(value ?? '').split(';', 1)[0].trim().toLowerCase();
}

function validateSvg(data: Buffer): void {
  const source = data.toString('utf8').slice(0, 1_000_000);
  if (!/<svg\b/i.test(source)) throw new BadRequestException('Stored SVG content is invalid');
  if (/<script\b|\bon\w+\s*=|javascript:|<foreignObject\b/i.test(source)) {
    throw new BadRequestException('Stored SVG contains unsafe active content');
  }
}
