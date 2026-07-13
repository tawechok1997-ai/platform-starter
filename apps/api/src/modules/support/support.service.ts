import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertSeverity, RiskAlertStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminUpdateSupportTicketDto,
  CreateSupportTicketDto,
  RegisterSupportAttachmentDto,
  SupportReplyDto,
} from './dto/support-ticket.dto';

type Actor = { id: string };
type TicketMessage = { by: 'member' | 'admin' | 'system'; userId?: string; adminUserId?: string; message: string; createdAt: string };
type TicketAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksumSha256: string;
  uploadedBy: 'member' | 'admin';
  uploadedById: string;
  createdAt: string;
  deletedAt: string | null;
  deletedById: string | null;
};
type TicketMetadata = {
  category: string;
  sourceRefType: string | null;
  sourceRefId: string | null;
  assignedTo: string | null;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
};

const SUPPORT_REF_TYPE = 'SUPPORT_TICKET';
const MAX_ATTACHMENTS_PER_TICKET = 10;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
]);

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberTicket(user: Actor, input: CreateSupportTicketDto) {
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
        metadata: this.safeJson({
          category,
          sourceRefType: input.refType ?? null,
          sourceRefId: input.refId ?? null,
          messages: [{ by: 'member', userId: user.id, message, createdAt: now }],
          attachments: [],
        }),
      },
    });
    return { ok: true, item: this.formatTicket(item) };
  }

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
    return { items: page.map((item) => this.formatTicket(item)), nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null };
  }

  async getMemberTicket(user: Actor, id: string) {
    const item = await this.findMemberTicket(user.id, id);
    return this.formatTicket(item);
  }

  async memberReply(user: Actor, id: string, input: SupportReplyDto) {
    const item = await this.findMemberTicket(user.id, id);
    const message = this.requireText(input.message, 'message');
    const metadata = this.ticketMetadata(item.metadata);
    const messages = [...metadata.messages, { by: 'member', userId: user.id, message, createdAt: new Date().toISOString() } satisfies TicketMessage];
    const updated = await this.prisma.riskAlert.update({
      where: { id },
      data: {
        status: item.status === 'RESOLVED' || item.status === 'DISMISSED' ? 'REVIEWING' : item.status,
        metadata: this.safeJson({ ...metadata, messages }),
      },
    });
    return { ok: true, item: this.formatTicket(updated) };
  }

  async registerMemberAttachment(user: Actor, id: string, input: RegisterSupportAttachmentDto) {
    const item = await this.findMemberTicket(user.id, id);
    return this.registerAttachment(item, user, 'member', input);
  }

  async removeMemberAttachment(user: Actor, id: string, attachmentId: string) {
    const item = await this.findMemberTicket(user.id, id);
    const metadata = this.ticketMetadata(item.metadata);
    const attachment = metadata.attachments.find((entry) => entry.id === attachmentId && !entry.deletedAt);
    if (!attachment) throw new NotFoundException('Support attachment not found');
    if (attachment.uploadedBy !== 'member' || attachment.uploadedById !== user.id) {
      throw new ForbiddenException('You cannot remove this attachment');
    }
    return this.softDeleteAttachment(item.id, metadata, attachment, user.id);
  }

  async listAdminTickets(query: { status?: string; category?: string; search?: string; cursor?: string; limit?: string }) {
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
    const memberMap = await this.memberMap(page.map((item) => item.memberId).filter(Boolean) as string[]);
    const formatted = page
      .map((item) => this.formatTicket({ ...item, member: item.memberId ? memberMap.get(item.memberId) : undefined }))
      .filter((item) => !query.category || query.category === 'ALL' || item.category === query.category);
    return { items: formatted, total: formatted.length, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null };
  }

  async getAdminTicket(id: string) {
    const item = await this.findAdminTicket(id);
    const member = item.memberId
      ? await this.prisma.user.findUnique({ where: { id: item.memberId }, select: { id: true, username: true, phone: true, email: true } })
      : null;
    return this.formatTicket({ ...item, member });
  }

  async adminReply(admin: Actor, id: string, input: SupportReplyDto) {
    const item = await this.findAdminTicket(id);
    const message = this.requireText(input.message, 'message');
    const metadata = this.ticketMetadata(item.metadata);
    const messages = [...metadata.messages, { by: 'admin', adminUserId: admin.id, message, createdAt: new Date().toISOString() } satisfies TicketMessage];
    const updated = await this.prisma.riskAlert.update({
      where: { id },
      data: { status: 'REVIEWING', metadata: this.safeJson({ ...metadata, messages }) },
    });
    await this.audit(admin.id, 'support.reply', id, null, { message });
    return { ok: true, item: this.formatTicket(updated) };
  }

  async registerAdminAttachment(admin: Actor, id: string, input: RegisterSupportAttachmentDto) {
    const item = await this.findAdminTicket(id);
    const result = await this.registerAttachment(item, admin, 'admin', input);
    await this.audit(admin.id, 'support.attachment.register', id, null, { attachmentId: result.attachment.id, storageKey: input.storageKey });
    return result;
  }

  async removeAdminAttachment(admin: Actor, id: string, attachmentId: string) {
    const item = await this.findAdminTicket(id);
    const metadata = this.ticketMetadata(item.metadata);
    const attachment = metadata.attachments.find((entry) => entry.id === attachmentId && !entry.deletedAt);
    if (!attachment) throw new NotFoundException('Support attachment not found');
    const result = await this.softDeleteAttachment(item.id, metadata, attachment, admin.id);
    await this.audit(admin.id, 'support.attachment.remove', id, attachment, { deletedAt: result.deletedAt });
    return result;
  }

  async adminUpdate(admin: Actor, id: string, input: AdminUpdateSupportTicketDto) {
    const item = await this.findAdminTicket(id);
    const metadata = this.ticketMetadata(item.metadata);
    const patch: Prisma.RiskAlertUpdateInput = {};
    if (input.status) patch.status = input.status as RiskAlertStatus;
    if (input.severity) patch.severity = input.severity as RiskAlertSeverity;
    const messages = [...metadata.messages];
    if (input.note?.trim()) messages.push({ by: 'system', adminUserId: admin.id, message: input.note.trim(), createdAt: new Date().toISOString() });
    patch.metadata = this.safeJson({ ...metadata, assignedTo: input.assignedTo ?? metadata.assignedTo ?? null, messages });
    if (input.status === 'RESOLVED' || input.status === 'DISMISSED') patch.resolvedAt = new Date();
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: patch });
    await this.audit(admin.id, 'support.update', id, item, updated);
    return { ok: true, item: this.formatTicket(updated) };
  }

  private async registerAttachment(
    item: { id: string; metadata: Prisma.JsonValue | null },
    actor: Actor,
    uploadedBy: 'member' | 'admin',
    input: RegisterSupportAttachmentDto,
  ) {
    const metadata = this.ticketMetadata(item.metadata);
    const activeAttachments = metadata.attachments.filter((entry) => !entry.deletedAt);
    if (activeAttachments.length >= MAX_ATTACHMENTS_PER_TICKET) {
      throw new BadRequestException(`A support ticket can have at most ${MAX_ATTACHMENTS_PER_TICKET} attachments`);
    }
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(input.mimeType)) throw new BadRequestException('Attachment MIME type is not allowed');
    if (input.sizeBytes < 1 || input.sizeBytes > MAX_ATTACHMENT_BYTES) throw new BadRequestException('Attachment size is outside the allowed range');
    const requiredPrefix = `support/${item.id}/`;
    if (!input.storageKey.startsWith(requiredPrefix)) throw new BadRequestException('Attachment storage key does not belong to this ticket');
    const duplicate = activeAttachments.find((entry) => entry.checksumSha256.toLowerCase() === input.checksumSha256.toLowerCase());
    if (duplicate) throw new BadRequestException('This attachment is already registered on the ticket');

    const attachment: TicketAttachment = {
      id: randomUUID(),
      originalName: this.safeFileName(input.originalName),
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storageKey: input.storageKey,
      checksumSha256: input.checksumSha256.toLowerCase(),
      uploadedBy,
      uploadedById: actor.id,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      deletedById: null,
    };
    const attachments = [...metadata.attachments, attachment];
    await this.prisma.riskAlert.update({ where: { id: item.id }, data: { metadata: this.safeJson({ ...metadata, attachments }) } });
    return { ok: true, attachment: this.publicAttachment(attachment) };
  }

  private async softDeleteAttachment(ticketId: string, metadata: TicketMetadata, attachment: TicketAttachment, deletedById: string) {
    const deletedAt = new Date().toISOString();
    const attachments = metadata.attachments.map((entry) =>
      entry.id === attachment.id ? { ...entry, deletedAt, deletedById } : entry,
    );
    await this.prisma.riskAlert.update({ where: { id: ticketId }, data: { metadata: this.safeJson({ ...metadata, attachments }) } });
    return {
      ok: true,
      attachmentId: attachment.id,
      deletedAt,
      cleanup: { storageKey: attachment.storageKey },
    };
  }

  private async findMemberTicket(userId: string, id: string) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE, memberId: userId } });
    if (!item) throw new NotFoundException('Support ticket not found');
    return item;
  }

  private async findAdminTicket(id: string) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE } });
    if (!item) throw new NotFoundException('Support ticket not found');
    return item;
  }

  private async memberMap(memberIds: string[]) {
    const uniqueIds = Array.from(new Set(memberIds));
    if (uniqueIds.length === 0) return new Map<string, { id: string; username: string; phone: string | null; email: string | null }>();
    const users = await this.prisma.user.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, username: true, phone: true, email: true } });
    return new Map(users.map((user) => [user.id, user]));
  }

  private formatTicket(item: any) {
    const metadata = this.ticketMetadata(item.metadata);
    return {
      id: item.id,
      subject: item.title,
      message: item.description,
      status: item.status,
      severity: item.severity,
      category: metadata.category,
      refType: metadata.sourceRefType,
      refId: metadata.sourceRefId ?? item.refId,
      assignedTo: metadata.assignedTo ?? null,
      messages: metadata.messages,
      attachments: metadata.attachments.filter((entry) => !entry.deletedAt).map((entry) => this.publicAttachment(entry)),
      member: item.member ?? undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      resolvedAt: item.resolvedAt,
    };
  }

  private publicAttachment(attachment: TicketAttachment) {
    const { storageKey: _storageKey, deletedById: _deletedById, ...safe } = attachment;
    return safe;
  }

  private ticketMetadata(value: unknown): TicketMetadata {
    const data = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    return {
      category: typeof data.category === 'string' ? data.category : 'general',
      sourceRefType: typeof data.sourceRefType === 'string' ? data.sourceRefType : null,
      sourceRefId: typeof data.sourceRefId === 'string' ? data.sourceRefId : null,
      assignedTo: typeof data.assignedTo === 'string' ? data.assignedTo : null,
      messages: Array.isArray(data.messages) ? (data.messages as TicketMessage[]) : [],
      attachments: Array.isArray(data.attachments) ? (data.attachments as TicketAttachment[]) : [],
    };
  }

  private safeFileName(value: string) {
    const normalized = value.normalize('NFKC').replace(/[\\/\u0000-\u001f\u007f]/g, '_').trim();
    return normalized.slice(0, 255) || 'attachment';
  }

  private cleanText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private requireText(value: unknown, label: string) {
    const text = this.cleanText(value);
    if (!text) throw new BadRequestException(`${label} is required`);
    return text;
  }

  private safeJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private audit(adminUserId: string, action: string, targetId: string, oldData: unknown, newData: unknown) {
    return this.prisma.adminAuditLog
      .create({
        data: {
          adminUserId,
          action,
          module: 'support',
          targetId,
          oldData: this.safeJson(oldData ?? null),
          newData: this.safeJson(newData ?? null),
        },
      })
      .catch(() => null);
  }
}
