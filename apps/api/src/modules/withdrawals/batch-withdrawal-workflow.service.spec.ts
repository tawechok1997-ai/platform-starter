import { BatchWithdrawalWorkflowService } from './batch-withdrawal-workflow.service';

describe('BatchWithdrawalWorkflowService', () => {
  it('requires step-up, reports partial failures, and audits the batch', async () => {
    const auth = { assertStepUp: jest.fn().mockResolvedValue({}) };
    const withdrawals = { approveRequest: jest.fn().mockResolvedValueOnce({ status: 'APPROVED_FOR_PAYMENT' }).mockRejectedValueOnce(new Error('state changed')), rejectRequest: jest.fn() };
    const workflow = { verifyAndComplete: jest.fn() };
    const prisma = { adminAuditLog: { create: jest.fn().mockResolvedValue({}) } };
    const service = new BatchWithdrawalWorkflowService(auth as never, withdrawals as never, workflow as never, prisma as never);
    const result = await service.execute('admin', 'APPROVE', ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'], 'approved after review', '123456');
    expect(result.summary).toEqual({ requested: 2, succeeded: 1, failed: 1 });
    expect(auth.assertStepUp).toHaveBeenCalledWith('admin', '123456', {});
    expect(prisma.adminAuditLog.create).toHaveBeenCalled();
  });
});
