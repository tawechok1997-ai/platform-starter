import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertStatus } from '@prisma/client';
import { buildCursorPage, parseCursorPage } from '../../common/query/cursor-pagination';
import { normalizeOptionalText, parseOptionalEnum, parseSort } from '../../common/query/query-filters';
import { PrismaService } from '../../database/prisma.service';
import { mapSupportTicket } from './support-ticket.mapper';

const SUPPORT_REF_TYPE = 'SUPPORT_TICKET';
const MEMBER_TICKET_PAGE = { defaultLimit: 20, maxLimit: 50 } as const;
const ADMIN_TICKET_PAGE = { defaultLimit: 25, maxLimit: 100 } as const;
const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_MEMBER', 'CLOSED'] as const;
const SUPPORT_CATEGORIES = ['general', 'finance', 'account', 'game', 'technical'] as const;
const SUPPORT_SORT_FIELDS = ['createdAt', 'updatedAt', 'status'] as const;

const SUPPORT_TICKET_LIST_PROJECTION = {
  id: true,
  title: true,
  description: true,
  status: true,
  severity: true,
  refId: true,
  metadata: true,
  memberId: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
} as const;

type Actor = { id: string };
type AdminSupportQuery = {
  status?: string;
  category?: string;
  search?: string;
  cursor?: string;
  limit?: string;
  sortBy?: string;
  sortDirection?: string;
};

@Injectable()
export class SupportQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async listMemberTickets(user: Actor, cursor?: string, limitInput?: string) {
    const pageInput = parseCursorPage({ cursor, limit: limitInput }, MEMBER_TICKET_PAGE);
    const rows = await this.prisma.riskAlert.findMany({
      where: { refType: SUPPORT_REF_TYPE, memberId: user.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...pageInput.query,
      select: SUPPORT_TICKET_LIST_PROJECTION,
    });
    const page = buildCursorPage(rows, pageInput.limit);
    return {
      items: page.items.map(mapSupportTicket),
      nextCursor: page.nextCursor,
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
    const status = parseOptionalEnum(query.status, SUPPORT_STATUSES, {
      allValue: 'ALL',
      fieldName: 'status',
    });
    const category = parseOptionalEnum(query.category, SUPPORT_CATEGORIES, {
      allValue: 'ALL',
      fieldName: 'category',
    });
    const search = normalizeOptionalText(query.search, 200, { fieldName: 'search' });
    const sort = parseSort(query.sortBy, query.sortDirection, SUPPORT_SORT_FIELDS, {
      field: 'createdAt',
      direction: 'desc',
    });
    const where: Prisma.RiskAlertWhereInput = {
      refType: SUPPORT_REF_TYPE,
      ...(status ? { status: status as RiskAlertStatus } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };
    const orderBy = [
      { [sort.field]: sort.direction },
      { id: sort.direction },
    ] as Prisma.RiskAlertOrderByWithRelationInput[];
    const pageInput = parseCursorPage({ cursor: query.cursor, limit: query.limit }, ADMIN_TICKET_PAGE);
    const rows = await this.prisma.riskAlert.findMany({
      where,
      orderBy,
      ...pageInput.query,
      select: SUPPORT_TICKET_LIST_PROJECTION,
    });
    const page = buildCursorPage(rows, pageInput.limit);
    const members = await this.loadMembers(page.items.flatMap((item) => (item.memberId ? [item.memberId] : [])));
    const formatted = page.items
      .map((item) => mapSupportTicket({ ...item, member: item.memberId ? members.get(item.memberId) ?? null : null }))
      .filter((item) => !category || item.category === category);
    return {
      items: formatted,
      total: formatted.length,
      nextCursor: page.nextCursor,
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
