import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildDateRange, parseDateBoundary } from '../../common/query/date-range';
import { PrismaService } from '../../database/prisma.service';

const RISK_MODULES = ['promotions', 'affiliates', 'withdrawals', 'topups', 'money-ops', 'game-platform', 'bank-accounts', 'support'];
const HIGH_RISK_ACTION_WORDS = ['review', 'approve', 'reject', 'complete', 'revoke', 'release', 'expire', 'turnover', 'commission', 'withdrawal', 'deposit', 'credential', 'provider'];
const AUDIT_EXPORT_LIMIT = 5000;

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AuditLogQuery) {
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(query.take ?? 50) || 50, 1), 100);
    const where = buildAuditWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
        include: { adminUser: { select: { id: true, username: true, email: true } } },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return { items, total, page, take, pageCount: Math.max(Math.ceil(total / take), 1) };
  }

  async exportCsv(query: AuditLogQuery) {
    const where = buildAuditWhere(query);
    const items = await this.prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: AUDIT_EXPORT_LIMIT,
      select: {
        createdAt: true,
        module: true,
        action: true,
        targetId: true,
        ipAddress: true,
        userAgent: true,
        adminUserId: true,
        adminUser: { select: { username: true, email: true } },
      },
    });

    const header = ['timestamp', 'module', 'action', 'target_id', 'admin', 'admin_email', 'ip_address', 'user_agent'];
    const rows = items.map((item) => [
      item.createdAt.toISOString(),
      item.module ?? '',
      item.action,
      item.targetId ?? '',
      item.adminUser?.username ?? item.adminUserId,
      item.adminUser?.email ?? '',
      item.ipAddress ?? '',
      item.userAgent ?? '',
    ]);
    const content = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');

    return {
      filename: `admin-audit-${new Date().toISOString().slice(0, 10)}.csv`,
      contentType: 'text/csv;charset=utf-8',
      rowCount: items.length,
      truncated: items.length >= AUDIT_EXPORT_LIMIT,
      content: `\uFEFF${content}`,
    };
  }

  async riskSummary(query: AuditLogQuery) {
    const since = parseDateBoundary(query.from, false, 'audit date') ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const until = parseDateBoundary(query.to, true, 'audit date') ?? new Date();
    const createdAt = buildDateRange(since, until);
    if (!createdAt) throw new BadRequestException('Audit date range is required');

    const where: Prisma.AdminAuditLogWhereInput = {
      createdAt,
      ...(query.module ? { module: { equals: String(query.module).trim(), mode: 'insensitive' } } : {}),
    };
    const items = await this.prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 300, include: { adminUser: { select: { id: true, username: true, email: true } } } });
    const risky = items.filter((item) => isRiskyAudit(item.module, item.action));
    const byModule = bucket(risky.map((item) => item.module || 'unknown'));
    const byAction = bucket(risky.map((item) => item.action || 'unknown'));
    const byAdmin = bucket(risky.map((item) => item.adminUser?.username || item.adminUser?.email || item.adminUserId || 'unknown'));
    return {
      window: { from: since, to: until },
      totals: { all: items.length, risky: risky.length, uniqueAdmins: new Set(risky.map((item) => item.adminUserId)).size },
      byModule,
      byAction,
      byAdmin,
      recent: risky.slice(0, 50),
    };
  }
}

function buildAuditWhere(query: AuditLogQuery) {
  const where: Prisma.AdminAuditLogWhereInput = {};

  if (query.module) where.module = { equals: String(query.module).trim(), mode: 'insensitive' };
  if (query.action) where.action = { contains: String(query.action).trim(), mode: 'insensitive' };
  if (query.adminUserId) where.adminUserId = String(query.adminUserId).trim();
  if (query.targetId) where.targetId = String(query.targetId).trim();

  const admin = String(query.admin ?? '').trim();
  const search = String(query.search ?? '').trim();
  const and: Prisma.AdminAuditLogWhereInput[] = [];

  if (admin) {
    and.push({
      adminUser: {
        is: {
          OR: [
            { username: { contains: admin, mode: 'insensitive' } },
            { email: { contains: admin, mode: 'insensitive' } },
          ],
        },
      },
    });
  }

  if (search) {
    and.push({
      OR: [
        { module: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { targetId: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { userAgent: { contains: search, mode: 'insensitive' } },
        { adminUser: { is: { username: { contains: search, mode: 'insensitive' } } } },
        { adminUser: { is: { email: { contains: search, mode: 'insensitive' } } } },
      ],
    });
  }

  if (and.length) where.AND = and;

  const createdAt = buildDateRange(
    parseDateBoundary(query.from, false, 'audit date'),
    parseDateBoundary(query.to, true, 'audit date'),
  );
  if (createdAt) where.createdAt = createdAt;
  return where;
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function isRiskyAudit(module: string | null, action: string) {
  const mod = String(module ?? '').toLowerCase();
  const act = String(action ?? '').toLowerCase();
  return RISK_MODULES.some((item) => mod.includes(item)) || HIGH_RISK_ACTION_WORDS.some((item) => act.includes(item));
}

function bucket(values: string[]) {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12);
}

export type AuditLogQuery = {
  module?: string;
  action?: string;
  admin?: string;
  adminUserId?: string;
  targetId?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: string | number;
  take?: string | number;
};
