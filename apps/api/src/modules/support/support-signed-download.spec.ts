import { SupportAttachmentsService } from './support-attachments.service';

describe('SupportAttachmentsService signed downloads', () => {
  const ticketMetadata = {
    attachments: [{
      id: 'attachment-1',
      originalName: 'proof.pdf',
      mimeType: 'application/pdf',
      storageKey: 'support/ticket-1/proof.pdf',
    }],
  };

  function createService() {
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ticket-1', metadata: ticketMetadata }),
      },
    };
    const storage = {
      put: jest.fn().mockResolvedValue({ key: 'stored' }),
      get: jest.fn(),
      remove: jest.fn(),
    };
    const signedAccess = {
      issue: jest.fn().mockReturnValue({ token: 'signed-token', expiresAt: '2026-07-15T00:05:00.000Z', ttlSeconds: 300 }),
    };
    const support = {
      registerMemberAttachment: jest.fn().mockResolvedValue({ id: 'attachment-new' }),
      registerAdminAttachment: jest.fn(),
      removeMemberAttachment: jest.fn(),
      removeAdminAttachment: jest.fn(),
    };
    const service = new SupportAttachmentsService(prisma as never, storage as never, signedAccess as never, support as never);
    return { service, prisma, storage, signedAccess, support };
  }

  it('accepts raw base64 without a data URL wrapper', async () => {
    const { service, storage, support } = createService();
    const pdf = Buffer.from('%PDF-1.7\nexample', 'utf8');

    await service.uploadMember({ id: 'member-1' } as never, 'ticket-1', {
      originalName: 'proof.pdf',
      mimeType: 'application/pdf',
      contentBase64: pdf.toString('base64'),
    });

    expect(storage.put).toHaveBeenCalledWith(expect.stringMatching(/^support\/ticket-1\/.+\.pdf$/), pdf, 'application/pdf');
    expect(support.registerMemberAttachment).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'member-1' }),
      'ticket-1',
      expect.objectContaining({ sizeBytes: pdf.length, mimeType: 'application/pdf' }),
    );
  });

  it('issues a short-lived URL only after member ownership lookup', async () => {
    const { service, prisma, signedAccess } = createService();
    const result = await service.createMemberDownload({ id: 'member-1' } as never, 'ticket-1', 'attachment-1');

    expect(prisma.riskAlert.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'ticket-1', memberId: 'member-1' }),
    }));
    expect(signedAccess.issue).toHaveBeenCalledWith({
      key: 'support/ticket-1/proof.pdf',
      contentType: 'application/pdf',
      fileName: 'proof.pdf',
    });
    expect(result).toEqual({
      url: '/storage/signed/signed-token',
      expiresAt: '2026-07-15T00:05:00.000Z',
      ttlSeconds: 300,
    });
  });
});
