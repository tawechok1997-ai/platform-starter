import { KycReviewCommandService } from './kyc-review-command.service';

describe('KycReviewCommandService', () => {
  it('reviews a document and writes the audit record inside the same transaction', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'doc-1', status: 'UPLOADED', version: 2, deleted_at: null }])
      .mockResolvedValueOnce([{ id: 'doc-1', status: 'ACCEPTED', version: 3, size_bytes: 10 }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw, adminAuditLog: { create: auditCreate } })),
    } as any;
    const service = new KycReviewCommandService(prisma);

    const result = await service.reviewDocument('doc-1', { status: 'ACCEPTED', version: 2, note: 'verified' } as any, 'admin-1');

    expect(result.item.status).toBe('ACCEPTED');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        module: 'kyc',
        action: 'REVIEW_KYC_DOCUMENT',
        targetId: 'doc-1',
      }),
    }));
  });

  it('rejects a stale document version before updating or auditing', async () => {
    const auditCreate = jest.fn();
    const queryRaw = jest.fn().mockResolvedValue([{ id: 'doc-1', status: 'UPLOADED', version: 4, deleted_at: null }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw, adminAuditLog: { create: auditCreate } })),
    } as any;
    const service = new KycReviewCommandService(prisma);

    await expect(service.reviewDocument('doc-1', { status: 'ACCEPTED', version: 3 } as any, 'admin-1')).rejects.toThrow(
      'KYC document changed by another reviewer',
    );
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('uses the domain transition policy before approving a case', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'case-1', status: 'SUBMITTED', version: 1 }])
      .mockResolvedValueOnce([{ count: 0n }])
      .mockResolvedValueOnce([{ id: 'case-1', status: 'APPROVED', version: 2 }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw, adminAuditLog: { create: auditCreate } })),
    } as any;
    const service = new KycReviewCommandService(prisma);

    await expect(service.reviewCase('case-1', { status: 'APPROVED', version: 1 } as any, 'admin-1')).resolves.toEqual({
      item: expect.objectContaining({ status: 'APPROVED' }),
    });
    expect(auditCreate).toHaveBeenCalledTimes(1);
  });

  it('requires a rejection reason through the domain policy', async () => {
    const auditCreate = jest.fn();
    const queryRaw = jest.fn().mockResolvedValue([{ id: 'case-1', status: 'REVIEWING', version: 2 }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw, adminAuditLog: { create: auditCreate } })),
    } as any;
    const service = new KycReviewCommandService(prisma);

    await expect(service.reviewCase('case-1', { status: 'REJECTED', version: 2, note: '' } as any, 'admin-1')).rejects.toThrow(
      'A reason is required when KYC is rejected',
    );
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(auditCreate).not.toHaveBeenCalled();
  });
});
