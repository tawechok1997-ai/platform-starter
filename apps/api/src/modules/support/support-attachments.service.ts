import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedAdminActor, MemberActor } from '../../common/actors';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { UploadSupportAttachmentDto } from './dto/support-attachment-upload.dto';
import { SupportService } from './support.service';

const SUPPORT_REF_TYPE = 'SUPPORT_TICKET';
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const MIME_RULES: Record<string, { ext: string; magic: (buffer: Buffer) => boolean }> = {
  'image/jpeg': {
    ext: 'jpg',
    magic: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  'image/png': {
    ext: 'png',
    magic: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    ext: 'webp',
    magic: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  'application/pdf': {
    ext: 'pdf',
    magic: (buffer) => buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-',
  },
  'text/plain': {
    ext: 'txt',
    magic: (buffer) => !buffer.includes(0),
  },
};

type StoredAttachment = {
  id: string;
  mimeType: string;
  storageKey: string;
  deletedAt?: string | null;
};

type AttachmentRemovalResult = {
  ok: true;
  attachmentId: string;
  deletedAt: string;
  cleanup: { storageKey: string };
};

@Injectable()
export class SupportAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly support: SupportService,
  ) {}

  async uploadMember(user: MemberActor, ticketId: string, dto: UploadSupportAttachmentDto) {
    await this.requireMemberTicket(user.id, ticketId);
    const stored = await this.store(ticketId, dto);
    try {
      return await this.support.registerMemberAttachment(user, ticketId, stored.registration);
    } catch (error) {
      await this.storage.remove(stored.registration.storageKey).catch(() => undefined);
      throw error;
    }
  }

  async uploadAdmin(admin: AuthenticatedAdminActor, ticketId: string, dto: UploadSupportAttachmentDto) {
    await this.requireAdminTicket(ticketId);
    const stored = await this.store(ticketId, dto);
    try {
      return await this.support.registerAdminAttachment(admin, ticketId, stored.registration);
    } catch (error) {
      await this.storage.remove(stored.registration.storageKey).catch(() => undefined);
      throw error;
    }
  }

  async removeMember(user: MemberActor, ticketId: string, attachmentId: string) {
    const result = (await this.support.removeMemberAttachment(user, ticketId, attachmentId)) as AttachmentRemovalResult;
    return this.removeStoredObject(result);
  }

  async removeAdmin(admin: AuthenticatedAdminActor, ticketId: string, attachmentId: string) {
    const result = (await this.support.removeAdminAttachment(admin, ticketId, attachmentId)) as AttachmentRemovalResult;
    return this.removeStoredObject(result);
  }

  async readMember(user: MemberActor, ticketId: string, attachmentId: string) {
    const ticket = await this.requireMemberTicket(user.id, ticketId);
    return this.read(ticket.metadata, attachmentId);
  }

  async readAdmin(ticketId: string, attachmentId: string) {
    const ticket = await this.requireAdminTicket(ticketId);
    return this.read(ticket.metadata, attachmentId);
  }

  private async removeStoredObject(result: AttachmentRemovalResult) {
    await this.storage.remove(result.cleanup.storageKey);
    return { ...result, cleanup: { ...result.cleanup, removed: true } };
  }

  private async store(ticketId: string, dto: UploadSupportAttachmentDto) {
    const parsed = this.parseDataUrl(dto.dataUrl);
    if (parsed.mimeType !== dto.mimeType) throw new BadRequestException('Attachment MIME type does not match data URL');
    const rule = MIME_RULES[parsed.mimeType];
    if (!rule) throw new BadRequestException('Attachment MIME type is not allowed');
    if (parsed.data.length === 0) throw new BadRequestException('Attachment file is empty');
    if (parsed.data.length > MAX_ATTACHMENT_BYTES) throw new BadRequestException('Attachment exceeds 10 MB limit');
    if (!rule.magic(parsed.data)) throw new BadRequestException('Attachment file signature does not match MIME type');

    const storageKey = `support/${ticketId}/${randomUUID()}.${rule.ext}`;
    const checksumSha256 = createHash('sha256').update(parsed.data).digest('hex');
    await this.storage.put(storageKey, parsed.data, parsed.mimeType);

    return {
      registration: {
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        sizeBytes: parsed.data.length,
        storageKey,
        checksumSha256,
      },
    };
  }

  private async read(metadataValue: Prisma.JsonValue | null, attachmentId: string) {
    const metadata = this.asRecord(metadataValue);
    const attachments = Array.isArray(metadata.attachments) ? metadata.attachments : [];
    const attachment = attachments.find((entry): entry is StoredAttachment => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
      const value = entry as Record<string, unknown>;
      return value.id === attachmentId && typeof value.storageKey === 'string' && typeof value.mimeType === 'string' && !value.deletedAt;
    });
    if (!attachment) throw new NotFoundException('Support attachment not found');
    return this.storage.get(attachment.storageKey, attachment.mimeType);
  }

  private async requireMemberTicket(memberId: string, ticketId: string) {
    const ticket = await this.prisma.riskAlert.findFirst({
      where: { id: ticketId, refType: SUPPORT_REF_TYPE, memberId },
      select: { id: true, metadata: true },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  private async requireAdminTicket(ticketId: string) {
    const ticket = await this.prisma.riskAlert.findFirst({
      where: { id: ticketId, refType: SUPPORT_REF_TYPE },
      select: { id: true, metadata: true },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  private parseDataUrl(value: string) {
    const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i.exec(value.trim());
    if (!match) throw new BadRequestException('Attachment must be a valid base64 data URL');
    const data = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    return { mimeType: match[1].toLowerCase(), data };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }
}
