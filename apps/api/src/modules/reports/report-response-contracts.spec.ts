import { Prisma } from '@prisma/client';
import { AdminDashboardReadModel } from './admin-dashboard-read.model';
import { AdminReportReadModel } from './admin-report-read.model';

describe('R-010 report response contracts', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-15T12:00:00.000Z'));
  });

  afterAll(() => jest.useRealTimers());

  it('keeps the dashboard summary contract stable', async () => {
    const prisma = {
      topUpRequest: {
        groupBy: jest.fn().mockResolvedValue([{ status: 'APPROVED', _count: { _all: 2 }, _sum: { amount: new Prisma.Decimal(120) } }]),
        aggregate: jest.fn().mockResolvedValue({ _count: { _all: 1 }, _sum: { amount: new Prisma.Decimal(20) } }),
      },
      withdrawalRequest: {
        groupBy: jest.fn().mockResolvedValue([{ status: 'COMPLETED', _count: { _all: 1 }, _sum: { amount: new Prisma.Decimal(40) } }]),
        aggregate: jest.fn().mockResolvedValue({ _count: { _all: 1 }, _sum: { amount: new Prisma.Decimal(10) } }),
      },
      walletLedger: {
        groupBy: jest.fn().mockResolvedValue([{ direction: 'CREDIT', _count: { _all: 1 }, _sum: { amount: new Prisma.Decimal(5) } }]),
        aggregate: jest.fn().mockResolvedValue({ _count: { _all: 3 }, _sum: { amount: new Prisma.Decimal(165) } }),
      },
      wallet: { aggregate: jest.fn().mockResolvedValue({ _count: { _all: 2 }, _sum: { balance: new Prisma.Decimal(500), lockedBalance: new Prisma.Decimal(25) } }) },
    } as any;

    const result = await new AdminDashboardReadModel(prisma).load({
      from: '2026-07-15T00:00:00.000Z',
      to: '2026-07-15T23:59:59.999Z',
    });

    expect(result).toMatchInlineSnapshot(`
{
  "adjustments": [
    {
      "amount": "5",
      "count": 1,
      "direction": "CREDIT",
    },
  ],
  "generatedAt": "2026-07-15T12:00:00.000Z",
  "ledgers": {
    "amount": "165",
    "count": 3,
  },
  "pendingQueues": {
    "topUps": {
      "amount": "20",
      "count": 1,
    },
    "withdrawals": {
      "amount": "10",
      "count": 1,
    },
  },
  "range": {
    "from": "2026-07-15T00:00:00.000Z",
    "to": "2026-07-15T23:59:59.999Z",
  },
  "topUps": [
    {
      "amount": "120",
      "count": 2,
      "status": "APPROVED",
    },
  ],
  "wallets": {
    "count": 2,
    "totalBalance": "500",
    "totalLockedBalance": "25",
  },
  "withdrawals": [
    {
      "amount": "40",
      "count": 1,
      "status": "COMPLETED",
    },
  ],
}
`);
  });

  it('keeps queue-aging and reconciliation contracts stable', async () => {
    const prisma = {
      topUpRequest: { findMany: jest.fn().mockResolvedValue([{ id: 't1', userId: 'user-12345678', amount: new Prisma.Decimal(50), currency: 'THB', createdAt: new Date('2026-07-15T10:00:00.000Z'), user: { username: 'member', email: null } }]) },
      withdrawalRequest: { findMany: jest.fn().mockResolvedValue([]) },
      wallet: { findMany: jest.fn().mockResolvedValue([{ id: 'w1', userId: 'user-12345678', balance: new Prisma.Decimal(100), lockedBalance: new Prisma.Decimal(20), user: { username: 'member' } }]) },
      walletLedger: { findFirst: jest.fn().mockResolvedValue({ balanceAfter: new Prisma.Decimal(90), createdAt: new Date('2026-07-15T11:00:00.000Z') }) },
    } as any;
    const model = new AdminReportReadModel(prisma);

    expect(await model.loadQueueAging()).toMatchInlineSnapshot(`
{
  "generatedAt": "2026-07-15T12:00:00.000Z",
  "oldest": [
    {
      "ageLabel": "2h 0m",
      "ageMinutes": 120,
      "amount": "50",
      "createdAt": "2026-07-15T10:00:00.000Z",
      "currency": "THB",
      "id": "t1",
      "type": "TOPUP",
      "userId": "user-12345678",
      "username": "member",
    },
  ],
  "summary": {
    "oldestAgeMinutes": 120,
    "over15Minutes": 1,
    "over24Hours": 0,
    "over60Minutes": 1,
    "pendingTopUps": 1,
    "pendingWithdrawals": 0,
  },
}
`);

    expect(await model.loadReconciliation({ limit: '1' })).toMatchInlineSnapshot(`
{
  "checkedCount": 1,
  "generatedAt": "2026-07-15T12:00:00.000Z",
  "items": [
    {
      "actualBalance": "100",
      "availableBalance": "80",
      "latestLedgerAt": 2026-07-15T11:00:00.000Z,
      "latestLedgerBalance": "90",
      "lockedBalance": "20",
      "shortUserId": "user-123",
      "status": "MISMATCH",
      "userId": "user-12345678",
      "username": "member",
      "walletId": "w1",
    },
  ],
  "mismatchCount": 1,
}
`);
  });
});
