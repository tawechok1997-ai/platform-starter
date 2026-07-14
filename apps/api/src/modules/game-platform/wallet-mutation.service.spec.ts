import { WalletMutationService } from './wallet-mutation.service';

describe('WalletMutationService', () => {
  it('returns the existing ledger without mutating the wallet again', async () => {
    const existing = { id: 'ledger-1', walletId: 'wallet-1' };
    const wallet = { id: 'wallet-1', balance: '100.00', status: 'ACTIVE' };
    const tx = {
      walletLedger: { findUnique: jest.fn().mockResolvedValue(existing), create: jest.fn() },
      wallet: { findUnique: jest.fn().mockResolvedValue(wallet), update: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as any;
    const service = new WalletMutationService(prisma);

    const result = await service.apply({
      userId: 'member-1', type: 'TRANSFER', direction: 'DEBIT', amount: 25,
      referenceType: 'GAME_TRANSFER', referenceId: 'transfer-1', idempotencyKey: 'idem-1', metadata: {},
    });

    expect(result.idempotent).toBe(true);
    expect(tx.wallet.update).not.toHaveBeenCalled();
    expect(tx.walletLedger.create).not.toHaveBeenCalled();
  });

  it('creates one ledger and updates the balance for a new mutation', async () => {
    const tx = {
      walletLedger: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'ledger-2', walletId: 'wallet-1' }),
      },
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'wallet-1', balance: '100.00', status: 'ACTIVE' }),
        update: jest.fn().mockResolvedValue({ id: 'wallet-1', balance: '75.00', status: 'ACTIVE' }),
      },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as any;
    const service = new WalletMutationService(prisma);

    const result = await service.apply({
      userId: 'member-1', type: 'TRANSFER', direction: 'DEBIT', amount: 25,
      referenceType: 'GAME_TRANSFER', referenceId: 'transfer-1', idempotencyKey: 'idem-2', metadata: { source: 'test' },
    });

    expect(result.idempotent).toBe(false);
    expect(tx.wallet.update).toHaveBeenCalledWith({ where: { id: 'wallet-1' }, data: { balance: '75.00' } });
    expect(tx.walletLedger.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a debit that would make the wallet negative', async () => {
    const tx = {
      walletLedger: { findUnique: jest.fn().mockResolvedValue(null) },
      wallet: { findUnique: jest.fn().mockResolvedValue({ id: 'wallet-1', balance: '10.00', status: 'ACTIVE' }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) } as any;
    const service = new WalletMutationService(prisma);

    await expect(service.apply({
      userId: 'member-1', type: 'TRANSFER', direction: 'DEBIT', amount: 25,
      referenceType: 'GAME_TRANSFER', referenceId: 'transfer-1', idempotencyKey: 'idem-3', metadata: {},
    })).rejects.toThrow('ยอดคงเหลือไม่พอสำหรับโยกเงินเข้าเกม');
  });
});
