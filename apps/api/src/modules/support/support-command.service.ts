import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RiskAlertSeverity, RiskAlertStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { buildAdminAuditData, toAuditJson } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminUpdateSupportTicketDto,
  CreateSupportTicketDto,
  RegisterSupportAttachmentDto,
  SupportReplyDto,
} from './dto/support-ticket.dto';
import {
  mapPublicAttachment,
  mapSupportTicket,
  parseTicketMetadata,
  type TicketAttachment,
  type TicketMessage,
  type TicketMetadata,
} from './support-ticket.mapper';

export type SupportActor = { id: string };

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
export class SupportCommandService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberTicket(user: SupportActor, input: CreateSupportTicketDto) {
    const subject = requireText(input.subject, 'subject');
    const message = requireText(input.message, 'message');
    const category = cleanText(input.category) || 'general';
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
        metadata: toAuditJson({
          category,
          sourceRefType: input.refType ?? null,
          sourceRefId: input.refId ?? null,
          messages: [{ by: 'member', userId: user.id, message, createdAt: now }],
          attachments: [],
        }),
      },
    });
    return { ok: true, item: mapSupportTicket(item) };
  }

  async memberReply(user: SupportActor, id: string, input: SupportReplyDto) {
    const item = await this.findMemberTicket(user.id, id);
    const message = requireText(input.message, 'message');
    const metadata = parseTicketMetadata(item.metadata);
    const messages = [
      ...metadata.messages,
      { by: 'member', userId: user.id, message, createdAt: new Date().toISOString() } satisfies TicketMessage,
    ];
    const updated = await this.prisma.riskAlert.update({
      where: { id },
      data: {
        status: item.status === 'RESOLVED' || item.status === 'DISMISSED' ? 'REVIEWING' : item.status,
        metadata: toAuditJson({ ...metadata, messages }),
      },
    });
    return { ok: true, item: mapSupportTicket(updated) };
  }

  async registerMemberAttachment(user: SupportActor, id: string, input: RegisterSupportAttachmentDto) {
    const item = await this.findMemberTicket(user.id, id);
    return this.registerAttachment(item, user, 'member', input);
  }

  async removeMemberAttachment(user: SupportActor, id: string, attachmentId: string) {
    const item = await this.findMemberTicket(user.id, id);
    const metadata = parseTicketMetadata(item.metadata);
    const attachment = metadata.attachments.find((entry) => entry.id === attachmentId && !entry.deletedAt);
    if (!attachment) throw new NotFoundException('Support attachment not found');
    if (attachment.uploadedBy !== 'member' || attachment.uploadedById !== user.id) {
      throw new ForbiddenException('You cannot remove this attachment');
    }
    return this.softDeleteAttachment(item.id, metadata, attachment, user.id);
  }

  async adminReply(admin: SupportActor, id: string, input: SupportReplyDto) {
    const item = await this.findAdminTicket(id);
    const message = requireText(input.message, 'message');
    const metadata = parseTicketMetadata(item.metadata);
    const messages = [
      ...metadata.messages,
      { by: 'admin', adminUserId: admin.id, message, createdAt: new Date().toISOString() } satisfies TicketMessage,
    ];
    const updated = await this.prisma.riskAlert.update({
      where: { id },
      data: { status: 'REVIEWING', metadata: toAuditJson({ ...metadata, messages }) },
    });
    await this.audit(admin.id, 'support.reply', id, null, { message });
    return { ok: true, item: mapSupportTicket(updated) };
  }

  async registerAdminAttachment(admin: SupportActor, id: string, input: RegisterSupportAttachmentDto) {
    const item = await this.findAdminTicket(id);
    const result = await this.registerAttachment(item, admin, 'admin', input);
    await this.audit(admin.id, 'support.attachment.register', id, null, {
      attachmentId: result.attachment.id,
      storageKey: input.storageKey,
    });
    return result;
  }

  async removeAdminAttachment(admin: SupportActor, id: string, attachmentId: string) {
    const item = await this.findAdminTicket(id);
    const metadata = parseTicketMetadata(item.metadata);
    const attachment = metadata.attachments.find((entry) => entry.id === attachmentId && !entry.deletedAt);
    if (!attachment) throw new NotFoundException('Support attachment not found');
    const result = await this.softDeleteAttachment(item.id, metadata, attachment, admin.id);
    await this.audit(admin.id, 'support.attachment.remove', id, attachment, { deletedAt: result.deletedAt });
    return result;
  }

  async adminUpdate(admin: SupportActor, id: string, input: AdminUpdateSupportTicketDto) {
    const item = await this.findAdminTicket(id);
    const metadata = parseTicketMetadata(item.metadata);
    const patch: Prisma.RiskAlertUpdateInput = {};
    if (input.status) patch.status = input.status as RiskAlertStatus;
    if (input.severity) patch.severity = input.severity as RiskAlertSeverity;
    const messages = [...metadata.messages];
    if (input.note?.trim()) {
      messages.push({
        by: 'system',
        adminUserId: admin.id,
        message: input.note.trim(),
        createdAt: new Date().toISOString(),
      });
    }
    patch.metadata = toAuditJson({
      ...metadata,
      assignedTo: input.assignedTo ?? metadata.assignedTo ?? null,
      messages,
    });
    if (input.status === 'RESOLVED' || input.status === 'DISMISSED') patch.resolvedAt = new Date();
    const updated = await this.prisma.riskAlert.update({ where: { id }, data: patch });
    await this.audit(admin.id, 'support.update', id, item, updated);
    return { ok: true, item: mapSupportTicket(updated) };
  }

  private async registerAttachment(
    item: { id: string; metadata: Prisma.JsonValue | null },
    actor: SupportActor,
    uploadedBy: 'member' | 'admin',
    input: RegisterSupportAttachmentDto,
  ) {
    const metadata = parseTicketMetadata(item.metadata);
    const activeAttachments = metadata.attachments.filter((entry) => !entry.deletedAt);
    if (activeAttachments.length >= MAX_ATTACHMENTS_PER_TICKET) {
      throw new BadRequestException(`A support ticket can have at most ${MAX_ATTACHMENTS_PER_TICKET} attachments`);
    }
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(input.mimeType)) {
      throw new BadRequestException('Attachment MIME type is not allowed');
    }
    if (input.sizeBytes < 1 || input.sizeBytes > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException('Attachment size is outside the allowed range');
    }
    const requiredPrefix = `support/${item.id}/`;
    if (!input.storageKey.startsWith(requiredPrefix)) {
      throw new BadRequestException('Attachment storage key does not belong to this ticket');
    }
    const duplicate = activeAttachments.find(
      (entry) => entry.checksumSha256.toLowerCase() === input.checksumSha256.toLowerCase(),
    );
    if (duplicate) throw new BadRequestException('This attachment is already registered on the ticket');

    const attachment: TicketAttachment = {
      id: randomUUID(),
      originalName: safeFileName(input.originalName),
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
    await this.prisma.riskAlert.update({
      where: { id: item.id },
      data: { metadata: toAuditJson({ ...metadata, attachments }) },
    });
    return { ok: true, attachment: mapPublicAttachment(attachment) };
  }

  private async softDeleteAttachment(
    ticketId: string,
    metadata: TicketMetadata,
    attachment: TicketAttachment,
    deletedById: string,
  ) {
    const deletedAt = new Date().toISOString();
    const attachments = metadata.attachments.map((entry) =>
      entry.id === attachment.id ? { ...entry, deletedAt, deletedById } : entry,
    );
    await this.prisma.riskAlert.update({
      where: { id: ticketId },
      data: { metadata: toAuditJson({ ...metadata, attachments }) },
    });
    return { ok: true, attachmentId: attachment.id, deletedAt, cleanup: { storageKey: attachment.storageKey } };
  }

  private async findMemberTicket(userId: string, id: string) {
    const item = await this.prisma.riskAlert.findFirst({
      where: { id, refType: SUPPORT_REF_TYPE, memberId: userId },
    });
    if (!item) throw new NotFoundException('Support ticket not found');
    return item;
  }

  private async findAdminTicket(id: string) {
    const item = await this.prisma.riskAlert.findFirst({ where: { id, refType: SUPPORT_REF_TYPE } });
    if (!item) throw new NotFoundException('Support ticket not found');
    return item;
  }

  private audit(adminUserId: string, action: string, targetId: string, oldData: unknown, newData: unknown) {
    return this.prisma.adminAuditLog
      .create({
        data: buildAdminAuditData({ adminUserId, module: 'support', action, targetId, oldData, newData }),
      })
      .catch(() => null);
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireText(value: unknown, label: string) {
  const text = cleanText(value);
  if (!text) throw new BadRequestException(`${label} is required`);
  return text;
}

function safeFileName(value: string) {
  const normalized = value.normalize('NFKC').replace(/[\\/\u0000-\u001f\u007f]/g, '_').trim();
  return normalized.slice(0, 255) || 'attachment';
}
