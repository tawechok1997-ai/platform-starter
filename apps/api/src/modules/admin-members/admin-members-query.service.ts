import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { normalizeOptionalText, parseOptionalEnum, parsePagination } from '../../common/query/query-filters';
import { parseDateBoundary } from '../../common/query/date-range';
import { PrismaService } from '../../database/prisma.service';
import type { AdminMembersQueryDto } from './dto/admin-members-query.dto';

const MEMBER_STATUSES = ['ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'] as const;
const BANK_STATUSES = ['ACTIVE', 'PENDING_REVIEW', 'REJECTED', 'DISABLED'] as const;
const KYC_STATUSES = ['DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'EXPIRED'] as const;
type MemberStatus = (typeof MEMBER_STATUSES)[number];

const MEMBER_LIST_PROJECTION = {
  id: true,
  username: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
  profile: { select: { displayName: true } },
  wallet: {
    select: {
      balance: true,
      lockedBalance: true,
    },
  },
} as const;

type MemberListRecord = Prisma.UserGetPayload<{ select: typeof MEMBER_LIST_PROJECTION }>;

@Injectable()
export class AdminMembersQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(query: AdminMembersQueryDto) {
    const search = normalizeOptionalText(query.search, 120, { fieldName: 'search' });
    const status = parseOptionalEnum(query.status, MEMBER_STATUSES, {
      allValue: 'ALL',
      fieldName: 'status',
    });
    const bankStatus = parseOptionalEnum(query.bankStatus, BANK_STATUSES, { allValue: 'ALL', fieldName: 'bank status' });
    const kycStatus = parseOptionalEnum(query.kycStatus, KYC_STATUSES, { allValue: 'ALL', fieldName: 'KYC status' });
    const { page, take } = parsePagination(query.page, query.take, {
      defaultTake: 50,
      maxTake: 100,
    });
    const where: Prisma.UserWhereInput = {};

    if (status) where.status = status;
    if (bankStatus) where.bankAccounts = { some: { status: bankStatus } };

    if (kycStatus) {
      const kycMembers = await this.prisma.$queryRaw<Array<{ memberId: string }>>(Prisma.sql`
        SELECT "member_id" AS "memberId" FROM "kyc_cases" WHERE "status" = ${kycStatus}
      `);
      where.id = { in: kycMembers.map((item) => item.memberId) };
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        ...(isUuid(search) ? [{ id: search }] : []),
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: MEMBER_LIST_PROJECTION,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(mapMemberListItem),
      page,
      take,
      total,
      pageCount: Math.max(Math.ceil(total / take), 1),
    };
  }

  async getMemberInsights(query: Pick<AdminMembersQueryDto, 'from' | 'to'> = {}) {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setUTCHours(0, 0, 0, 0);
    defaultStart.setUTCDate(defaultStart.getUTCDate() - 13);
    const start = parseDateBoundary(query.from, false, 'member insight date from') ?? defaultStart;
    const end = parseDateBoundary(query.to, true, 'member insight date to') ?? now;
    if (start > end) throw new BadRequestException('member insight date range is invalid');
    const rangeDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    if (rangeDays > 90) throw new BadRequestException('member insight date range must not exceed 90 days');
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, active30d, newToday, new30d, newInRange, returningInRange, statusGroups, trendMembers] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { lastLoginAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.user.count({ where: { createdAt: { lt: start }, lastLoginAt: { gte: start, lte: end } } }),
      this.prisma.user.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),
      this.prisma.user.findMany({
        where: {
          OR: [
            { createdAt: { gte: start, lte: end } },
            { lastLoginAt: { gte: start, lte: end } },
          ],
        },
        select: { createdAt: true, lastLoginAt: true },
      }),
    ]);

    const status = Object.fromEntries(MEMBER_STATUSES.map((value) => [value, 0])) as Record<MemberStatus, number>;
    for (const group of statusGroups) {
      const count = typeof group._count === 'object' ? Number(group._count._all ?? 0) : 0;
      if (group.status in status) status[group.status as MemberStatus] = count;
    }

    const trend = Array.from({ length: rangeDays }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + index);
      const key = toDateKey(date);
      return { date: key, newMembers: 0, returningMembers: 0 };
    });
    const byDate = new Map(trend.map((item) => [item.date, item]));

    for (const member of trendMembers) {
      if (member.createdAt >= start && member.createdAt <= end) {
        const bucket = byDate.get(toDateKey(member.createdAt));
        if (bucket) bucket.newMembers += 1;
      }
      if (member.lastLoginAt && member.createdAt < start && member.lastLoginAt >= start && member.lastLoginAt <= end) {
        const bucket = byDate.get(toDateKey(member.lastLoginAt));
        if (bucket) bucket.returningMembers += 1;
      }
    }

    return {
      totals: {
        total,
        active30d,
        inactive30d: Math.max(total - active30d, 0),
        newToday,
        new30d,
        newInRange,
        returningInRange,
      },
      status,
      trend,
      segment: {
        newMembers: newInRange,
        returningMembers: returningInRange,
        inactiveMembers: Math.max(total - active30d, 0),
        restrictedMembers: status.SUSPENDED + status.LOCKED,
      },
      period: { from: start.toISOString(), to: end.toISOString(), days: rangeDays },
      dataSource: 'primary database',
      generatedAt: now.toISOString(),
    };
  }

  async getMemberDetail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { profile: true, wallet: true } });
    if (!user) throw new NotFoundException('Member not found');
    const [topUps, withdrawals, ledgers, activity] = await Promise.all([
      this.prisma.topUpRequest.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.withdrawalRequest.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.walletLedger.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 50, include: { createdByAdmin: { select: { id: true, username: true, email: true } } } }),
      this.prisma.adminAuditLog.findMany({ where: { targetId: id }, orderBy: { createdAt: 'desc' }, take: 20, include: { adminUser: { select: { id: true, username: true, email: true } } } }),
    ]);
    return {
      user: { id: user.id, shortId: user.id.slice(0, 8), username: user.username, phone: user.phone, email: user.email, status: user.status, phoneVerifiedAt: user.phoneVerifiedAt, emailVerifiedAt: user.emailVerifiedAt, lastLoginAt: user.lastLoginAt, createdAt: user.createdAt, updatedAt: user.updatedAt, profile: user.profile },
      wallet: user.wallet ? { id: user.wallet.id, currency: user.wallet.currency, balance: user.wallet.balance.toString(), lockedBalance: user.wallet.lockedBalance.toString(), availableBalance: user.wallet.balance.minus(user.wallet.lockedBalance).toString(), status: user.wallet.status, updatedAt: user.wallet.updatedAt } : null,
      topUps: topUps.map((item) => ({ id: item.id, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, referenceCode: item.referenceCode, adminNote: item.adminNote, reviewedAt: item.reviewedAt, createdAt: item.createdAt })),
      withdrawals: withdrawals.map((item) => ({ id: item.id, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, bankName: item.bankName, accountName: item.accountName, accountNumber: item.accountNumber, adminNote: item.adminNote, reviewedAt: item.reviewedAt, createdAt: item.createdAt })),
      ledgers: ledgers.map((item) => ({ id: item.id, type: item.type, direction: item.direction, amount: item.amount.toString(), balanceBefore: item.balanceBefore.toString(), balanceAfter: item.balanceAfter.toString(), referenceType: item.referenceType, referenceId: item.referenceId, createdAt: item.createdAt, createdByAdmin: item.createdByAdmin })),
      activity: activity.map((item) => ({ id: item.id, action: item.action, module: item.module, targetId: item.targetId, oldData: item.oldData, newData: item.newData, createdAt: item.createdAt, adminUser: item.adminUser })),
      generatedAt: new Date().toISOString(),
    };
  }
}

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value); }
function toDateKey(value: Date) { return value.toISOString().slice(0, 10); }

function mapMemberListItem(user: MemberListRecord) {
  return { id: user.id, shortId: user.id.slice(0, 8), username: user.username, phone: user.phone, email: user.email, status: user.status, displayName: user.profile?.displayName ?? null, balance: user.wallet?.balance.toString() ?? '0', lockedBalance: user.wallet?.lockedBalance.toString() ?? '0', availableBalance: user.wallet ? user.wallet.balance.minus(user.wallet.lockedBalance).toString() : '0', createdAt: user.createdAt, lastLoginAt: user.lastLoginAt };
}
