import { BatchDepositWorkflowService } from './batch-deposit-workflow.service';

describe('BatchDepositWorkflowService', () => {
  it('requires step-up once, continues after row failures, and records the batch evidence', async () => {
    const auth = { assertStepUp: jest.fn().mockResolvedValue({ success: true }) };
    const workflow = {
      approveSlip: jest
        .fn()
        .mockResolvedValueOnce({ status: 'PENDING_CREDIT' })
        .mockRejectedValueOnce(new Error('request is claimed by another admin')),
      rejectDeposit: jest.fn(),
      confirmCredit: jest.fn(),
    };
    const prisma = { adminAuditLog: { create: jest.fn().mockResolvedValue({}) } };
    const service = new BatchDepositWorkflowService(auth as never, workflow as never, prisma as never);

    const result = await service.execute(
      'admin-1',
      'APPROVE_SLIP',
      ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'],
      'verified slip',
      '123456',
      { ipAddress: '127.0.0.1' },
    );

    expect(auth.assertStepUp).toHaveBeenCalledWith('admin-1', '123456', { ipAddress: '127.0.0.1' });
    expect(result.summary).toEqual({ requested: 2, succeeded: 1, failed: 1 });
    expect(result.results[1]).toEqual(
      expect.objectContaining({ ok: false, message: 'request is claimed by another admin' }),
    );
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'BATCH_DEPOSIT_WORKFLOW',
          newData: expect.objectContaining({ stepUpVerified: true }),
        }),
      }),
    );
  });
});
