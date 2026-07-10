import { BadRequestException } from '@nestjs/common';
import { GameMediaStatus, GameMediaType } from '../game-platform.types';

export type CreateGameMediaDto = { type?: unknown; sourceUrl?: unknown; cachedUrl?: unknown; status?: unknown; isOverride?: unknown; metadata?: unknown };
export type UpdateGameMediaDto = Partial<CreateGameMediaDto>;
export type NormalizedGameMediaInput = { type: GameMediaType; sourceUrl?: string | null; cachedUrl?: string | null; status: GameMediaStatus; isOverride: boolean; metadata?: Record<string, unknown> };

const TYPES: GameMediaType[] = ['COVER', 'ICON', 'THUMBNAIL', 'BANNER', 'LOGO', 'FALLBACK'];
const STATUSES: GameMediaStatus[] = ['PENDING', 'READY', 'BROKEN', 'FALLBACK'];

export function normalizeCreateGameMediaDto(body: CreateGameMediaDto): NormalizedGameMediaInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Media payload must be an object');
  return { type: requiredEnum(body.type, 'type', TYPES), sourceUrl: optionalUrl(body.sourceUrl, 'sourceUrl'), cachedUrl: optionalUrl(body.cachedUrl, 'cachedUrl'), status: optionalEnum(body.status, 'status', STATUSES, 'READY'), isOverride: optionalBoolean(body.isOverride, true), metadata: optionalObject(body.metadata, 'metadata') };
}

export function normalizeUpdateGameMediaDto(body: UpdateGameMediaDto): Partial<NormalizedGameMediaInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Media payload must be an object');
  const result: Partial<NormalizedGameMediaInput> = {};
  if (body.type !== undefined) result.type = requiredEnum(body.type, 'type', TYPES);
  if (body.sourceUrl !== undefined) result.sourceUrl = optionalUrl(body.sourceUrl, 'sourceUrl');
  if (body.cachedUrl !== undefined) result.cachedUrl = optionalUrl(body.cachedUrl, 'cachedUrl');
  if (body.status !== undefined) result.status = optionalEnum(body.status, 'status', STATUSES, 'READY');
  if (body.isOverride !== undefined) result.isOverride = optionalBoolean(body.isOverride, true);
  if (body.metadata !== undefined) result.metadata = optionalObject(body.metadata, 'metadata');
  if (Object.keys(result).length === 0) throw new BadRequestException('Media update payload is empty');
  return result;
}

function requiredEnum<T extends string>(value: unknown, field: string, allowed: T[]) { if (typeof value !== 'string') throw new BadRequestException(`${field} is required`); const normalized = value.trim().toUpperCase() as T; if (!allowed.includes(normalized)) throw new BadRequestException(`${field} is invalid`); return normalized; }
function optionalEnum<T extends string>(value: unknown, field: string, allowed: T[], fallback: T) { if (value === undefined || value === null || value === '') return fallback; return requiredEnum(value, field, allowed); }
function optionalBoolean(value: unknown, fallback: boolean) { if (value === undefined || value === null || value === '') return fallback; if (typeof value === 'boolean') return value; if (typeof value === 'string') { if (value.toLowerCase() === 'true') return true; if (value.toLowerCase() === 'false') return false; } throw new BadRequestException('boolean field is invalid'); }
function optionalUrl(value: unknown, field: string) { if (value === undefined || value === null || value === '') return null; if (typeof value !== 'string') throw new BadRequestException(`${field} must be a string`); const text = value.trim(); if (!/^https?:\/\//i.test(text)) throw new BadRequestException(`${field} must be http(s) URL`); if (text.length > 1200) throw new BadRequestException(`${field} is too long`); return text; }
function optionalObject(value: unknown, field: string) { if (value === undefined || value === null || value === '') return undefined; if (typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException(`${field} must be an object`); return value as Record<string, unknown>; }
