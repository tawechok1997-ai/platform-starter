import { BadRequestException } from '@nestjs/common';
import { GameStatus } from '../game-platform.types';

export type CreateGameDto = {
  providerId?: unknown;
  providerGameCode?: unknown;
  name?: unknown;
  category?: unknown;
  status?: unknown;
  sortOrder?: unknown;
  isFeatured?: unknown;
  isNew?: unknown;
  isPopular?: unknown;
  metadata?: unknown;
};

export type UpdateGameDto = Partial<CreateGameDto>;

export type NormalizedGameInput = {
  providerId: string;
  providerGameCode: string;
  name: string;
  category: string;
  status: GameStatus;
  sortOrder: number;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  metadata?: Record<string, unknown>;
};

const GAME_STATUSES: GameStatus[] = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REMOVED'];

export function normalizeCreateGameDto(body: CreateGameDto): NormalizedGameInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Game payload must be an object');
  return {
    providerId: requiredString(body.providerId, 'providerId', 120),
    providerGameCode: requiredCode(body.providerGameCode, 'providerGameCode', 160),
    name: requiredString(body.name, 'name', 240),
    category: requiredCode(body.category, 'category', 80),
    status: optionalEnum(body.status, 'status', GAME_STATUSES, 'INACTIVE'),
    sortOrder: optionalInteger(body.sortOrder, 'sortOrder', 100, 0, 999999),
    isFeatured: optionalBoolean(body.isFeatured, false),
    isNew: optionalBoolean(body.isNew, false),
    isPopular: optionalBoolean(body.isPopular, false),
    metadata: optionalObject(body.metadata, 'metadata'),
  };
}

export function normalizeUpdateGameDto(body: UpdateGameDto): Partial<NormalizedGameInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Game payload must be an object');
  const result: Partial<NormalizedGameInput> = {};
  if (body.providerId !== undefined) result.providerId = requiredString(body.providerId, 'providerId', 120);
  if (body.providerGameCode !== undefined) result.providerGameCode = requiredCode(body.providerGameCode, 'providerGameCode', 160);
  if (body.name !== undefined) result.name = requiredString(body.name, 'name', 240);
  if (body.category !== undefined) result.category = requiredCode(body.category, 'category', 80);
  if (body.status !== undefined) result.status = optionalEnum(body.status, 'status', GAME_STATUSES, 'INACTIVE');
  if (body.sortOrder !== undefined) result.sortOrder = optionalInteger(body.sortOrder, 'sortOrder', 100, 0, 999999);
  if (body.isFeatured !== undefined) result.isFeatured = optionalBoolean(body.isFeatured, false);
  if (body.isNew !== undefined) result.isNew = optionalBoolean(body.isNew, false);
  if (body.isPopular !== undefined) result.isPopular = optionalBoolean(body.isPopular, false);
  if (body.metadata !== undefined) result.metadata = optionalObject(body.metadata, 'metadata');
  if (Object.keys(result).length === 0) throw new BadRequestException('Game update payload is empty');
  return result;
}

function requiredString(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string') throw new BadRequestException(`${field} is required`);
  const text = value.trim();
  if (!text) throw new BadRequestException(`${field} is required`);
  if (text.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return text;
}

function requiredCode(value: unknown, field: string, maxLength: number) {
  const text = requiredString(value, field, maxLength).toLowerCase();
  if (!/^[a-z0-9._:-]+$/.test(text)) throw new BadRequestException(`${field} contains invalid characters`);
  return text;
}

function optionalEnum<TValue extends string>(value: unknown, field: string, allowed: TValue[], fallback: TValue) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') throw new BadRequestException(`${field} must be a string`);
  const normalized = value.trim().toUpperCase() as TValue;
  if (!allowed.includes(normalized)) throw new BadRequestException(`${field} is invalid`);
  return normalized;
}

function optionalInteger(value: unknown, field: string, fallback: number, min: number, max: number) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(number) || number < min || number > max) throw new BadRequestException(`${field} must be an integer between ${min} and ${max}`);
  return number;
}

function optionalBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  throw new BadRequestException('boolean field is invalid');
}

function optionalObject(value: unknown, field: string) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException(`${field} must be an object`);
  return value as Record<string, unknown>;
}
