import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';

function ticket(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    memberId: '22222222-2222-4222-8222-222222222222',
    refType: 'SUPPORT_TICKET',
    status: 'OPEN',
    severity: 'MEDIUM',
    title: 'Need help',
    description: 'Initial message',
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    metadata: {
      category: 'general',
      sourceRefType: null,
      sourceRefId: null,
      assignedTo: null,
      messages: [],
      attachments: [],
    },
    ...overrides,
  };
}

function attachmentInput(overrides: Record<string, unknown> = {}) {
  return {
    originalName: 'proof.png',
    mimeType: 'image/png',
    sizeBytes: 1024,
    storageKey: 'support/11111111-1111-4111-8111-111111111111/proof.png',
    checksumSha256: 'a'.repeat(64),
    ...overrides,
  };
}

describe('SupportService', () => {
  const user = { id: '22222222-2222-4222-8222-222222222222' };
  const admin = { id: '33333333-3333-4333-8333-333333333333' };

  function createService(item = ticket()) {
    let current = item;
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockImplementation(async () => current),
        findUnique: jest.fn().mockImplementation(async () => current),
        update: jest.fn().mockImplementation(async ({ data }: any) => {
          current = { ...current, ...data };
          return current;
        }),
      },
      user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(null) },
      adminAuditLog: { create: jest.fn().mockResolvedValue(null) },
    };
    return { service: new SupportService(prisma as any), prisma, current: () => current };
  }

  describe('ticket state transitions', () => {
    it('reopens a resolved ticket into reviewing when the member replies', async () => {
      const { service, prisma } = createService(ticket({ status: 'RESOLVED' }));

      const result = await service.memberReply(user, ticket().id, { message: 'The problem still happens' });

      expect(prisma.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: ticket().id },
        data: expect.objectContaining({ status: 'REVIEWING' }),
      }));
      expect(result.item.status).toBe('REVIEWING');
      expect(result.item.messages.at(-1)).toMatchObject({ by: 'member', message: 'The problem still happens' });
    });

    it('keeps an open ticket open when the member adds another reply', async () => {
      const { service, prisma } = createService(ticket({ status: 'OPEN' }));

      await service.memberReply(user, ticket().id, { message: 'More details' });

      expect(prisma.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'OPEN' }),
      }));
    });

    it('audits an admin reply while moving the ticket to reviewing', async () => {
      const { service, prisma } = createService(ticket({ status: 'OPEN' }));

      const result = await service.adminReply(admin, ticket().id, { message: 'We are checking this' });

      expect(result.item.status).toBe('REVIEWING');
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ adminUserId: admin.id, action: 'support.reply', targetId: ticket().id }),
      }));
    });

    it('sets resolvedAt and preserves the transition note when an admin resolves a ticket', async () => {
      const { service, prisma } = createService(ticket({ status: 'REVIEWING' }));

      const result = await service.adminUpdate(admin, ticket().id, {
        status: 'RESOLVED',
        note: 'Confirmed fixed',
      });

      expect(prisma.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'RESOLVED', resolvedAt: expect.any(Date) }),
      }));
      expect(result.item.status).toBe('RESOLVED');
      expect(result.item.messages.at(-1)).toMatchObject({ by: 'system', message: 'Confirmed fixed' });
      expect(prisma.adminAuditLog.create).toHaveBeenCalled();
    });
  });

  describe('attachment policy', () => {
    it('registers sanitized metadata under the owned ticket prefix', async () => {
      const { service, prisma } = createService();
      const result = await service.registerMemberAttachment(user, ticket().id, attachmentInput({ originalName: '../proof.png' }) as any);

      expect(result.ok).toBe(true);
      expect(result.attachment.originalName).toBe('.._proof.png');
      expect((result.attachment as any).storageKey).toBeUndefined();
      expect(prisma.riskAlert.update).toHaveBeenCalledTimes(1);
    });

    it('rejects storage keys outside the ticket namespace', async () => {
      const { service } = createService();
      await expect(
        service.registerMemberAttachment(user, ticket().id, attachmentInput({ storageKey: 'support/other-ticket/proof.png' }) as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects duplicate checksum registration', async () => {
      const existing = {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        originalName: 'old.png',
        mimeType: 'image/png',
        sizeBytes: 100,
        storageKey: `support/${ticket().id}/old.png`,
        checksumSha256: 'a'.repeat(64),
        uploadedBy: 'member',
        uploadedById: user.id,
        createdAt: new Date().toISOString(),
        deletedAt: null,
        deletedById: null,
      };
      const { service } = createService(ticket({ metadata: { category: 'general', messages: [], attachments: [existing] } }));

      await expect(service.registerMemberAttachment(user, ticket().id, attachmentInput() as any)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('prevents a member from deleting another actor attachment', async () => {
      const existing = {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        originalName: 'admin.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 100,
        storageKey: `support/${ticket().id}/admin.pdf`,
        checksumSha256: 'b'.repeat(64),
        uploadedBy: 'admin',
        uploadedById: admin.id,
        createdAt: new Date().toISOString(),
        deletedAt: null,
        deletedById: null,
      };
      const { service } = createService(ticket({ metadata: { category: 'general', messages: [], attachments: [existing] } }));

      await expect(service.removeMemberAttachment(user, ticket().id, existing.id)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});