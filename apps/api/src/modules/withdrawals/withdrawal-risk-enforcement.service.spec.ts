import { NotFoundException } from '@nestjs/common';
import { WithdrawalRiskEnforcementService } from './withdrawal-risk-enforcement.service';

describe('WithdrawalRiskEnforcementService', () => {
  it('checks member, contact, and payout bank before approval', async () => {
    const prisma = {
      withdrawalRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'withdrawal-1',
          userId: 'member-1',
          accountNumber: '123-4-56789-0',
          user: { phone: '0812345678', email: 'member@example.com' },
        }),
      },
    };
    const risk = { enforce: jest.fn().mockResolvedValue({ matched: false, blocked: false, items: [] }) };
    const service = new WithdrawalRiskEnforcementService(prisma as any, risk as any);

    await service.enforceBeforeApproval('withdrawal-1', 'admin-1', 'reviewed by compliance');

    expect(risk.enforce).toHaveBeenCalledWith(expect.objectContaining({
      context: 'WITHDRAWAL_APPROVAL',
      memberId: 'member-1',
      referenceType: 'withdrawal_request',
      referenceId: 'withdrawal-1',
      actorId: 'admin-1',
      overrideReason: 'reviewed by compliance',
      subjects: expect.arrayContaining([
        { subjectType: 'MEMBER', subjectValue: 'member-1' },
        { subjectType: 'PHONE', subjectValue: '0812345678' },
        { subjectType: 'EMAIL', subjectValue: 'member@example.com' },
        { subjectType: 'BANK_ACCOUNT', subjectValue: '123-4-56789-0' },
      ]),
    }));
  });

  it('does not run risk enforcement for a missing withdrawal', async () => {
    const prisma = { withdrawalRequest: { findUnique: jest.fn().mockResolvedValue(null) } };
    const risk = { enforce: jest.fn() };
    const service = new WithdrawalRiskEnforcementService(prisma as any, risk as any);

    await expect(service.enforceBeforeApproval('missing', 'admin-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(risk.enforce).not.toHaveBeenCalled();
  });
});
