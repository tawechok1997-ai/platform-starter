import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  addReportDecimal,
  mapQueueAgingItem,
  subtractReportDecimal,
  type ReportQuery,
} from './report.mapper';

const QUEUE_AGING_LIMIT = 20;
const RECONCILIATION_DEFAULT_LIMIT = 100;
const RECONCILIATION_MAX_LIMIT = 500;

@Injectable()
export class AdminReportReadModel {
  constructor(private readonly prisma: PrismaService) {}

  async loadTrends(query: ReportQuery = {}) {
    const days = Math.min(Math.max(Number(query.days ?? 7) || 7, 1), 31);
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const from = new Date(todayStart);
    from.setUTCDate(from.getUTCDate() - (days - 1));
    const to = new Date(todayStart);
    to.setUTCDate(to.getUTCDate() + 1);
    to.setUTCMilliseconds(-1);

    const [topUps, withdrawals] = await Promise.all([
      this.prisma.topUpRequest.findMany({
        where: { status: 'APPROVED', reviewedAt: { gte: from, lte: to } },
        select: { amount: true, reviewedAt: true },
        orderBy: { reviewedAt: 'asc' },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: 'COMPLETED', reviewedAt: { gte: from, lte: to } },
        select: { amount: true, reviewedAt: true },
        orderBy: { reviewedAt: 'asc' },
      }),
    ]);

    const daily = Array.from({ length: days }, (_, index) => {
      const date = new Date(from);
      date.setUTCDate(from.getUTCDate() + index);
      return {
        date: date.toISOString().slice(0, 10),
        topUpAmount: '0',
        topUpCount: 0,
        withdrawalAmount: '0',
        withdrawalCount: 0,
        netFlow: '0',
      };
    });
    const byDate = new Map(daily.map((item) => [item.date, item]));

    for (const item of topUps) {
      const date = item.reviewedAt?.toISOString().slice(0, 10);
      const row = date ? byDate.get(date) : null;
      if (!row) continue;
      row.topUpCount += 1;
      row.topUpAmount = addReportDecimal(row.topUpAmount, item.amount);
      row.netFlow = addReportDecimal(row.netFlow, item.amount);
    }
    for (const item of withdrawals) {
      const date = item.reviewedAt?.toISOString().slice(0, 10);
      const row = date ? byDate.get(date) : null;
      if (!row) continue;
      row.withdrawalCount += 1;
      row.withdrawalAmount = addReportDecimal(row.withdrawalAmount, item.amount);
      row.netFlow = subtractReportDecimal(row.netFlow, item.amount);
    }

    const totals = daily.reduce(
      (acc, row) => ({
        topUpAmount: addReportDecimal(acc.topUpAmount, row.topUpAmount),
        topUpCount: acc.topUpCount + row.topUpCount,
        withdrawalAmount: addReportDecimal(acc.withdrawalAmount, row.withdrawalAmount),
        withdrawalCount: acc.withdrawalCount + row.withdrawalCount,
        netFlow: addReportDecimal(acc.netFlow, row.netFlow),
      }),
      { topUpAmount: '0', topUpCount: 0, withdrawalAmount: '0', withdrawalCount: 0, netFlow: '0' },
    );

    return {
      range: { days, from: from.toISOString(), to: to.toISOString() },
      totals,
      daily,
      generatedAt: new Date().toISOString(),
    };
  }

  async loadQueueAging() {
    const now = Date.now();
    const [topUps, withdrawals] = await Promise.all([
      this.prisma.topUpRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, username: true, email: true, phone: true } } },
        orderBy: { createdAt: 'asc' },
        take: QUEUE_AGING_LIMIT,
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, username: true, email: true, phone: true } } },
        orderBy: { createdAt: 'asc' },
        take: QUEUE_AGING_LIMIT,
      }),
    ]);
    const topUpItems = topUps.map((item) => mapQueueAgingItem('TOPUP', item, now));
    const withdrawalItems = withdrawals.map((item) => mapQueueAgingItem('WITHDRAWAL', item, now));
    const allItems = [...topUpItems, ...withdrawalItems].sort((a, b) => b.ageMinutes - a.ageMinutes);

    return {
      summary: {
        pendingTopUps: topUpItems.length,
        pendingWithdrawals: withdrawalItems.length,
        oldestAgeMinutes: allItems[0]?.ageMinutes ?? 0,
        over15Minutes: allItems.filter((item) => item.ageMinutes >= 15).length,
        over60Minutes: allItems.filter((item) => item.ageMinutes >= 60).length,
        over24Hours: allItems.filter((item) => item.ageMinutes >= 1440).length,
      },
      oldest: allItems.slice(0, QUEUE_AGING_LIMIT),
      generatedAt: new Date().toISOString(),
    };
  }

  async loadReconciliation(query: ReportQuery = {}) {
    const safeLimit = Math.min(
      Math.max(Number(query.limit) || RECONCILIATION_DEFAULT_LIMIT, 1),
      RECONCILIATION_MAX_LIMIT,
    );
    const wallets = await this.prisma.wallet.findMany({
      orderBy: { updatedAt: 'desc' },
      take: safeLimit,
      include: { user: { select: { id: true, username: true, email: true, phone: true } } },
    });
    const results = await Promise.all(
      wallets.map(async (wallet) => {
        const latestLedger = await this.prisma.walletLedger.findFirst({
          where: { walletId: wallet.id },
          orderBy: { createdAt: 'desc' },
        });
        const expected = latestLedger?.balanceAfter?.toString() ?? '0';
        const actual = wallet.balance.toString();
        return {
          walletId: wallet.id,
          userId: wallet.userId,
          shortUserId: wallet.userId.slice(0, 8),
          username: wallet.user?.username ?? null,
          actualBalance: actual,
          latestLedgerBalance: expected,
          lockedBalance: wallet.lockedBalance.toString(),
          availableBalance: wallet.balance.minus(wallet.lockedBalance).toString(),
          status: actual === expected || !latestLedger ? 'OK' : 'MISMATCH',
          latestLedgerAt: latestLedger?.createdAt ?? null,
        };
      }),
    );

    return {
      items: results,
      checkedCount: results.length,
      mismatchCount: results.filter((item) => item.status === 'MISMATCH').length,
      generatedAt: new Date().toISOString(),
    };
  }
}
