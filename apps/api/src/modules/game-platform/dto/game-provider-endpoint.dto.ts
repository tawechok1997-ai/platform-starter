import { BadRequestException } from '@nestjs/common';
import { GameProviderEndpointType } from '../game-platform.types';

export type CreateGameProviderEndpointDto = {
  type?: unknown;
  url?: unknown;
  method?: unknown;
  timeoutMs?: unknown;
  retryCount?: unknown;
  isEnabled?: unknown;
};

export type UpdateGameProviderEndpointDto = Partial<CreateGameProviderEndpointDto>;

export type NormalizedGameProviderEndpointInput = {
  type: GameProviderEndpointType;
  url: string;
  method: string;
  timeoutMs: number;
  retryCount: number;
  isEnabled: boolean;
};

const ENDPOINT_TYPES: GameProviderEndpointType[] = ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'];
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export function normalizeCreateGameProviderEndpointDto(body: CreateGameProviderEndpointDto): NormalizedGameProviderEndpointInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Endpoint payload must be an object');
  return {
    type: requiredEnum(body.type, 'type', ENDPOINT_TYPES),
    url: requiredUrl(body.url, 'url', 1200),
    method: optionalMethod(body.method, 'method', 'POST'),
    timeoutMs: optionalInteger(body.timeoutMs, 'timeoutMs', 10000, 1000, 120000),
    retryCount: optionalInteger(body.retryCount, 'retryCount', 2, 0, 10),
    isEnabled: optionalBoolean(body.isEnabled, true),
  };
}

export function normalizeUpdateGameProviderEndpointDto(body: UpdateGameProviderEndpointDto): Partial<NormalizedGameProviderEndpointInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Endpoint payload must be an object');
  const result: Partial<NormalizedGameProviderEndpointInput> = {};
  if (body.type !== undefined) result.type = requiredEnum(body.type, 'type', ENDPOINT_TYPES);
  if (body.url !== undefined) result.url = requiredUrl(body.url, 'url', 1200);
  if (body.method !== undefined) result.method = optionalMethod(body.method, 'method', 'POST');
  if (body.timeoutMs !== undefined) result.timeoutMs = optionalInteger(body.timeoutMs, 'timeoutMs', 10000, 1000, 120000);
  if (body.retryCount !== undefined) result.retryCount = optionalInteger(body.retryCount, 'retryCount', 2, 0, 10);
  if (body.isEnabled !== undefined) result.isEnabled = optionalBoolean(body.isEnabled, true);
  if (Object.keys(result).length === 0) throw new BadRequestException('Endpoint update payload is empty');
  return result;
}

function requiredEnum<TValue extends string>(value: unknown, field: string, allowed: TValue[]) {
  if (typeof value !== 'string') throw new BadRequestException(`${field} is required`);
  const normalized = value.trim().toUpperCase() as TValue;
  if (!allowed.includes(normalized)) throw new BadRequestException(`${field} is invalid`);
  return normalized;
}

function requiredUrl(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string') throw new BadRequestException(`${field} is required`);
  const text = value.trim();
  if (!/^https?:\/\//i.test(text)) throw new BadRequestException(`${field} must be http(s) URL`);
  if (text.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return text;
}

function optionalMethod(value: unknown, field: string, fallback: string) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') throw new BadRequestException(`${field} must be a string`);
  const normalized = value.trim().toUpperCase();
  if (!METHODS.includes(normalized)) throw new BadRequestException(`${field} is invalid`);
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
  throw new BadRequestException('isEnabled must be boolean');
}
