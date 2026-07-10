import { BadRequestException } from '@nestjs/common';

export type ProviderGatesDto = {
  launchEnabled?: unknown;
  transferEnabled?: unknown;
  realMoneyEnabled?: unknown;
  webhookSettlementEnabled?: unknown;
};

const FLAG_KEYS = ['launchEnabled', 'transferEnabled', 'realMoneyEnabled', 'webhookSettlementEnabled'] as const;

export function normalizeProviderGatesDto(body: ProviderGatesDto) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Provider gates payload must be an object');
  const result: Record<string, boolean> = {};
  for (const key of FLAG_KEYS) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== 'boolean') throw new BadRequestException(`${key} must be boolean`);
    result[key] = value;
  }
  if (Object.keys(result).length === 0) throw new BadRequestException('At least one provider gate must be supplied');
  return result as Partial<Record<(typeof FLAG_KEYS)[number], boolean>>;
}
