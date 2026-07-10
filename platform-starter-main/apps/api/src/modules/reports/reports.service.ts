import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailySummary(query: ReportQuery = {}) {
    const { from, to } = this.dateRange(query);
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
      this.prisma.walletLedger.aggregate({ where: { createdAt: { gte: from, lte: to } }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.topUpRequest.aggregate({ where: { status: 'PENDING' }, _count: { _all: true }, _sum: { amount: true } }),
      this.prisma.withdrawalRequest.aggregate({ where: { status: 'PENDING' }, _count: { _all: true }, _sum: { amount: true } }),
    ]);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      topUps: topUps.map(this.formatGroup),
      withdrawals: withdrawals.map(this.formatGroup),
      adjustments: adjustments.map((item) => ({ direction: item.direction, count: item._count._all, amount: item._sum.amount?.toString() ?? '0' })),
      wallets: {
        count: walletAgg._count._all,
        totalBalance: walletAgg._sum.balance?.toString() ?? '0',
        totalLockedBalance: walletAgg._sum.lockedBalance?.toString() ?? '0',
      },
      ledgers: { count: ledgerAgg._count._all, amount: ledgerAgg._sum.amount?.toString() ?? '0' },
      pendingQueues: {
        topUps: { count: pendingTopUps._count._all, amount: pendingTopUps._sum.amount?.toString() ?? '0' },
        withdrawals: { count: pendingWithdrawals._count._all, amount: pendingWithdrawals._sum.amount?.toString() ?? '0' },
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async getTrends(query: ReportQuery = {}) {
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
      row.topUpAmount = this.addDecimal(row.topUpAmount, item.amount);
      row.netFlow = this.addDecimal(row.netFlow, item.amount);
    }

    for (const item of withdrawals) {
      const date = item.reviewedAt?.toISOString().slice(0, 10);
      const row = date ? byDate.get(date) : null;
      if (!row) continue;
      row.withdrawalCount += 1;
      row.withdrawalAmount = this.addDecimal(row.withdrawalAmount, item.amount);
      row.netFlow = this.subtractDecimal(row.netFlow, item.amount);
    }

    const totals = daily.reduce((acc, row) => ({
      topUpAmount: this.addDecimal(acc.topUpAmount, row.topUpAmount),
      topUpCount: acc.topUpCount + row.topUpCount,
      withdrawalAmount: this.addDecimal(acc.withdrawalAmount, row.withdrawalAmount),
      withdrawalCount: acc.withdrawalCount + row.withdrawalCount,
      netFlow: this.addDecimal(acc.netFlow, row.netFlow),
    }), { topUpAmount: '0', topUpCount: 0, withdrawalAmount: '0', withdrawalCount: 0, netFlow: '0' });

    return {
      range: { days, from: from.toISOString(), to: to.toISOString() },
      totals,
      daily,
      generatedAt: new Date().toISOString(),
    };
  }

  async getQueueAging() {
    const now = Date.now();
    const [topUps, withdrawals] = await Promise.all([
      this.prisma.topUpRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, username: true, email: true, phone: true } } },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { id: true, username: true, email: true, phone: true } } },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
    ]);

    const topUpItems = topUps.map((item) => this.formatAgingItem('TOPUP', item, now));
    const withdrawalItems = withdrawals.map((item) => this.formatAgingItem('WITHDRAWAL', item, now));
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
      oldest: allItems.slice(0, 20),
      generatedAt: new Date().toISOString(),
    };
  }

  async getReconciliation(query: ReportQuery = {}) {
    const safeLimit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    const wallets = await this.prisma.wallet.findMany({ orderBy: { updatedAt: 'desc' }, take: safeLimit, include: { user: { select: { id: true, username: true, email: true, phone: true } } } });
    const results = await Promise.all(wallets.map(async (wallet) => {
      const latestLedger = await this.prisma.walletLedger.findFirst({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' } });
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
    }));

    return {
      items: results,
      checkedCount: results.length,
      mismatchCount: results.filter((item) => item.status === 'MISMATCH').length,
      generatedAt: new Date().toISOString(),
    };
  }

  private dateRange(query: ReportQuery) {
    const now = new Date();
    const from = query.from ? new Date(query.from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = query.to ? new Date(query.to) : now;
    return { from, to };
  }

  private formatGroup(item: any) {
    return { status: item.status, count: item._count._all, amount: item._sum.amount?.toString() ?? '0' };
  }

  private formatAgingItem(type: 'TOPUP' | 'WITHDRAWAL', item: any, now: number) {
    const ageMinutes = Math.max(Math.floor((now - item.createdAt.getTime()) / 60000), 0);
    return {
      id: item.id,
      type,
      userId: item.userId,
      username: item.user?.username ?? item.user?.email ?? item.userId.slice(0, 8),
      amount: item.amount.toString(),
      currency: item.currency,
      createdAt: item.createdAt.toISOString(),
      ageMinutes,
      ageLabel: this.ageLabel(ageMinutes),
    };
  }

  private ageLabel(minutes: number) {
    if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${minutes}m`;
  }

  private addDecimal(a: any, b: any) {
    if (a?.plus) return a.plus(b).toString();
    if (b?.plus) return b.plus(a).toString();
    return String(Number(a ?? 0) + Number(b ?? 0));
  }

  private subtractDecimal(a: any, b: any) {
    if (a?.minus) return a.minus(b).toString();
    return String(Number(a ?? 0) - Number(b ?? 0));
  }
}

type ReportQuery = { from?: string; to?: string; limit?: string; days?: string | number };
