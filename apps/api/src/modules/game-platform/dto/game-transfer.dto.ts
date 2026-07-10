import { BadRequestException } from '@nestjs/common';

export type CreateGameTransferDto = { amount?: unknown };

export function normalizeTransferAmount(body: CreateGameTransferDto) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Transfer payload must be an object');
  const raw = body.amount;
  if (raw === undefined || raw === null || raw === '') throw new BadRequestException('amount is required');
  const value = typeof raw === 'number' ? raw : Number(String(raw).trim());
  if (!Number.isFinite(value) || value <= 0) throw new BadRequestException('amount must be greater than zero');
  if (value > 9999999) throw new BadRequestException('amount is too large for dry-run transfer');
  return value.toFixed(2);
}
