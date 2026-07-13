import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupportService } from './support.service';

function ticket(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    memberId: '22222222-2222-4222-8222-222222222222',
    refType: 'SUPPORT_TICKET',
    status: 'OPEN',
    metadata: {
      category: 'general',
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

describe('SupportService attachment policy', () => {
  const user = { id: '22222222-2222-4222-8222-222222222222' };

  function createService(item = ticket()) {
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue(item),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({ ...item, ...data })),
      },
      adminAuditLog: { create: jest.fn().mockResolvedValue(null) },
    };
    return { service: new SupportService(prisma as any), prisma };
  }

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
      uploadedById: '33333333-3333-4333-8333-333333333333',
      createdAt: new Date().toISOString(),
      deletedAt: null,
      deletedById: null,
    };
    const { service } = createService(ticket({ metadata: { category: 'general', messages: [], attachments: [existing] } }));

    await expect(service.removeMemberAttachment(user, ticket().id, existing.id)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
