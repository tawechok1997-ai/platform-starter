import { GamePlatformMonitoringService } from './game-platform-monitoring.service';

function setup(input: {
  providers?: Array<Record<string, unknown>>;
  activeSessions?: number;
  pendingTransfers?: number;
  failedTransfers?: number;
  reversedTransfers?: number;
  failedWebhooks?: number;
  duplicateWebhooks?: number;
  mismatchSnapshots?: number;
  unknownSnapshots?: number;
  registeredCodes?: string[];
} = {}) {
  const countResults = [
    input.activeSessions ?? 0,
    input.pendingTransfers ?? 0,
    input.failedTransfers ?? 0,
    input.reversedTransfers ?? 0,
    input.failedWebhooks ?? 0,
    input.duplicateWebhooks ?? 0,
    input.mismatchSnapshots ?? 0,
    input.unknownSnapshots ?? 0,
  ];
  const prisma = {
    gameProvider: { findMany: jest.fn().mockResolvedValue(input.providers ?? []) },
    gameSession: { count: jest.fn().mockResolvedValue(countResults[0]) },
    gameTransfer: {
      count: jest.fn()
        .mockResolvedValueOnce(countResults[1])
        .mockResolvedValueOnce(countResults[2])
        .mockResolvedValueOnce(countResults[3]),
    },
    webhookLog: {
      count: jest.fn()
        .mockResolvedValueOnce(countResults[4])
        .mockResolvedValueOnce(countResults[5]),
    },
    providerWalletSnapshot: {
      count: jest.fn()
        .mockResolvedValueOnce(countResults[6])
        .mockResolvedValueOnce(countResults[7]),
    },
  } as any;
  const codes = input.registeredCodes ?? [];
  const registry = {
    hasAdapter: jest.fn((code: string) => codes.includes(code)),
    listAdapterCodes: jest.fn(() => [...codes]),
  } as any;
  return { service: new GamePlatformMonitoringService(prisma, registry), prisma, registry };
}

function provider(code: string, status = 'ACTIVE') {
  return {
    id: `${code}-id`,
    name: code,
    code,
    status,
    walletMode: 'TRANSFER',
    updatedAt: new Date('2026-07-20T00:00:00.000Z'),
  };
}

describe('GamePlatformMonitoringService', () => {
  it('reports HEALTHY when all monitored signals are clear', async () => {
    const { service } = setup({
      providers: [provider('demo-provider')],
      activeSessions: 2,
      registeredCodes: ['demo-provider'],
    });

    const result = await service.overview();

    expect(result.status).toBe('HEALTHY');
    expect(result.providers).toEqual(expect.objectContaining({ total: 1, active: 1, missingAdapter: 0 }));
    expect(result.sessions.active).toBe(2);
    expect(result.signals).toEqual({ critical: 0, warning: 0 });
  });

  it('reports DEGRADED for warning-only signals', async () => {
    const { service } = setup({
      providers: [provider('demo-provider', 'DEGRADED')],
      pendingTransfers: 2,
      duplicateWebhooks: 1,
      registeredCodes: ['demo-provider'],
    });

    const result = await service.overview();

    expect(result.status).toBe('DEGRADED');
    expect(result.signals.critical).toBe(0);
    expect(result.signals.warning).toBe(4);
  });

  it('reports CRITICAL for failed money flow, reconciliation or missing adapters', async () => {
    const { service } = setup({
      providers: [provider('unregistered-provider')],
      failedTransfers: 2,
      failedWebhooks: 1,
      mismatchSnapshots: 3,
      unknownSnapshots: 1,
      registeredCodes: [],
    });

    const result = await service.overview();

    expect(result.status).toBe('CRITICAL');
    expect(result.providers.missingAdapter).toBe(1);
    expect(result.reconciliation.unresolved).toBe(4);
    expect(result.signals.critical).toBe(8);
  });

  it('returns the registered adapter inventory for diagnostics', async () => {
    const { service } = setup({ registeredCodes: ['demo-provider', 'generic-transfer'] });

    const result = await service.overview();

    expect(result.adapters).toEqual({
      registeredCodes: ['demo-provider', 'generic-transfer'],
      registeredCount: 2,
    });
  });
});
