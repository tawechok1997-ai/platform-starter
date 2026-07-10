import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportTopUps(query: ExportQuery = {}) {
    const items = await this.prisma.topUpRequest.findMany({
      where: this.statusDateWhere(query),
      include: { user: { select: { username: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: this.limit(query),
    });
    return this.csv(['id', 'username', 'amount', 'currency', 'status', 'method', 'createdAt', 'reviewedAt'], items.map((item) => [item.id, item.user?.username ?? '', item.amount.toString(), item.currency, item.status, item.method ?? '', item.createdAt.toISOString(), item.reviewedAt?.toISOString() ?? '']));
  }

  async exportWithdrawals(query: ExportQuery = {}) {
    const items = await this.prisma.withdrawalRequest.findMany({
      where: this.statusDateWhere(query),
      include: { user: { select: { username: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: this.limit(query),
    });
    return this.csv(['id', 'username', 'amount', 'currency', 'status', 'method', 'bankName', 'accountNumber', 'createdAt', 'reviewedAt'], items.map((item) => [item.id, item.user?.username ?? '', item.amount.toString(), item.currency, item.status, item.method ?? '', item.bankName ?? '', item.accountNumber ?? '', item.createdAt.toISOString(), item.reviewedAt?.toISOString() ?? '']));
  }

  async exportLedgers(query: ExportQuery = {}) {
    const where: any = {};
    if (query.from || query.to) where.createdAt = this.dateWhere(query);
    if (query.status) where.type = query.status;
    const items = await this.prisma.walletLedger.findMany({
      where,
      include: { user: { select: { username: true, email: true, phone: true } }, createdByAdmin: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
      take: this.limit(query),
    });
    return this.csv(['id', 'username', 'type', 'direction', 'amount', 'balanceBefore', 'balanceAfter', 'referenceType', 'referenceId', 'admin', 'createdAt'], items.map((item) => [item.id, item.user?.username ?? '', item.type, item.direction, item.amount.toString(), item.balanceBefore.toString(), item.balanceAfter.toString(), item.referenceType ?? '', item.referenceId ?? '', item.createdByAdmin?.username ?? '', item.createdAt.toISOString()]));
  }

  async exportReportTrends(query: ExportQuery = {}) {
    const days = Math.min(Math.max(Number(query.days ?? 30) || 30, 1), 31);
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const from = new Date(todayStart);
    from.setUTCDate(from.getUTCDate() - (days - 1));
    const to = new Date(todayStart);
    to.setUTCDate(to.getUTCDate() + 1);
    to.setUTCMilliseconds(-1);

    const [topUps, withdrawals] = await Promise.all([
      this.prisma.topUpRequest.findMany({ where: { status: 'APPROVED', reviewedAt: { gte: from, lte: to } }, select: { amount: true, reviewedAt: true } }),
      this.prisma.withdrawalRequest.findMany({ where: { status: 'COMPLETED', reviewedAt: { gte: from, lte: to } }, select: { amount: true, reviewedAt: true } }),
    ]);

    const daily = Array.from({ length: days }, (_, index) => {
      const date = new Date(from);
      date.setUTCDate(from.getUTCDate() + index);
      return { date: date.toISOString().slice(0, 10), topUpAmount: '0', topUpCount: 0, withdrawalAmount: '0', withdrawalCount: 0, netFlow: '0' };
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

    return this.csv(['date', 'topUpAmount', 'topUpCount', 'withdrawalAmount', 'withdrawalCount', 'netFlow'], daily.map((item) => [item.date, item.topUpAmount, item.topUpCount, item.withdrawalAmount, item.withdrawalCount, item.netFlow]));
  }

  async exportReconciliation(query: ExportQuery = {}) {
    const wallets = await this.prisma.wallet.findMany({
      orderBy: { updatedAt: 'desc' },
      take: this.limit(query),
      include: { user: { select: { id: true, username: true, email: true, phone: true } } },
    });

    const rows = await Promise.all(wallets.map(async (wallet) => {
      const latestLedger = await this.prisma.walletLedger.findFirst({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' } });
      const actual = wallet.balance.toString();
      const ledger = latestLedger?.balanceAfter?.toString() ?? '0';
      return [wallet.id, wallet.userId, wallet.user?.username ?? '', actual, ledger, wallet.lockedBalance.toString(), wallet.balance.minus(wallet.lockedBalance).toString(), actual === ledger || !latestLedger ? 'OK' : 'MISMATCH', latestLedger?.createdAt?.toISOString() ?? ''];
    }));

    return this.csv(['walletId', 'userId', 'username', 'actualBalance', 'latestLedgerBalance', 'lockedBalance', 'availableBalance', 'status', 'latestLedgerAt'], rows);
  }

  private statusDateWhere(query: ExportQuery) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.from || query.to) where.createdAt = this.dateWhere(query);
    return where;
  }

  private dateWhere(query: ExportQuery) {
    const value: any = {};
    if (query.from) value.gte = new Date(query.from);
    if (query.to) value.lte = new Date(query.to);
    return value;
  }

  private limit(query: ExportQuery) {
    return Math.min(Math.max(Number(query.limit) || 1000, 1), 5000);
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

  private csv(headers: string[], rows: any[][]) {
    return [headers, ...rows].map((row) => row.map((cell) => this.escape(cell)).join(',')).join('\n');
  }

  private escape(value: any) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }
}

type ExportQuery = { status?: string; from?: string; to?: string; limit?: string; days?: string };
