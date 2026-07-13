import { ConflictException } from '@nestjs/common';
import { DepositWorkflowService } from './deposit-workflow.service';

describe('DepositWorkflowService claim ownership', () => {
  const service = new DepositWorkflowService({} as any, {} as any);

  it('rejects an unclaimed request', () => {
    expect(() => (service as any).assertClaimOwner(null, 'admin-1')).toThrow(ConflictException);
  });

  it('rejects a request claimed by another admin', () => {
    expect(() => (service as any).assertClaimOwner('admin-2', 'admin-1')).toThrow(ConflictException);
  });

  it('accepts the current claim owner', () => {
    expect(() => (service as any).assertClaimOwner('admin-1', 'admin-1')).not.toThrow();
  });
  it('removes uploaded slip when the state update fails', async () => {
    const storage = { put: jest.fn().mockResolvedValue(undefined), remove: jest.fn().mockResolvedValue(undefined) };
    const prisma = {
      topUpRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'request-1', userId: 'member-1', status: 'PENDING' }) },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRaw: jest.fn().mockRejectedValue(new Error('state changed')),
    };
    const service = new DepositWorkflowService(prisma as any, storage as any);
    const data = Buffer.from('slip').toString('base64');

    await expect(service.submitEvidence('request-1', 'member-1', {
      slipImageData: `data:image/png;base64,${data}`,
    })).rejects.toThrow('state changed');

    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(storage.remove).toHaveBeenCalledTimes(1);
  });


  it('does not expose private slip storage keys to members after upload', async () => {
    const storage = { put: jest.fn().mockResolvedValue(undefined), remove: jest.fn() };
    const prisma = {
      topUpRequest: { findFirst: jest.fn().mockResolvedValue({ id: 'request-1', userId: 'member-1', status: 'PENDING' }) },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const service = new DepositWorkflowService(prisma as any, storage as any);
    const data = Buffer.from('slip').toString('base64');

    const result = await service.submitEvidence('request-1', 'member-1', {
      slipImageData: `data:image/png;base64,${data}`,
    });

    expect(result).toEqual({ ok: true, duplicate: false, status: 'PENDING_SLIP_REVIEW' });
    expect(JSON.stringify(result)).not.toContain('slips/');
    expect(JSON.stringify(result)).not.toContain('fileHash');
  });

  it('returns idempotently when credit ledger already exists', async () => {
    const existing = { id: 'ledger-1' };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ status: 'COMPLETED', user_id: 'member-1', amount: { toString: () => '10.00' }, currency: 'THB', claimed_by: null }]),
      walletLedger: { findUnique: jest.fn().mockResolvedValue(existing) },
    };
    const prisma = { $transaction: jest.fn(async (callback: any) => callback(tx)) };
    const service = new DepositWorkflowService(prisma as any, {} as any);

    const result = await service.confirmCredit('request-1', 'admin-1', 'retry');

    expect(result).toEqual({ ok: true, status: 'COMPLETED', ledgerId: 'ledger-1', idempotent: true });
    expect(tx.walletLedger.findUnique).toHaveBeenCalledWith({ where: { idempotencyKey: 'topup:request-1:credit-confirmed' } });
  });
});
