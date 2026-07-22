import { AdapterTestService } from './adapter-test.service';

const provider = (code: string, environment: 'PRODUCTION' | 'UAT' | 'DEMO') => ({
  id: 'provider-1', code, walletMode: 'TRANSFER', currency: 'THB', metadata: { environment }, endpoints: [], credentials: [],
});

describe('AdapterTestService safety', () => {
  it('limits safe production tests to health and webhook checks', async () => {
    const prisma = { gameProvider: { findUnique: jest.fn().mockResolvedValue(provider('real-provider', 'PRODUCTION')) }, adminAuditLog: { create: jest.fn() } };
    const registry = { getAdapter: jest.fn(), hasAdapter: jest.fn() };
    const service = new AdapterTestService(prisma as any, registry as any, { get: jest.fn() } as any);

    await expect(service.run('provider-1', 'launchGame', { testMode: 'SAFE' }, { id: 'admin-1' }, {})).rejects.toThrow('Safe tests on production are limited to health and webhook checks');
    expect(registry.getAdapter).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).toHaveBeenCalled();
  });

  it('allows simulator transfer tests, records a safe audit summary, and omits the mode from adapter input', async () => {
    const transferIn = jest.fn().mockResolvedValue({ ok: true, providerCode: 'simulator-provider', requestId: 'test-1', payload: { providerTransactionId: 'test-1' } });
    const prisma = { gameProvider: { findUnique: jest.fn().mockResolvedValue(provider('simulator-provider', 'DEMO')) }, adminAuditLog: { create: jest.fn() } };
    const registry = { getAdapter: jest.fn().mockReturnValue({ transferIn }), hasAdapter: jest.fn() };
    const service = new AdapterTestService(prisma as any, registry as any, { get: jest.fn() } as any);

    const result = await service.run('provider-1', 'transferIn', { testMode: 'SAFE', amount: '1.00' }, { id: 'admin-1' }, {});

    expect(result).toEqual(expect.objectContaining({ testMode: 'SAFE', environment: 'DEMO' }));
    expect(transferIn).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ amount: '1.00' }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'game_provider.adapter_test', targetId: 'provider-1' }) }));
  });

  it('returns only non-technical test history summaries', async () => {
    const prisma = {
      gameProvider: { findUnique: jest.fn().mockResolvedValue(provider('real-provider', 'PRODUCTION')) },
      adminAuditLog: { findMany: jest.fn().mockResolvedValue([{ id: 'audit-1', newData: { method: 'healthCheck', testMode: 'SAFE', environment: 'PRODUCTION', ok: true, latencyMs: 18 }, createdAt: new Date('2026-01-01T00:00:00.000Z'), adminUser: { id: 'admin-1', username: 'admin' } }]) },
    };
    const service = new AdapterTestService(prisma as any, {} as any, { get: jest.fn() } as any);

    await expect(service.history('provider-1')).resolves.toEqual({ items: [expect.objectContaining({ method: 'healthCheck', testMode: 'SAFE', environment: 'PRODUCTION', latencyMs: 18 })] });
  });
});
