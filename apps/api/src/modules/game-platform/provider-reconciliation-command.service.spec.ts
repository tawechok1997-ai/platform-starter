import { ProviderReconciliationCommandService } from './provider-reconciliation-command.service';

describe('ProviderReconciliationCommandService', () => {
  const actor = { id: 'admin-1' } as any;

  function setup() {
    const prisma = {
      gameSession: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      gameTransfer: { findMany: jest.fn() },
      gameProviderCredential: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      providerWalletSnapshot: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    } as any;
    const adapter = { getBalance: jest.fn() };
    const adapters = {
      hasAdapter: jest.fn().mockReturnValue(true),
      getAdapter: jest.fn().mockReturnValue(adapter),
    } as any;
    const config = { get: jest.fn().mockReturnValue('test-secret') } as any;
    const alerts = { create: jest.fn() } as any;
    const service = new ProviderReconciliationCommandService(prisma, adapters, config, alerts);
    return { service, prisma, adapter, adapters, alerts };
  }

  it('creates a matched snapshot without a mismatch alert', async () => {
    const { service, prisma, adapter, alerts } = setup();
    prisma.gameSession.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'member-1',
      providerId: 'provider-1',
      providerSessionId: 'remote-1',
      provider: {
        code: 'demo',
        walletMode: 'TRANSFER',
        currency: 'THB',
        endpoints: [{ type: 'BALANCE', url: 'https://provider.test/balance', timeoutMs: 1000 }],
        credentials: [{ type: 'API_KEY', maskedValue: 'key' }],
      },
    });
    prisma.gameTransfer.findMany.mockResolvedValue([{ type: 'TRANSFER_IN', amount: '100.00' }]);
    adapter.getBalance.mockResolvedValue({ ok: true, payload: { balance: '100.00', currency: 'THB' } });
    prisma.providerWalletSnapshot.create.mockResolvedValue({ id: 'snapshot-1', status: 'MATCHED' });

    const result = await service.reconcileSession('session-1', actor);

    expect(result.ok).toBe(true);
    expect(alerts.create).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'game.reconciliation.run', targetId: 'session-1' }),
    }));
  });

  it('creates an alert when provider and system balances differ', async () => {
    const { service, prisma, adapter, alerts } = setup();
    prisma.gameSession.findUnique.mockResolvedValue({
      id: 'session-2',
      userId: 'member-2',
      providerId: 'provider-2',
      providerSessionId: null,
      provider: {
        code: 'demo',
        walletMode: 'TRANSFER',
        currency: 'THB',
        endpoints: [{ type: 'BALANCE', url: 'https://provider.test/balance', timeoutMs: 1000 }],
        credentials: [{ type: 'API_KEY', maskedValue: 'key' }],
      },
    });
    prisma.gameTransfer.findMany.mockResolvedValue([{ type: 'TRANSFER_IN', amount: '100.00' }]);
    adapter.getBalance.mockResolvedValue({ ok: true, payload: { balance: '40.00', currency: 'THB' } });
    prisma.providerWalletSnapshot.create.mockResolvedValue({ id: 'snapshot-2', status: 'MISMATCH' });
    alerts.create.mockResolvedValue({ id: 'alert-1' });

    const result = await service.reconcileSession('session-2', actor);

    expect(result.ok).toBe(false);
    expect(alerts.create).toHaveBeenCalledWith(expect.objectContaining({
      snapshotId: 'snapshot-2',
      difference: '60.00',
      status: 'MISMATCH',
    }));
  });

  it('continues batch reconciliation after an individual session fails', async () => {
    const { service, prisma } = setup();
    prisma.gameSession.findMany.mockResolvedValue([{ id: 'session-ok' }, { id: 'session-failed' }]);
    jest.spyOn(service, 'reconcileSession')
      .mockResolvedValueOnce({ ok: true, snapshot: { id: 'snapshot-ok', status: 'MATCHED' } } as any)
      .mockRejectedValueOnce(new Error('provider timeout'));

    const result = await service.reconcileActiveSessions(actor);

    expect(result.summary).toEqual({ scanned: 2, matched: 1, mismatch: 0, unknown: 0, failed: 1 });
    expect(result.ok).toBe(false);
    expect(result.results[1]).toEqual(expect.objectContaining({ sessionId: 'session-failed', error: 'provider timeout' }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'game.reconciliation.batch_run' }),
    }));
  });
});
