import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';

type RiskFilter = { status?: string; severity?: string; type?: string; createdFrom?: string; createdTo?: string; page?: string; take?: string };
type RiskStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type RiskType = 'REPEATED_TOPUPS' | 'RAPID_DEPOSIT_WITHDRAWAL' | 'HIGH_WITHDRAWAL' | 'BANK_CHANGE_WITHDRAWAL' | 'MULTIPLE_PENDING_TOPUPS' | 'WALLET_LEDGER_MISMATCH';

const ACTIVE_ALERT_STATUSES: RiskStatus[] = ['OPEN', 'REVIEWING'];
const VALID_STATUSES: RiskStatus[] = ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
const VALID_SEVERITIES: RiskSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_TYPES: RiskType[] = ['REPEATED_TOPUPS', 'RAPID_DEPOSIT_WITHDRAWAL', 'HIGH_WITHDRAWAL', 'BANK_CHANGE_WITHDRAWAL', 'MULTIPLE_PENDING_TOPUPS', 'WALLET_LEDGER_MISMATCH'];

@Injectable()
export class RiskAlertsService {
  private lastScanAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async list(filter: RiskFilter = {}) {
    const page = Math.max(Number(filter.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(filter.take ?? 50) || 50, 1), 100);
    const where: any = {};
    if (filter.status && VALID_STATUSES.includes(filter.status as RiskStatus)) where.status = filter.status;
    if (filter.severity && VALID_SEVERITIES.includes(filter.severity as RiskSeverity)) where.severity = filter.severity;
    if (filter.type && VALID_TYPES.includes(filter.type as RiskType)) where.type = filter.type;
    const createdAt = this.buildDateRange(filter.createdFrom, filter.createdTo);
    if (createdAt) where.createdAt = createdAt;

    const [items, total, openCount, criticalCount] = await Promise.all([
      this.prisma.riskAlert.findMany({ where, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], skip: (page - 1) * take, take }),
      this.prisma.riskAlert.count({ where }),
      this.prisma.riskAlert.count({ where: { status: { in: ACTIVE_ALERT_STATUSES } as any } }),
      this.prisma.riskAlert.count({ where: { status: { in: ACTIVE_ALERT_STATUSES } as any, severity: { in: ['HIGH', 'CRITICAL'] as any } } }),
    ]);

    return { items: items.map((item) => this.formatAlert(item)), total, page, take, pageCount: Math.max(Math.ceil(total / take), 1), summary: { openCount, criticalCount } };
  }

  async get(id: string) {
    const item = await this.prisma.riskAlert.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Risk alert not found');
    return { item: this.formatAlert(item) };
  }

  async updateStatus(id: string, status: string | undefined, admin: any) {
    if (!status || !VALID_STATUSES.includes(status as RiskStatus)) throw new BadRequestException('Invalid risk alert status');
    const existing = await this.prisma.riskAlert.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Risk alert not found');
    const isResolved = status === 'RESOLVED' || status === 'DISMISSED';
    const item = await this.prisma.riskAlert.update({ where: { id }, data: { status: status as any, resolvedAt: isResolved ? new Date() : null, resolvedBy: isResolved ? admin?.id : null } });
    await this.audit(admin?.id, 'UPDATE_RISK_ALERT_STATUS', id, { status: existing.status }, { status });
    return { item: this.formatAlert(item) };
  }

  async scan(admin?: any) {
    const now = Date.now();
    const cooldownMs = Number(process.env.RISK_SCAN_COOLDOWN_SECONDS ?? 45) * 1000;
    const retryAfterMs = this.lastScanAt + cooldownMs - now;
    if (retryAfterMs > 0) {
      throw new HttpException({ message: 'Risk scan is cooling down', retryAfter: Math.ceil(retryAfterMs / 1000) }, HttpStatus.TOO_MANY_REQUESTS);
    }
    this.lastScanAt = now;

    const created: any[] = [];
    created.push(...await this.scanMultiplePendingTopUps(now));
    created.push(...await this.scanRepeatedTopUps(now));
    created.push(...await this.scanRapidDepositWithdrawals(now));
    created.push(...await this.scanHighWithdrawals(now));
    created.push(...await this.scanBankChangeWithdrawals(now));
    created.push(...await this.scanWalletLedgerMismatch());
    await this.audit(admin?.id, 'SCAN_RISK_ALERTS', 'risk-alerts', null, { created: created.length });
    return { created: created.length, items: created.map((item) => this.formatAlert(item)) };
  }

  private async scanMultiplePendingTopUps(now: number) {
    const since = new Date(now - 30 * 60 * 1000);
    const items = await this.prisma.topUpRequest.findMany({ where: { status: 'PENDING', createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 500 });
    const groups = this.groupByUser(items);
    const alerts: any[] = [];
    for (const [userId, rows] of groups.entries()) {
      if (rows.length < 3) continue;
      const alert = await this.createAlertOnce({ type: 'MULTIPLE_PENDING_TOPUPS', severity: rows.length >= 5 ? 'HIGH' : 'MEDIUM', memberId: userId, refType: 'user', refId: userId, title: 'สมาชิกมี topup pending หลายรายการในเวลาสั้น', description: `พบ topup pending ${rows.length} รายการภายใน 30 นาที`, metadata: { count: rows.length, windowMinutes: 30, topUpIds: rows.map((row: any) => row.id) } });
      if (alert) alerts.push(alert);
    }
    return alerts;
  }

  private async scanRepeatedTopUps(now: number) {
    const since = new Date(now - 10 * 60 * 1000);
    const items = await this.prisma.topUpRequest.findMany({ where: { status: 'APPROVED', reviewedAt: { gte: since } }, orderBy: { reviewedAt: 'desc' }, take: 500 });
    const groups = this.groupByUser(items);
    const alerts: any[] = [];
    for (const [userId, rows] of groups.entries()) {
      if (rows.length < 3) continue;
      const total = rows.reduce((sum: Decimal, row: any) => sum.plus(row.amount), new Decimal(0));
      const alert = await this.createAlertOnce({ type: 'REPEATED_TOPUPS', severity: rows.length >= 5 || total.gte(50000) ? 'HIGH' : 'MEDIUM', memberId: userId, refType: 'user', refId: userId, title: 'สมาชิกเติมเงินถี่ผิดปกติ', description: `พบ topup approved ${rows.length} รายการภายใน 10 นาที`, metadata: { count: rows.length, totalAmount: total.toString(), windowMinutes: 10, topUpIds: rows.map((row: any) => row.id) } });
      if (alert) alerts.push(alert);
    }
    return alerts;
  }

  private async scanRapidDepositWithdrawals(now: number) {
    const since = new Date(now - 15 * 60 * 1000);
    const withdrawals = await this.prisma.withdrawalRequest.findMany({ where: { createdAt: { gte: since }, status: { in: ['PENDING', 'COMPLETED'] as any } }, orderBy: { createdAt: 'desc' }, take: 300 });
    const alerts: any[] = [];
    for (const withdrawal of withdrawals) {
      const topUp = await this.prisma.topUpRequest.findFirst({ where: { userId: withdrawal.userId, status: 'APPROVED', reviewedAt: { gte: new Date(withdrawal.createdAt.getTime() - 15 * 60 * 1000), lte: withdrawal.createdAt } }, orderBy: { reviewedAt: 'desc' } });
      if (!topUp) continue;
      const alert = await this.createAlertOnce({ type: 'RAPID_DEPOSIT_WITHDRAWAL', severity: 'HIGH', memberId: withdrawal.userId, refType: 'withdrawal_request', refId: withdrawal.id, title: 'สมาชิกฝากแล้วถอนทันที', description: 'พบการถอนหลังจาก topup approved ภายใน 15 นาที', metadata: { topUpId: topUp.id, withdrawalId: withdrawal.id, topUpAmount: topUp.amount.toString(), withdrawalAmount: withdrawal.amount.toString() } });
      if (alert) alerts.push(alert);
    }
    return alerts;
  }

  private async scanHighWithdrawals(now: number) {
    const threshold = new Decimal(process.env.RISK_HIGH_WITHDRAWAL_AMOUNT ?? '50000');
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const withdrawals = await this.prisma.withdrawalRequest.findMany({ where: { createdAt: { gte: since }, amount: { gte: threshold } as any, status: { in: ['PENDING', 'COMPLETED'] as any } }, orderBy: { createdAt: 'desc' }, take: 300 });
    const alerts: any[] = [];
    for (const withdrawal of withdrawals) {
      const alert = await this.createAlertOnce({ type: 'HIGH_WITHDRAWAL', severity: withdrawal.amount.gte(threshold.mul(2)) ? 'CRITICAL' : 'HIGH', memberId: withdrawal.userId, refType: 'withdrawal_request', refId: withdrawal.id, title: 'รายการถอนยอดสูง', description: `ยอดถอนตั้งแต่ ${threshold.toString()} THB ขึ้นไป`, metadata: { withdrawalId: withdrawal.id, amount: withdrawal.amount.toString(), threshold: threshold.toString() } });
      if (alert) alerts.push(alert);
    }
    return alerts;
  }

  private async scanBankChangeWithdrawals(now: number) {
    const since = new Date(now - 24 * 60 * 60 * 1000);
    const bankAccounts = await this.prisma.memberBankAccount.findMany({ where: { status: 'ACTIVE', updatedAt: { gte: since } }, orderBy: { updatedAt: 'desc' }, take: 200 });
    const alerts: any[] = [];
    for (const bank of bankAccounts) {
      const withdrawal = await this.prisma.withdrawalRequest.findFirst({ where: { userId: bank.userId, createdAt: { gte: bank.updatedAt }, accountNumber: bank.accountNumber, status: { in: ['PENDING', 'COMPLETED'] as any } }, orderBy: { createdAt: 'desc' } });
      if (!withdrawal) continue;
      const alert = await this.createAlertOnce({ type: 'BANK_CHANGE_WITHDRAWAL', severity: 'HIGH', memberId: bank.userId, refType: 'withdrawal_request', refId: withdrawal.id, title: 'อนุมัติบัญชีถอนแล้วมีการถอนเร็วผิดปกติ', description: 'บัญชีถอนถูกอนุมัติ/อัปเดตภายใน 24 ชั่วโมง แล้วมีรายการถอนตามมา', metadata: { bankAccountId: bank.id, withdrawalId: withdrawal.id, bankUpdatedAt: bank.updatedAt } });
      if (alert) alerts.push(alert);
    }
    return alerts;
  }

  private async scanWalletLedgerMismatch() {
    const wallets = await this.prisma.wallet.findMany({ include: { ledgers: { orderBy: { createdAt: 'desc' }, take: 1 } }, take: 500 });
    const alerts: any[] = [];
    for (const wallet of wallets) {
      const latest = wallet.ledgers[0];
      if (!latest || wallet.balance.eq(latest.balanceAfter)) continue;
      const alert = await this.createAlertOnce({ type: 'WALLET_LEDGER_MISMATCH', severity: 'CRITICAL', memberId: wallet.userId, refType: 'wallet', refId: wallet.id, title: 'ยอด wallet ไม่ตรงกับ ledger ล่าสุด', description: 'wallet.balance ไม่ตรงกับ walletLedger.balanceAfter ล่าสุด', metadata: { walletId: wallet.id, walletBalance: wallet.balance.toString(), latestLedgerId: latest.id, latestLedgerBalanceAfter: latest.balanceAfter.toString() } });
      if (alert) alerts.push(alert);
    }
    return alerts;
  }

  private async createAlertOnce(input: { type: RiskType; severity: RiskSeverity; memberId?: string | null; refType?: string | null; refId?: string | null; title: string; description?: string; metadata?: any }) {
    const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await this.prisma.riskAlert.findFirst({ where: { type: input.type as any, memberId: input.memberId ?? undefined, refType: input.refType ?? undefined, refId: input.refId ?? undefined, status: { in: ACTIVE_ALERT_STATUSES } as any, createdAt: { gte: recentSince } } });
    if (existing) return null;
    return this.prisma.riskAlert.create({ data: { type: input.type as any, severity: input.severity as any, memberId: input.memberId ?? null, refType: input.refType ?? null, refId: input.refId ?? null, title: input.title, description: input.description, metadata: input.metadata ?? undefined } });
  }

  private buildDateRange(createdFrom?: string, createdTo?: string) {
    const range: any = {};
    if (createdFrom) {
      const from = new Date(`${createdFrom}T00:00:00.000Z`);
      if (!Number.isNaN(from.getTime())) range.gte = from;
    }
    if (createdTo) {
      const to = new Date(`${createdTo}T23:59:59.999Z`);
      if (!Number.isNaN(to.getTime())) range.lte = to;
    }
    return Object.keys(range).length ? range : null;
  }

  private groupByUser(items: any[]) {
    const groups = new Map<string, any[]>();
    for (const item of items) groups.set(item.userId, [...(groups.get(item.userId) ?? []), item]);
    return groups;
  }

  private audit(adminUserId: string | undefined, action: string, targetId: string, oldData: any, newData: any) {
    if (!adminUserId) return Promise.resolve(null);
    return this.prisma.adminAuditLog.create({ data: { adminUserId, module: 'risk_alerts', action, targetId, oldData, newData } }).catch(() => null);
  }

  private formatAlert(item: any) {
    return { id: item.id, type: item.type, severity: item.severity, status: item.status, memberId: item.memberId, refType: item.refType, refId: item.refId, title: item.title, description: item.description, metadata: item.metadata, resolvedBy: item.resolvedBy, resolvedAt: item.resolvedAt, createdAt: item.createdAt, updatedAt: item.updatedAt };
  }
}
