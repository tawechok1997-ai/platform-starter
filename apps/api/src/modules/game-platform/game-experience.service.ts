import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { GameProviderStatus, GameStatus } from './game-platform.types';
import type { ProviderAdapterResult, ProviderGamePayload } from './provider-adapter.interface';

type MetadataValue = Prisma.JsonValue | null | undefined;
type ProviderHealthPayload = { status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; latencyMs?: number };

type ProviderAvailabilityInput = {
  status: GameProviderStatus | string;
  metadata?: MetadataValue;
};

type GameAvailabilityInput = {
  status: GameStatus | string;
  metadata?: MetadataValue;
  provider: ProviderAvailabilityInput;
};

export type GameAvailability = {
  available: boolean;
  adminStatus: string;
  gameProviderStatus: GameStatus;
  providerAdminStatus: string;
  providerReportedStatus: GameProviderStatus;
  effectiveStatus: GameStatus;
  reason:
    | 'AVAILABLE'
    | 'GAME_DISABLED_BY_ADMIN'
    | 'GAME_UNAVAILABLE_AT_PROVIDER'
    | 'PROVIDER_DISABLED_BY_ADMIN'
    | 'PROVIDER_UNAVAILABLE';
};

const GAME_STATUSES = new Set<GameStatus>(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REMOVED']);
const PROVIDER_STATUSES = new Set<GameProviderStatus>(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DEGRADED']);

@Injectable()
export class GameExperienceService {
  mergeGameSyncMetadata(metadata: MetadataValue, payload: ProviderGamePayload, checkedAt = new Date()): Prisma.InputJsonValue {
    return {
      ...this.metadataObject(metadata),
      rawPayload: this.jsonValue(payload.rawPayload),
      reportedStatus: payload.status,
      providerStatus: payload.status,
      providerSyncAt: checkedAt.toISOString(),
    };
  }

  mergeProviderHealthMetadata(
    metadata: MetadataValue,
    result: ProviderAdapterResult<ProviderHealthPayload>,
    checkedAt = new Date(),
  ): Prisma.InputJsonValue {
    const reportedStatus = result.ok ? (result.payload?.status ?? 'ONLINE') : 'OFFLINE';
    return {
      ...this.metadataObject(metadata),
      reportedStatus,
      providerStatus: this.normalizeProviderHealth(reportedStatus),
      providerHealthCheckedAt: checkedAt.toISOString(),
      providerHealthLatencyMs: result.payload?.latencyMs ?? null,
      providerHealthRequestId: result.requestId,
      providerHealthErrorCode: result.errorCode ?? null,
      providerHealthErrorMessage: result.errorMessage ?? null,
    };
  }

  providerAvailability(provider: ProviderAvailabilityInput) {
    const adminStatus = String(provider.status);
    const providerStatus = this.readProviderStatus(provider.metadata, adminStatus);
    if (adminStatus !== 'ACTIVE') {
      return {
        available: false,
        adminStatus,
        providerStatus,
        reason: 'PROVIDER_DISABLED_BY_ADMIN' as const,
      };
    }
    if (providerStatus !== 'ACTIVE') {
      return {
        available: false,
        adminStatus,
        providerStatus,
        reason: 'PROVIDER_UNAVAILABLE' as const,
      };
    }
    return {
      available: true,
      adminStatus,
      providerStatus,
      reason: 'AVAILABLE' as const,
    };
  }

  gameAvailability(game: GameAvailabilityInput): GameAvailability {
    const adminStatus = String(game.status);
    const gameProviderStatus = this.readGameStatus(game.metadata, adminStatus);
    const provider = this.providerAvailability(game.provider);

    if (adminStatus !== 'ACTIVE') {
      return {
        available: false,
        adminStatus,
        gameProviderStatus,
        providerAdminStatus: provider.adminStatus,
        providerReportedStatus: provider.providerStatus,
        effectiveStatus: adminStatus === 'MAINTENANCE' ? 'MAINTENANCE' : adminStatus === 'REMOVED' ? 'REMOVED' : 'INACTIVE',
        reason: 'GAME_DISABLED_BY_ADMIN',
      };
    }
    if (!provider.available) {
      return {
        available: false,
        adminStatus,
        gameProviderStatus,
        providerAdminStatus: provider.adminStatus,
        providerReportedStatus: provider.providerStatus,
        effectiveStatus: provider.providerStatus === 'MAINTENANCE' || provider.providerStatus === 'DEGRADED' ? 'MAINTENANCE' : 'INACTIVE',
        reason: provider.reason,
      };
    }
    if (gameProviderStatus !== 'ACTIVE') {
      return {
        available: false,
        adminStatus,
        gameProviderStatus,
        providerAdminStatus: provider.adminStatus,
        providerReportedStatus: provider.providerStatus,
        effectiveStatus: gameProviderStatus,
        reason: 'GAME_UNAVAILABLE_AT_PROVIDER',
      };
    }
    return {
      available: true,
      adminStatus,
      gameProviderStatus,
      providerAdminStatus: provider.adminStatus,
      providerReportedStatus: provider.providerStatus,
      effectiveStatus: 'ACTIVE',
      reason: 'AVAILABLE',
    };
  }

  isGameAvailable(game: GameAvailabilityInput) {
    return this.gameAvailability(game).available;
  }

  private readGameStatus(metadata: MetadataValue, fallback: string): GameStatus {
    const value = String(this.metadataObject(metadata).providerStatus ?? fallback).toUpperCase();
    return GAME_STATUSES.has(value as GameStatus) ? (value as GameStatus) : 'INACTIVE';
  }

  private readProviderStatus(metadata: MetadataValue, fallback: string): GameProviderStatus {
    const value = String(this.metadataObject(metadata).providerStatus ?? fallback).toUpperCase();
    return PROVIDER_STATUSES.has(value as GameProviderStatus) ? (value as GameProviderStatus) : 'INACTIVE';
  }

  private normalizeProviderHealth(status: ProviderHealthPayload['status']): GameProviderStatus {
    if (status === 'ONLINE') return 'ACTIVE';
    if (status === 'DEGRADED') return 'DEGRADED';
    return 'MAINTENANCE';
  }

  private metadataObject(metadata: MetadataValue): Prisma.JsonObject {
    return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Prisma.JsonObject)
      : {};
  }

  private jsonValue(value: unknown): Prisma.InputJsonValue | null {
    if (value === undefined || value === null) return null;
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
