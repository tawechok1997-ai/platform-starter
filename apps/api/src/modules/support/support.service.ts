import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertSeverity, RiskAlertStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type Actor = { id: string };
type CreateTicketInput = { category?: string; subject?: string; message?: string; refType?: string; refId?: string };
type ReplyInput = { message?: string };
type AdminUpdateInput = { status?: RiskAlertStatus; severity?: RiskAlertSeverity; note?: string; assignedTo?: string };
type TicketMessage = { by: 'member' | 'admin' | 'system'; userId?: string; adminUserId?: string; message: string; createdAt: string };

const SUPPORT_REF_TYPE = 'SUPPORT_TICKET';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberTicket(user: Actor, input: CreateTicketInput) {
    const subject = this.requireText(input.subject, 'subject');
    const message = this.requireText(input.message, 'message');
    const category = this.cleanText(input.category) || 'general';
    const now = new Date().toISOString();
    const item = await this.prisma.riskAlert.create({
      data: {
        type: 'WALLET_LEDGER_MISMATCH',
        severity: 'MEDIUM',
        status: 'OPEN',
        memberId: user.id,
        refType: SUPPORT_REF_TYPE,
        refId: input.refId ? String(input.refId) : undefined,
        title: subject,
        description: message,
        metadata: this.safeJson({ category, sourceRefType: input.refType ?? null, sourceRefId: input.refId ?? null, messages: [{ by: 'member', userId: user.id, message, createdAt: now }] }),
      },
    });
    return { ok: true, item: this.formatTicket(item) };
  }

  async listMemberTickets(user: Actor, cursor?: string, limitInput?: string) {
    const limit = Math.min(Math.max(Number(limitInput) || 20, 1), 50);
    const items = await this.prisma.riskAlert.findMany({ where: { refType: SUPPORT_REF_TYPE, memberId: user.id }, orderBy: { createdAt: 'desc' }, take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    return { items: page.map((item) => this.formatTicket(item)), nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null };
  }

  async getMemberTicket(user: Actor, id: string) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE, memberId: user.id } });
    if (!item) throw new NotFoundException('Support ticket not found');
    return this.formatTicket(item);
  }

  async memberReply(user: Actor, id: string, input: ReplyInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE, memberId: user.id } });
    if (!item) throw new NotFoundException('Support ticket not found');
    const message = this.requireText(input.message, 'message');
    const metadata = this.ticketMetadata(item.metadata);
    const messages = [...metadata.messages, { by: 'member', userId: user.id, message, createdAt: new Date().toISOString() } satisfies TicketMessage];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: item.status === 'RESOLVED' || item.status === 'DISMISSED' ? 'REVIEWING' : item.status, metadata: this.safeJson({ ...metadata, messages }) } });
    return { ok: true, item: this.formatTicket(updated) };
  }

  async listAdminTickets(query: { status?: string; category?: string; search?: string; cursor?: string; limit?: string }) {
    const where: Prisma.RiskAlertWhereInput = { refType: SUPPORT_REF_TYPE };
    if (query.status && query.status !== 'ALL') where.status = query.status as RiskAlertStatus;
    if (query.search?.trim()) where.title = { contains: query.search.trim(), mode: 'insensitive' };
    const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
    const items = await this.prisma.riskAlert.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit + 1, ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}) });
    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const memberMap = await this.memberMap(page.map((item) => item.memberId).filter(Boolean) as string[]);
    const formatted = page.map((item) => this.formatTicket({ ...item, member: item.memberId ? memberMap.get(item.memberId) : undefined })).filter((item) => !query.category || query.category === 'ALL' || item.category === query.category);
    return { items: formatted, total: formatted.length, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null };
  }

  async getAdminTicket(id: string) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE } });
    if (!item) throw new NotFoundException('Support ticket not found');
    const member = item.memberId ? await this.prisma.user.findUnique({ where: { id: item.memberId }, select: { id: true, username: true, phone: true, email: true } }) : null;
    return this.formatTicket({ ...item, member });
  }

  async adminReply(admin: Actor, id: string, input: ReplyInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE } });
    if (!item) throw new NotFoundException('Support ticket not found');
    const message = this.requireText(input.message, 'message');
    const metadata = this.ticketMetadata(item.metadata);
    const messages = [...metadata.messages, { by: 'admin', adminUserId: admin.id, message, createdAt: new Date().toISOString() } satisfies TicketMessage];
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: { status: 'REVIEWING', metadata: this.safeJson({ ...metadata, messages }) } });
    await this.audit(admin.id, 'support.reply', id, null, { message });
    return { ok: true, item: this.formatTicket(updated) };
  }

  async adminUpdate(admin: Actor, id: string, input: AdminUpdateInput) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE } });
    if (!item) throw new NotFoundException('Support ticket not found');
    const metadata = this.ticketMetadata(item.metadata);
    const patch: Prisma.RiskAlertUpdateInput = {};
    if (input.status) patch.status = input.status;
    if (input.severity) patch.severity = input.severity;
    const messages = [...metadata.messages];
    if (input.note?.trim()) messages.push({ by: 'system', adminUserId: admin.id, message: input.note.trim(), createdAt: new Date().toISOString() });
    patch.metadata = this.safeJson({ ...metadata, assignedTo: input.assignedTo ?? metadata.assignedTo ?? null, messages });
    if (input.status === 'RESOLVED' || input.status === 'DISMISSED') patch.resolvedAt = new Date();
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: patch });
    await this.audit(admin.id, 'support.update', id, item, updated);
    return { ok: true, item: this.formatTicket(updated) };
  }

  private async memberMap(memberIds: string[]) {
    const uniqueIds = Array.from(new Set(memberIds));
    if (uniqueIds.length === 0) return new Map<string, { id: string; username: string; phone: string | null; email: string | null }>();
    const users = await this.prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, username: true, phone: true, email: true } });
    return new Map(users.map((user) => [user.id, user]));
  }

  private formatTicket(item: any) {
    const metadata = this.ticketMetadata(item.metadata);
    return { id: item.id, subject: item.title, message: item.description, status: item.status, severity: item.severity, category: metadata.category, refType: metadata.sourceRefType, refId: metadata.sourceRefId ?? item.refId, assignedTo: metadata.assignedTo ?? null, messages: metadata.messages, member: item.member ?? undefined, createdAt: item.createdAt, updatedAt: item.updatedAt, resolvedAt: item.resolvedAt };
  }

  private ticketMetadata(value: unknown) {
    const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {};
    return { category: typeof data.category === 'string' ? data.category : 'general', sourceRefType: typeof data.sourceRefType === 'string' ? data.sourceRefType : null, sourceRefId: typeof data.sourceRefId === 'string' ? data.sourceRefId : null, assignedTo: typeof data.assignedTo === 'string' ? data.assignedTo : null, messages: Array.isArray(data.messages) ? data.messages : [] as TicketMessage[] };
  }

  private cleanText(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
  private requireText(value: unknown, label: string) { const text = this.cleanText(value); if (!text) throw new BadRequestException(`${label} is required`); return text; }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
  private audit(adminUserId: string, action: string, targetId: string, oldData: unknown, newData: unknown) { return this.prisma.adminAuditLog.create({ data: { adminUserId, action, module: 'support', targetId, oldData: this.safeJson(oldData ?? null), newData: this.safeJson(newData ?? null) } }).catch(() => null); }
}
