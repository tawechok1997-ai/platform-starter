import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { mapFinanceRequest, subtractDecimal } from './finance-report.mapper';

@Injectable()
export class FinanceSummaryQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const [walletAgg, walletCount, topUpPending, withdrawalPending, recentLedgers, recentTopUps, recentWithdrawals, todayTopUps, todayWithdrawals] = await Promise.all([
      this.prisma.wallet.aggregate({ _sum: { balance: true, lockedBalance: true } }),
      this.prisma.wallet.count(),
      this.prisma.topUpRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.walletLedger.findMany({
        include: {
          user: { select: { id: true, username: true, phone: true, email: true } },
          createdByAdmin: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.topUpRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, username: true, phone: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, username: true, phone: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.topUpRequest.aggregate({
        where: { status: 'APPROVED', reviewedAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: 'COMPLETED', reviewedAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const totalBalance = walletAgg._sum.balance ?? 0;
    const totalLocked = walletAgg._sum.lockedBalance ?? 0;
    const todayTopUpAmount = todayTopUps._sum.amount ?? 0;
    const todayWithdrawalAmount = todayWithdrawals._sum.amount ?? 0;

    return {
      totals: {
        walletCount,
        totalBalance: totalBalance.toString(),
        totalLockedBalance: totalLocked.toString(),
        totalAvailableBalance: subtractDecimal(totalBalance, totalLocked),
        pendingTopUps: topUpPending,
        pendingWithdrawals: withdrawalPending,
      },
      today: {
        date: todayStart.toISOString().slice(0, 10),
        topUpAmount: todayTopUpAmount.toString(),
        topUpCount: todayTopUps._count._all,
        withdrawalAmount: todayWithdrawalAmount.toString(),
        withdrawalCount: todayWithdrawals._count._all,
        netFlow: subtractDecimal(todayTopUpAmount, todayWithdrawalAmount),
      },
      queues: {
        topUps: recentTopUps.map(mapFinanceRequest),
        withdrawals: recentWithdrawals.map(mapFinanceRequest),
      },
      recentLedgers: recentLedgers.map((item) => ({
        id: item.id,
        userId: item.userId,
        shortUserId: item.userId.slice(0, 8),
        type: item.type,
        direction: item.direction,
        amount: item.amount.toString(),
        balanceBefore: item.balanceBefore.toString(),
        balanceAfter: item.balanceAfter.toString(),
        referenceType: item.referenceType,
        referenceId: item.referenceId,
        createdAt: item.createdAt,
        user: item.user ? { ...item.user, shortId: item.user.id.slice(0, 8) } : null,
        createdByAdmin: item.createdByAdmin,
      })),
      generatedAt: new Date(),
    };
  }
}
