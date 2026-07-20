import { BadRequestException } from '@nestjs/common';
import { ProviderReconciliationCommandService } from './provider-reconciliation-command.service';

describe('ProviderReconciliationCommandService', () => {
  const actor = { id: 'admin-1' } as any;

  function setup() {
    const tx = {
      providerWalletSnapshot: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      riskAlert: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      riskAlertNote: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    } as any;
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
      $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    } as any;
    const adapter = { getBalance: jest.fn() };
    const adapters = {
      hasAdapter: jest.fn().mockReturnValue(true),
      getAdapter: jest.fn().mockReturnValue(adapter),
    } as any;
    const config = { get: jest.fn().mockReturnValue('test-secret') } as any;
    const alerts = { create: jest.fn() } as any;
    const service = new ProviderReconciliationCommandService(prisma, adapters, config, alerts);
    return { service, prisma, tx, adapter, adapters, alerts };
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

  it('moves linked alerts to reviewing without resolving the snapshot', async () => {
    const { service, tx } = setup();
    tx.providerWalletSnapshot.findUnique.mockResolvedValue({
      id: 'snapshot-review',
      status: 'MISMATCH',
      rawPayload: {},
    });
    tx.providerWalletSnapshot.update.mockResolvedValue({ id: 'snapshot-review', status: 'MISMATCH' });
    tx.riskAlert.findMany.mockResolvedValue([{ id: 'alert-review' }]);
    tx.riskAlert.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.reviewSnapshot('snapshot-review', actor, {
      note: 'กำลังตรวจสอบกับ provider',
      status: 'reviewed',
    });

    expect(result.reviewStatus).toBe('REVIEWED');
    expect(result.item.status).toBe('MISMATCH');
    expect(tx.riskAlert.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REVIEWING', resolvedAt: null, resolvedBy: null }),
    }));
    expect(tx.riskAlertNote.createMany).toHaveBeenCalledWith({
      data: [{ riskAlertId: 'alert-review', adminUserId: 'admin-1', note: '[REVIEWED] กำลังตรวจสอบกับ provider' }],
    });
  });

  it('resolves the snapshot, linked alerts and audit log in one transaction', async () => {
    const { service, prisma, tx } = setup();
    tx.providerWalletSnapshot.findUnique.mockResolvedValue({
      id: 'snapshot-resolve',
      status: 'MISMATCH',
      rawPayload: {},
    });
    tx.providerWalletSnapshot.update.mockResolvedValue({ id: 'snapshot-resolve', status: 'MATCHED' });
    tx.riskAlert.findMany.mockResolvedValue([{ id: 'alert-1' }, { id: 'alert-2' }]);
    tx.riskAlert.updateMany.mockResolvedValue({ count: 2 });
    tx.riskAlertNote.createMany.mockResolvedValue({ count: 2 });

    const result = await service.reviewSnapshot('snapshot-resolve', actor, {
      note: 'ยอดปัจจุบันตรงกันแล้ว',
      status: 'RESOLVED',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.item.status).toBe('MATCHED');
    expect(result.linkedRiskAlertsUpdated).toBe(2);
    expect(tx.riskAlert.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['alert-1', 'alert-2'] } },
      data: expect.objectContaining({ status: 'RESOLVED', resolvedBy: 'admin-1' }),
    }));
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'game.reconciliation.resolve' }),
    }));
  });

  it('rejects invalid review input before opening a transaction', async () => {
    const { service, prisma } = setup();

    await expect(service.reviewSnapshot('snapshot-1', actor, { note: 'note', status: 'INVALID' }))
      .rejects.toBeInstanceOf(BadRequestException);
    await expect(service.reviewSnapshot('snapshot-1', actor, { note: '   ', status: 'RESOLVED' }))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
