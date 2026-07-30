export type ProviderReportedGameStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REMOVED';

type GameAvailabilityInput = {
  status: string;
  metadata?: unknown;
  provider: { status: string };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

export function readProviderGameStatus(metadata: unknown): ProviderReportedGameStatus | null {
  const record = asRecord(metadata);
  const value = record.providerStatus ?? record.reportedStatus;
  return value === 'ACTIVE' || value === 'INACTIVE' || value === 'MAINTENANCE' || value === 'REMOVED'
    ? value
    : null;
}

export function mergeProviderGameMetadata(
  metadata: unknown,
  status: ProviderReportedGameStatus,
  rawPayload: unknown,
): Record<string, unknown> {
  return {
    ...asRecord(metadata),
    reportedStatus: status,
    providerStatus: status,
    providerStatusUpdatedAt: new Date().toISOString(),
    rawPayload: rawPayload ?? null,
  };
}

export function isGameAvailableForMember(game: GameAvailabilityInput): boolean {
  if (game.status !== 'ACTIVE' || game.provider.status !== 'ACTIVE') return false;
  const providerStatus = readProviderGameStatus(game.metadata);
  return providerStatus === null || providerStatus === 'ACTIVE';
}
