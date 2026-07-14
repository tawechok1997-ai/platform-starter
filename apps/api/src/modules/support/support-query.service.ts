import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { mapSupportTicket } from './support-ticket.mapper';

const SUPPORT_REF_TYPE = 'SUPPORT_TICKET';

type Actor = { id: string };
export type AdminSupportQuery = { status?: string; category?: string; search?: string; cursor?: string; limit?: string };

@Injectable()
export class SupportQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listMemberTickets(user: Actor, cursor?: string, limitInput?: string) {
    const limit = Math.min(Math.max(Number(limitInput) || 20, 1), 50);
    const items = await this.prisma.riskAlert.findMany({
      where: { refType: SUPPORT_REF_TYPE, memberId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return {
      items: page.map(mapSupportTicket),
      nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
    };
  }

  async getMemberTicket(user: Actor, id: string) {
    const item = await this.prisma.riskAlert.findFirst({
      where: { id, refType: SUPPORT_REF_TYPE, memberId: user.id },
    });
    if (!item) throw new NotFoundException('Support ticket not found');
    return mapSupportTicket(item);
  }

  async listAdminTickets(query: AdminSupportQuery) {
    const where: Prisma.RiskAlertWhereInput = { refType: SUPPORT_REF_TYPE };
    if (query.status && query.status !== 'ALL') where.status = query.status as RiskAlertStatus;
    if (query.search?.trim()) where.title = { contains: query.search.trim(), mode: 'insensitive' };
    const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
    const items = await this.prisma.riskAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const members = await this.loadMembers(page.flatMap((item) => (item.memberId ? [item.memberId] : [])));
    const formatted = page
      .map((item) => mapSupportTicket({ ...item, member: item.memberId ? members.get(item.memberId) ?? null : null }))
      .filter((item) => !query.category || query.category === 'ALL' || item.category === query.category);
    return {
      items: formatted,
      total: formatted.length,
      nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
    };
  }

  async getAdminTicket(id: string) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE } });
    if (!item) throw new NotFoundException('Support ticket not found');
    const member = item.memberId
      ? await this.prisma.user.findUnique({
          where: { id: item.memberId },
          select: { id: true, username: true, phone: true, email: true },
        })
      : null;
    return mapSupportTicket({ ...item, member });
  }

  private async loadMembers(memberIds: string[]) {
    const uniqueIds = [...new Set(memberIds)];
    if (uniqueIds.length === 0) {
      return new Map<string, { id: string; username: string; phone: string | null; email: string | null }>();
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, username: true, phone: true, email: true },
    });
    return new Map(users.map((user) => [user.id, user]));
  }
}
