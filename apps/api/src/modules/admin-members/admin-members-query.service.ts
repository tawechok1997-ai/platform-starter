import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const MEMBER_STATUSES = ['ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'] as const;
type MemberStatus = (typeof MEMBER_STATUSES)[number];
export type ListMembersQuery = { search?: string; status?: string; page?: string; take?: string };

@Injectable()
export class AdminMembersQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(query: ListMembersQuery) {
    const q = query.search?.trim();
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(query.take ?? 50) || 50, 1), 100);
    const where: Prisma.UserWhereInput = {};

    if (query.status && query.status !== 'ALL') {
      if (!MEMBER_STATUSES.includes(query.status as MemberStatus)) throw new BadRequestException('Invalid member status');
      where.status = query.status as MemberStatus;
    }

    if (q) {
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        ...(isUuid(q) ? [{ id: q }] : []),
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, include: { profile: true, wallet: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
      this.prisma.user.count({ where }),
    ]);

    return { items: items.map(mapMemberListItem), page, take, total, pageCount: Math.max(Math.ceil(total / take), 1) };
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

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }

function mapMemberListItem(user: Prisma.UserGetPayload<{ include: { profile: true; wallet: true } }>) {
  return { id: user.id, shortId: user.id.slice(0, 8), username: user.username, phone: user.phone, email: user.email, status: user.status, displayName: user.profile?.displayName ?? null, balance: user.wallet?.balance.toString() ?? '0', lockedBalance: user.wallet?.lockedBalance.toString() ?? '0', availableBalance: user.wallet ? user.wallet.balance.minus(user.wallet.lockedBalance).toString() : '0', createdAt: user.createdAt, lastLoginAt: user.lastLoginAt };
}
