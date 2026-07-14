import { ProviderTransferCommandService } from './provider-transfer-command.service';

describe('ProviderTransferCommandService', () => {
  function createService(adapterResult: any) {
    const provider = {
      code: 'demo', walletMode: 'TRANSFER', currency: 'THB', metadata: { transferEnabled: true, walletSyncEnabled: true },
      endpoints: [{ type: 'TRANSFER_IN', url: 'https://provider/transfer-in', timeoutMs: 10000, isEnabled: true }],
      credentials: [{ type: 'API_KEY', maskedValue: 'secret', isEnabled: true }],
    };
    const prisma = {
      gameSession: { findFirst: jest.fn().mockResolvedValue({ id: 'session-1', userId: 'member-1', providerId: 'provider-1', gameId: 'game-1', provider, game: { providerGameCode: 'game-code' } }) },
      gameTransfer: {
        create: jest.fn().mockResolvedValue({ id: 'transfer-1' }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'transfer-1', ...data })),
      },
      gameProviderCredential: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      adminAuditLog: { create: jest.fn() },
    } as any;
    const adapter = { transferIn: jest.fn().mockResolvedValue(adapterResult), transferOut: jest.fn().mockResolvedValue(adapterResult) };
    const adapters = { hasAdapter: jest.fn().mockReturnValue(true), getAdapter: jest.fn().mockReturnValue(adapter) } as any;
    const config = { get: jest.fn() } as any;
    const wallets = { apply: jest.fn() } as any;
    return { service: new ProviderTransferCommandService(prisma, adapters, config, wallets), prisma, adapter, wallets };
  }

  it('rolls back the wallet debit when provider transfer-in fails', async () => {
    const { service, wallets, prisma } = createService({ ok: false, providerCode: 'demo', requestId: 'req-1', errorCode: 'PROVIDER_DOWN' });
    wallets.apply
      .mockResolvedValueOnce({ ledger: { id: 'debit-1' }, wallet: { balance: '75.00' } })
      .mockResolvedValueOnce({ ledger: { id: 'rollback-1' }, wallet: { balance: '100.00' } });

    const result = await service.transfer('session-1', { id: 'member-1' } as any, 'TRANSFER_IN', '25.00');

    expect(wallets.apply).toHaveBeenNthCalledWith(1, expect.objectContaining({ direction: 'DEBIT', type: 'TRANSFER' }));
    expect(wallets.apply).toHaveBeenNthCalledWith(2, expect.objectContaining({ direction: 'CREDIT', type: 'REVERSAL' }));
    expect(result.rolledBack).toBe(true);
    expect(prisma.gameTransfer.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', errorCode: 'PROVIDER_DOWN' }) }));
  });

  it('does not credit the wallet when provider transfer-out fails', async () => {
    const { service, wallets } = createService({ ok: false, providerCode: 'demo', requestId: 'req-2', errorCode: 'TIMEOUT' });
    const session = await (service as any).prisma.gameSession.findFirst();
    session.provider.endpoints = [{ type: 'TRANSFER_OUT', url: 'https://provider/transfer-out', timeoutMs: 10000, isEnabled: true }];
    (service as any).prisma.gameSession.findFirst.mockResolvedValue(session);

    const result = await service.transfer('session-1', { id: 'member-1' } as any, 'TRANSFER_OUT', '25.00');

    expect(wallets.apply).not.toHaveBeenCalled();
    expect(result.realMutation).toBe(false);
    expect(result.walletSync).toEqual({ changed: false });
  });

  it('credits the wallet only after a successful provider transfer-out', async () => {
    const { service, wallets } = createService({ ok: true, providerCode: 'demo', requestId: 'req-3', payload: { providerTransactionId: 'provider-tx-1' } });
    const session = await (service as any).prisma.gameSession.findFirst();
    session.provider.endpoints = [{ type: 'TRANSFER_OUT', url: 'https://provider/transfer-out', timeoutMs: 10000, isEnabled: true }];
    (service as any).prisma.gameSession.findFirst.mockResolvedValue(session);
    wallets.apply.mockResolvedValue({ ledger: { id: 'credit-1' }, wallet: { balance: '125.00' } });

    const result = await service.transfer('session-1', { id: 'member-1' } as any, 'TRANSFER_OUT', '25.00');

    expect(wallets.apply).toHaveBeenCalledWith(expect.objectContaining({ direction: 'CREDIT', type: 'TRANSFER' }));
    expect(result.ok).toBe(true);
  });
});
