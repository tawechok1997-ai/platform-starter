import { GameExperienceService } from './game-experience.service';

const service = new GameExperienceService();

const activeProvider = {
  status: 'ACTIVE' as const,
  metadata: { providerStatus: 'ACTIVE' },
};

describe('GameExperienceService', () => {
  it('keeps an admin-disabled game unavailable when the provider reports active', () => {
    const availability = service.gameAvailability({
      status: 'INACTIVE',
      metadata: { providerStatus: 'ACTIVE' },
      provider: activeProvider,
    });

    expect(availability.available).toBe(false);
    expect(availability.reason).toBe('GAME_DISABLED_BY_ADMIN');
    expect(availability.effectiveStatus).toBe('INACTIVE');
  });

  it('blocks an admin-active game while the provider reports maintenance', () => {
    const availability = service.gameAvailability({
      status: 'ACTIVE',
      metadata: { providerStatus: 'MAINTENANCE' },
      provider: activeProvider,
    });

    expect(availability.available).toBe(false);
    expect(availability.reason).toBe('GAME_UNAVAILABLE_AT_PROVIDER');
    expect(availability.effectiveStatus).toBe('MAINTENANCE');
  });

  it('allows launch only when the game and provider are active in both control planes', () => {
    const availability = service.gameAvailability({
      status: 'ACTIVE',
      metadata: { providerStatus: 'ACTIVE' },
      provider: activeProvider,
    });

    expect(availability.available).toBe(true);
    expect(availability.reason).toBe('AVAILABLE');
    expect(availability.effectiveStatus).toBe('ACTIVE');
  });

  it('keeps legacy rows available by falling back to their admin status', () => {
    const availability = service.gameAvailability({
      status: 'ACTIVE',
      metadata: null,
      provider: { status: 'ACTIVE', metadata: null },
    });

    expect(availability.available).toBe(true);
  });

  it('merges provider reports without deleting existing admin metadata', () => {
    const metadata = service.mergeGameSyncMetadata(
      { platform: 'mobile', customLabel: 'Hot game' },
      {
        providerGameCode: 'slot-1',
        name: 'Slot One',
        category: 'slot',
        status: 'MAINTENANCE',
        rawPayload: { source: 'provider' },
      },
      new Date('2026-07-30T12:00:00.000Z'),
    );

    expect(metadata).toMatchObject({
      platform: 'mobile',
      customLabel: 'Hot game',
      reportedStatus: 'MAINTENANCE',
      providerStatus: 'MAINTENANCE',
      providerSyncAt: '2026-07-30T12:00:00.000Z',
      rawPayload: { source: 'provider' },
    });
  });

  it('records health checks separately from the admin provider status', () => {
    const metadata = service.mergeProviderHealthMetadata(
      { ownerNote: 'Do not auto-enable' },
      {
        ok: false,
        providerCode: 'demo',
        requestId: 'req-1',
        errorCode: 'TIMEOUT',
        errorMessage: 'Provider timed out',
      },
      new Date('2026-07-30T13:00:00.000Z'),
    );

    expect(metadata).toMatchObject({
      ownerNote: 'Do not auto-enable',
      reportedStatus: 'OFFLINE',
      providerStatus: 'MAINTENANCE',
      providerHealthCheckedAt: '2026-07-30T13:00:00.000Z',
      providerHealthRequestId: 'req-1',
      providerHealthErrorCode: 'TIMEOUT',
    });
  });
});
