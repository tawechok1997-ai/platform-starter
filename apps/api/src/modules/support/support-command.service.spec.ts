import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupportCommandService } from './support-command.service';

function ticket(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ticket-1',
    title: 'Help',
    description: 'Need help',
    status: 'RESOLVED',
    severity: 'MEDIUM',
    refId: null,
    metadata: {
      category: 'general',
      sourceRefType: null,
      sourceRefId: null,
      assignedTo: null,
      messages: [],
      attachments: [],
    },
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    updatedAt: new Date('2026-07-14T00:00:00.000Z'),
    resolvedAt: null,
    ...overrides,
  };
}

describe('SupportCommandService', () => {
  it('reopens a resolved ticket when the member replies', async () => {
    const existing = ticket();
    const updated = ticket({ status: 'REVIEWING' });
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(updated),
      },
      adminAuditLog: { create: jest.fn() },
    };
    const service = new SupportCommandService(prisma as never);

    await service.memberReply({ id: 'member-1' }, 'ticket-1', { message: 'More details' });

    expect(prisma.riskAlert.findFirst).toHaveBeenCalledWith({
      where: { id: 'ticket-1', refType: 'SUPPORT_TICKET', memberId: 'member-1' },
    });
    expect(prisma.riskAlert.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ticket-1' },
        data: expect.objectContaining({ status: 'REVIEWING' }),
      }),
    );
  });

  it('prevents a member from removing another member attachment', async () => {
    const existing = ticket({
      metadata: {
        category: 'general',
        sourceRefType: null,
        sourceRefId: null,
        assignedTo: null,
        messages: [],
        attachments: [
          {
            id: 'attachment-1',
            originalName: 'proof.png',
            mimeType: 'image/png',
            sizeBytes: 100,
            storageKey: 'support/ticket-1/proof.png',
            checksumSha256: 'abc',
            uploadedBy: 'member',
            uploadedById: 'member-2',
            createdAt: '2026-07-14T00:00:00.000Z',
            deletedAt: null,
            deletedById: null,
          },
        ],
      },
    });
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue(existing),
        update: jest.fn(),
      },
      adminAuditLog: { create: jest.fn() },
    };
    const service = new SupportCommandService(prisma as never);

    await expect(service.removeMemberAttachment({ id: 'member-1' }, 'ticket-1', 'attachment-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.riskAlert.update).not.toHaveBeenCalled();
  });

  it('writes admin reply audit data through the shared audit shape', async () => {
    const existing = ticket({ status: 'OPEN' });
    const updated = ticket({ status: 'REVIEWING' });
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(updated),
      },
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const service = new SupportCommandService(prisma as never);

    await service.adminReply({ id: 'admin-1' }, 'ticket-1', { message: 'We are checking this' });

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUser: { connect: { id: 'admin-1' } },
        module: 'support',
        action: 'support.reply',
        targetId: 'ticket-1',
      }),
    });
  });

  it('requires a reason before dismissing a ticket', async () => {
    const existing = ticket({ status: 'OPEN' });
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue(existing),
        update: jest.fn(),
      },
      adminAuditLog: { create: jest.fn() },
    };
    const service = new SupportCommandService(prisma as never);

    await expect(
      service.adminUpdate({ id: 'admin-1' }, 'ticket-1', { status: 'DISMISSED' } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.riskAlert.update).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });
});
