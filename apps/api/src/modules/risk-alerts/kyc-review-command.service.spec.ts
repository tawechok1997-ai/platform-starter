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
});
