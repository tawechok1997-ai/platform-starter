import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { KycDocumentsService } from './kyc-documents.service';

function service(overrides: any = {}) {
  const prisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $transaction: jest.fn(async (callback: any) => callback(prisma)),
    adminAuditLog: { create: jest.fn(async () => ({})) },
    ...overrides.prisma,
  };
  const storage = {
    put: jest.fn(async (key: string) => ({ key })),
    get: jest.fn(async () => ({ data: Buffer.from('hello'), contentType: 'image/png' })),
    remove: jest.fn(async () => ({ deleted: true })),
    ...overrides.storage,
  };
  process.env.KYC_ACCESS_SECRET = 'kyc-access-test-secret-2026';
  return { instance: new KycDocumentsService(prisma as any, storage as any), prisma, storage };
}

describe('KycDocumentsService', () => {
  it('rejects unsupported MIME types before storage', async () => {
    const { instance, storage } = service();
    await expect(instance.upload('11111111-1111-4111-8111-111111111111', {
      documentType: 'SELFIE',
      originalName: 'selfie.svg',
      dataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('stores an allowed document with a private randomized key', async () => {
    const { instance, prisma, storage } = service();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: '22222222-2222-4222-8222-222222222222', status: 'DRAFT' }])
      .mockResolvedValueOnce([{
        id: 'doc-1', case_id: '22222222-2222-4222-8222-222222222222', member_id: '11111111-1111-4111-8111-111111111111',
        document_type: 'SELFIE', status: 'UPLOADED', original_name: 'selfie.png', mime_type: 'image/png',
        size_bytes: 5, sha256: 'hash', retention_until: new Date(), version: 1,
      }]);

    const result = await instance.upload('11111111-1111-4111-8111-111111111111', {
      documentType: 'SELFIE', originalName: 'selfie.png', dataUrl: 'data:image/png;base64,aGVsbG8=',
    });

    expect(storage.put).toHaveBeenCalledWith(expect.stringMatching(/^kyc\/11111111-1111-4111-8111-111111111111\/22222222-2222-4222-8222-222222222222\/.+\.png$/), Buffer.from('hello'), 'image/png');
    expect(result.item).not.toHaveProperty('storageKey');
  });

  it('binds access tokens to the issuing admin and expiry', async () => {
    const { instance, prisma } = service();
    const issued = instance.issueAccessToken('33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444');
    await expect(instance.downloadWithToken(issued.token, '55555555-5555-4555-8555-555555555555')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('rejects a stale document review version', async () => {
    const { instance, prisma } = service();
    prisma.$queryRaw.mockResolvedValueOnce([{ id: 'doc-1', version: 2, status: 'UPLOADED', deleted_at: null }]);
    await expect(instance.reviewDocument('33333333-3333-4333-8333-333333333333', {
      status: 'ACCEPTED', version: 1,
    }, '44444444-4444-4444-8444-444444444444')).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires identity and selfie before submission', async () => {
    const { instance, prisma } = service();
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: 'case-1', version: 1, status: 'DRAFT' }])
      .mockResolvedValueOnce([{ document_type: 'SELFIE' }]);
    await expect(instance.submit('11111111-1111-4111-8111-111111111111')).rejects.toBeInstanceOf(BadRequestException);
  });
});