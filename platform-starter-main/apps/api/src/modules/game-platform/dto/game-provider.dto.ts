import { BadRequestException } from '@nestjs/common';
import { GameProviderStatus, GameProviderWalletMode } from '../game-platform.types';

export type CreateGameProviderDto = {
  name?: unknown;
  code?: unknown;
  logoUrl?: unknown;
  status?: unknown;
  walletMode?: unknown;
  currency?: unknown;
  timezone?: unknown;
  sortOrder?: unknown;
  metadata?: unknown;
};

export type UpdateGameProviderDto = Partial<CreateGameProviderDto>;

export type NormalizedGameProviderInput = {
  name: string;
  code: string;
  logoUrl?: string | null;
  status: GameProviderStatus;
  walletMode: GameProviderWalletMode;
  currency: string;
  timezone: string;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
};

const PROVIDER_STATUSES: GameProviderStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED'];
const WALLET_MODES: GameProviderWalletMode[] = ['SEAMLESS', 'TRANSFER', 'HYBRID'];

export function normalizeCreateGameProviderDto(body: CreateGameProviderDto): NormalizedGameProviderInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Provider payload must be an object');
  const name = requiredString(body.name, 'name', 120);
  const code = normalizeCode(requiredString(body.code, 'code', 80));
  return {
    name,
    code,
    logoUrl: optionalString(body.logoUrl, 'logoUrl', 500),
    status: optionalEnum(body.status, 'status', PROVIDER_STATUSES, 'INACTIVE'),
    walletMode: optionalEnum(body.walletMode, 'walletMode', WALLET_MODES, 'TRANSFER'),
    currency: optionalString(body.currency, 'currency', 10, 'THB')!.toUpperCase(),
    timezone: optionalString(body.timezone, 'timezone', 80, 'Asia/Bangkok')!,
    sortOrder: optionalInteger(body.sortOrder, 'sortOrder', 100),
    metadata: optionalObject(body.metadata, 'metadata'),
  };
}

export function normalizeUpdateGameProviderDto(body: UpdateGameProviderDto): Partial<NormalizedGameProviderInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Provider payload must be an object');
  const result: Partial<NormalizedGameProviderInput> = {};
  if (body.name !== undefined) result.name = requiredString(body.name, 'name', 120);
  if (body.code !== undefined) result.code = normalizeCode(requiredString(body.code, 'code', 80));
  if (body.logoUrl !== undefined) result.logoUrl = optionalString(body.logoUrl, 'logoUrl', 500);
  if (body.status !== undefined) result.status = optionalEnum(body.status, 'status', PROVIDER_STATUSES, 'INACTIVE');
  if (body.walletMode !== undefined) result.walletMode = optionalEnum(body.walletMode, 'walletMode', WALLET_MODES, 'TRANSFER');
  if (body.currency !== undefined) result.currency = optionalString(body.currency, 'currency', 10, 'THB')!.toUpperCase();
  if (body.timezone !== undefined) result.timezone = optionalString(body.timezone, 'timezone', 80, 'Asia/Bangkok')!;
  if (body.sortOrder !== undefined) result.sortOrder = optionalInteger(body.sortOrder, 'sortOrder', 100);
  if (body.metadata !== undefined) result.metadata = optionalObject(body.metadata, 'metadata');
  if (Object.keys(result).length === 0) throw new BadRequestException('Provider update payload is empty');
  return result;
}

function requiredString(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string') throw new BadRequestException(`${field} is required`);
  const text = value.trim();
  if (!text) throw new BadRequestException(`${field} is required`);
  if (text.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return text;
}

function optionalString(value: unknown, field: string, maxLength: number, fallback?: string) {
  if (value === undefined) return fallback;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new BadRequestException(`${field} must be a string`);
  const text = value.trim();
  if (text.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return text || null;
}

function optionalInteger(value: unknown, field: string, fallback: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(number)) throw new BadRequestException(`${field} must be an integer`);
  return number;
}

function optionalEnum<TValue extends string>(value: unknown, field: string, allowed: TValue[], fallback: TValue) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') throw new BadRequestException(`${field} must be a string`);
  const normalized = value.trim().toUpperCase() as TValue;
  if (!allowed.includes(normalized)) throw new BadRequestException(`${field} is invalid`);
  return normalized;
}

function optionalObject(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException(`${field} must be an object`);
  return value as Record<string, unknown>;
}

function normalizeCode(value: string) {
  const code = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!code) throw new BadRequestException('code is invalid');
  return code;
}
