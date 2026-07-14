import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { RiskSummaryQueryService } from './risk-summary-query.service';

describe('RiskSummaryQueryService', () => {
  it('reports wallet and ledger mismatches as high severity', async () => {
    const wallet = {
      id: 'wallet-1',
      userId: 'member-1',
      balance: new Prisma.Decimal('100'),
      lockedBalance: new Prisma.Decimal('10'),
      user: { username: 'member' },
    };

    const prisma = {
      wallet: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([wallet])
          .mockResolvedValueOnce([]),
      },
      topUpRequest: { findMany: jest.fn().mockResolvedValue([]) },
      withdrawalRequest: { findMany: jest.fn().mockResolvedValue([]) },
      walletLedger: {
        findFirst: jest.fn().mockResolvedValue({ balanceAfter: new Prisma.Decimal('90') }),
      },
    } as unknown as PrismaService;

    const result = await new RiskSummaryQueryService(prisma).execute();

    expect(result.counts.high).toBe(1);
    expect(result.alerts[0]).toMatchObject({
      type: 'WALLET_LEDGER_MISMATCH',
      severity: 'HIGH',
      walletId: 'wallet-1',
      actualBalance: '100',
      latestLedgerBalance: '90',
    });
  });
});
