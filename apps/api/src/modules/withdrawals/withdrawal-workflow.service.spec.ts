import { ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';
import { WithdrawalWorkflowService } from './withdrawal-workflow.service';

describe('WithdrawalWorkflowService claim ownership', () => {
  const service = new WithdrawalWorkflowService({} as any, {} as any);

  it('rejects an unclaimed request', () => {
    expect(() => (service as any).assertClaimOwner(null, 'admin-1')).toThrow(ConflictException);
  });

  it('rejects a request claimed by another admin', () => {
    expect(() => (service as any).assertClaimOwner('admin-2', 'admin-1')).toThrow(ConflictException);
  });

  it('accepts the current claim owner', () => {
    expect(() => (service as any).assertClaimOwner('admin-1', 'admin-1')).not.toThrow();
  });
  it('removes uploaded proof when the workflow transaction fails', async () => {
    const storage = { put: jest.fn().mockResolvedValue(undefined), remove: jest.fn().mockResolvedValue(undefined) };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ status: 'APPROVED_FOR_PAYMENT', claimed_by: 'admin-1' }]),
      $executeRaw: jest.fn().mockRejectedValue(new Error('state changed')),
    };
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const service = new WithdrawalWorkflowService(prisma as any, storage as any);
    const data = Buffer.from('payment-proof').toString('base64');

    await expect(service.uploadPaymentProof('request-1', 'admin-1', {
      slipImageData: `data:image/png;base64,${data}`,
    })).rejects.toThrow('state changed');

    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(storage.remove).toHaveBeenCalledTimes(1);
  });

  it('returns idempotently when the same payment proof was already stored', async () => {
    const tx = { $queryRaw: jest.fn() };
    const storage = { put: jest.fn().mockResolvedValue(undefined), remove: jest.fn().mockResolvedValue(undefined) };
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    };
    const service = new WithdrawalWorkflowService(prisma as any, storage as any);
    const data = Buffer.from('payment-proof').toString('base64');
    const expectedHash = createHash('sha256').update(Buffer.from('payment-proof')).digest('hex');
    tx.$queryRaw.mockResolvedValueOnce([{ status: 'PAYMENT_PROOF_UPLOADED', claimed_by: 'admin-1' }])
      .mockResolvedValueOnce([{ payment_slip_url: 'withdrawal-proofs/existing.png', payment_slip_file_hash: expectedHash }]);

    const result = await service.uploadPaymentProof('request-1', 'admin-1', {
      slipImageData: `data:image/png;base64,${data}`,
    });

    expect(result).toEqual(expect.objectContaining({ idempotent: true, status: 'PAYMENT_PROOF_UPLOADED' }));
    expect(storage.remove).toHaveBeenCalledTimes(1);
  });
});
