import { KycMemberCommandService } from './kyc-member-command.service';

describe('KycMemberCommandService', () => {
  it('submits a draft case only when identity and selfie documents exist', async () => {
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'case-1', status: 'DRAFT', version: 1 }])
      .mockResolvedValueOnce([{ document_type: 'PASSPORT' }, { document_type: 'SELFIE' }])
      .mockResolvedValueOnce([{ id: 'case-1', member_id: 'member-1', status: 'SUBMITTED', version: 2 }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw })),
    } as any;
    const service = new KycMemberCommandService(prisma, {} as any);

    const result = await service.submit('member-1');

    expect(result.item.status).toBe('SUBMITTED');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(3);
  });

  it('does not update a draft that lacks a selfie', async () => {
    const queryRaw = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'case-1', status: 'DRAFT', version: 1 }])
      .mockResolvedValueOnce([{ document_type: 'PASSPORT' }]);
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ $queryRaw: queryRaw })),
    } as any;
    const service = new KycMemberCommandService(prisma, {} as any);

    await expect(service.submit('member-1')).rejects.toThrow('Identity document and selfie are required');
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });
});
