import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { WalletLedgerReconciliationService } from './wallet-ledger-reconciliation.service';

describe('WalletLedgerReconciliationService', () => {
  const wallet = { id: 'wallet-1', userId: 'user-1', currency: 'THB', balance: new Decimal('125.00') };

  it('reports a matched wallet and ledger balance', async () => {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue(wallet) },
      walletLedger: {
        aggregate: jest.fn()
          .mockResolvedValueOnce({ _sum: { amount: new Decimal('150.00') } })
          .mockResolvedValueOnce({ _sum: { amount: new Decimal('25.00') } }),
        findFirst: jest.fn().mockResolvedValue({ balanceAfter: new Decimal('125.00') }),
        count: jest.fn().mockResolvedValue(2),
      },
    };
    const service = new WalletLedgerReconciliationService(prisma as never);
    await expect(service.reconcileUser('user-1')).resolves.toEqual(expect.objectContaining({
      status: 'MATCHED',
      walletBalance: '125',
      latestLedgerBalance: '125',
      totalCredits: '150',
      totalDebits: '25',
      netLedgerMovement: '125',
      difference: '0',
    }));
  });

  it('reports mismatches without changing financial data', async () => {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue(wallet) },
      walletLedger: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
        findFirst: jest.fn().mockResolvedValue({ balanceAfter: new Decimal('120.00') }),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const service = new WalletLedgerReconciliationService(prisma as never);
    const result = await service.reconcileUser('user-1');
    expect(result.status).toBe('MISMATCH');
    expect(result.difference).toBe('5');
  });

  it('reports wallets with no ledger history', async () => {
    const prisma = {
      wallet: { findUnique: jest.fn().mockResolvedValue(wallet) },
      walletLedger: {
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const service = new WalletLedgerReconciliationService(prisma as never);
    const result = await service.reconcileUser('user-1');
    expect(result.status).toBe('NO_LEDGER');
  });

  it('rejects unknown wallets', async () => {
    const prisma = { wallet: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = new WalletLedgerReconciliationService(prisma as never);
    await expect(service.reconcileUser('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
