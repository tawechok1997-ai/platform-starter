import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminDashboardAggregateCache } from './admin-dashboard-aggregate-cache';
import { mapReportGroup, resolveReportDateRange, type ReportQuery } from './report.mapper';

@Injectable()
export class AdminDashboardReadModel {
  private readonly aggregateCache = new AdminDashboardAggregateCache();

  constructor(private readonly prisma: PrismaService) {}

  async load(query: ReportQuery = {}) {
    const { from, to } = resolveReportDateRange(query);
    const cacheKey = `${from.toISOString()}:${to.toISOString()}`;
    return this.aggregateCache.getOrLoad(cacheKey, () => this.loadLive(from, to));
  }

  private async loadLive(from: Date, to: Date) {
    const [topUps, withdrawals, adjustments, walletAgg, ledgerAgg, pendingTopUps, pendingWithdrawals] = await Promise.all([
      this.prisma.topUpRequest.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.groupBy({
        by: ['status'],
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.walletLedger.groupBy({
        by: ['direction'],
        where: { type: 'ADJUSTMENT', createdAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.wallet.aggregate({ _count: { _all: true }, _sum: { balance: true, lockedBalance: true } }),
      this.prisma.walletLedger.aggregate({
        where: { createdAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.topUpRequest.aggregate({
        where: { status: 'PENDING' },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: 'PENDING' },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      topUps: topUps.map(mapReportGroup),
      withdrawals: withdrawals.map(mapReportGroup),
      adjustments: adjustments.map((item) => ({
        direction: item.direction,
        count: item._count._all,
        amount: item._sum.amount?.toString() ?? '0',
      })),
      wallets: {
        count: walletAgg._count._all,
        totalBalance: walletAgg._sum.balance?.toString() ?? '0',
        totalLockedBalance: walletAgg._sum.lockedBalance?.toString() ?? '0',
      },
      ledgers: {
        count: ledgerAgg._count._all,
        amount: ledgerAgg._sum.amount?.toString() ?? '0',
      },
      pendingQueues: {
        topUps: {
          count: pendingTopUps._count._all,
          amount: pendingTopUps._sum.amount?.toString() ?? '0',
        },
        withdrawals: {
          count: pendingWithdrawals._count._all,
          amount: pendingWithdrawals._sum.amount?.toString() ?? '0',
        },
      },
      generatedAt: new Date().toISOString(),
    };
  }
}
