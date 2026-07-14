import { RiskWatchlistCommandService } from './risk-watchlist-command.service';

describe('RiskWatchlistCommandService', () => {
  it('releases an active entry and audits inside one transaction', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'entry-1', status: 'ACTIVE', version: 3 }])
      .mockResolvedValueOnce([{ id: 'entry-1', status: 'RELEASED', version: 4, release_reason: 'identity verified' }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw, adminAuditLog: { create: auditCreate } })),
    } as any;
    const service = new RiskWatchlistCommandService(prisma);

    const result = await service.release('entry-1', { version: 3, reason: 'identity verified' } as any, { id: 'admin-1' });

    expect(result.item.status).toBe('RELEASED');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        module: 'risk_watchlist',
        action: 'RELEASE_RISK_WATCHLIST_ENTRY',
        targetId: 'entry-1',
      }),
    }));
  });

  it('rejects release when optimistic version is stale', async () => {
    const auditCreate = jest.fn();
    const queryRaw = jest.fn().mockResolvedValue([{ id: 'entry-1', status: 'ACTIVE', version: 4 }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw, adminAuditLog: { create: auditCreate } })),
    } as any;
    const service = new RiskWatchlistCommandService(prisma);

    await expect(service.release('entry-1', { version: 3, reason: 'identity verified' } as any, { id: 'admin-1' })).rejects.toThrow(
      'Risk watchlist entry was modified by another request',
    );
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('rejects release when the reason is not meaningful', async () => {
    const auditCreate = jest.fn();
    const queryRaw = jest.fn().mockResolvedValue([{ id: 'entry-1', status: 'ACTIVE', version: 3 }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw, adminAuditLog: { create: auditCreate } })),
    } as any;
    const service = new RiskWatchlistCommandService(prisma);

    await expect(service.release('entry-1', { version: 3, reason: 'ok' } as any, { id: 'admin-1' })).rejects.toThrow(
      'Watchlist action requires a meaningful reason',
    );
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(auditCreate).not.toHaveBeenCalled();
  });
});
