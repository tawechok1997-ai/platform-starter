import { isGameAvailableForMember, mergeProviderGameMetadata, readProviderGameStatus } from './game-availability';

describe('game availability', () => {
  it('keeps legacy active games available when provider status has not been reported yet', () => {
    expect(isGameAvailableForMember({ status: 'ACTIVE', metadata: null, provider: { status: 'ACTIVE' } })).toBe(true);
  });

  it('stores provider status without overwriting existing admin metadata', () => {
    const metadata = mergeProviderGameMetadata({ adminNote: 'keep closed by admin' }, 'ACTIVE', { id: 'provider-game' });

    expect(metadata).toEqual(expect.objectContaining({
      adminNote: 'keep closed by admin',
      reportedStatus: 'ACTIVE',
      providerStatus: 'ACTIVE',
      rawPayload: { id: 'provider-game' },
    }));
    expect(readProviderGameStatus(metadata)).toBe('ACTIVE');
  });

  it('blocks a game that admin disabled even when provider reports active', () => {
    expect(isGameAvailableForMember({
      status: 'INACTIVE',
      metadata: { providerStatus: 'ACTIVE' },
      provider: { status: 'ACTIVE' },
    })).toBe(false);
  });

  it('blocks a game while its provider is disabled', () => {
    expect(isGameAvailableForMember({
      status: 'ACTIVE',
      metadata: { providerStatus: 'ACTIVE' },
      provider: { status: 'INACTIVE' },
    })).toBe(false);
  });

  it('blocks provider maintenance before member launch', () => {
    expect(isGameAvailableForMember({
      status: 'ACTIVE',
      metadata: { reportedStatus: 'MAINTENANCE' },
      provider: { status: 'ACTIVE' },
    })).toBe(false);
  });
});
