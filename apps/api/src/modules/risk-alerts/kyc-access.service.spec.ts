import { ForbiddenException } from '@nestjs/common';
import { KycAccessService } from './kyc-access.service';

describe('KycAccessService', () => {
  const originalSecret = process.env.KYC_ACCESS_SECRET;

  beforeEach(() => {
    process.env.KYC_ACCESS_SECRET = 'test-kyc-access-secret-123';
  });

  afterAll(() => {
    process.env.KYC_ACCESS_SECRET = originalSecret;
  });

  it('binds an access token to the issuing admin', () => {
    const service = new KycAccessService({} as never, {} as never);
    const issued = service.issueAccessToken('document-1', 'admin-1');
    expect(service.verifyToken(issued.token, 'admin-1')).toMatchObject({ documentId: 'document-1', adminId: 'admin-1' });
    expect(() => service.verifyToken(issued.token, 'admin-2')).toThrow(ForbiddenException);
  });

  it('rejects a modified signature', () => {
    const service = new KycAccessService({} as never, {} as never);
    const issued = service.issueAccessToken('document-1', 'admin-1');
    expect(() => service.verifyToken(`${issued.token}x`, 'admin-1')).toThrow(ForbiddenException);
  });

  it('uses the shared audit shape when downloading', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'document-1', storage_key: 'kyc/key', mime_type: 'image/png', original_name: 'id.png' }]),
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const storage = { get: jest.fn().mockResolvedValue({ contentType: 'image/png', data: Buffer.from('image') }) };
    const service = new KycAccessService(prisma as never, storage as never);
    const issued = service.issueAccessToken('document-1', 'admin-1');

    await service.downloadWithToken(issued.token, 'admin-1');

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        module: 'kyc',
        action: 'DOWNLOAD_KYC_DOCUMENT',
        targetId: 'document-1',
        adminUser: { connect: { id: 'admin-1' } },
      }),
    });
  });
});
