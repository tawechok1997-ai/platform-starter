import { BadRequestException } from '@nestjs/common';
import { GameProviderCredentialType } from '../game-platform.types';

export type CreateGameProviderCredentialDto = {
  type?: unknown;
  value?: unknown;
  isEnabled?: unknown;
};

export type UpdateGameProviderCredentialDto = Partial<CreateGameProviderCredentialDto>;

export type NormalizedGameProviderCredentialInput = {
  type: GameProviderCredentialType;
  value: string;
  isEnabled: boolean;
};

export type NormalizedGameProviderCredentialUpdate = Partial<NormalizedGameProviderCredentialInput>;

const CREDENTIAL_TYPES: GameProviderCredentialType[] = ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'AGENT_ID', 'WEBHOOK_SECRET', 'TOKEN'];

export function normalizeCreateGameProviderCredentialDto(body: CreateGameProviderCredentialDto): NormalizedGameProviderCredentialInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Credential payload must be an object');
  return {
    type: requiredEnum(body.type, 'type', CREDENTIAL_TYPES),
    value: requiredString(body.value, 'value', 4000),
    isEnabled: optionalBoolean(body.isEnabled, true),
  };
}

export function normalizeUpdateGameProviderCredentialDto(body: UpdateGameProviderCredentialDto): NormalizedGameProviderCredentialUpdate {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BadRequestException('Credential payload must be an object');
  const result: NormalizedGameProviderCredentialUpdate = {};
  if (body.type !== undefined) result.type = requiredEnum(body.type, 'type', CREDENTIAL_TYPES);
  if (body.value !== undefined) result.value = requiredString(body.value, 'value', 4000);
  if (body.isEnabled !== undefined) result.isEnabled = optionalBoolean(body.isEnabled, true);
  if (Object.keys(result).length === 0) throw new BadRequestException('Credential update payload is empty');
  return result;
}

function requiredEnum<TValue extends string>(value: unknown, field: string, allowed: TValue[]) {
  if (typeof value !== 'string') throw new BadRequestException(`${field} is required`);
  const normalized = value.trim().toUpperCase() as TValue;
  if (!allowed.includes(normalized)) throw new BadRequestException(`${field} is invalid`);
  return normalized;
}

function requiredString(value: unknown, field: string, maxLength: number) {
  if (typeof value !== 'string') throw new BadRequestException(`${field} is required`);
  const text = value.trim();
  if (!text) throw new BadRequestException(`${field} is required`);
  if (text.length > maxLength) throw new BadRequestException(`${field} is too long`);
  return text;
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
