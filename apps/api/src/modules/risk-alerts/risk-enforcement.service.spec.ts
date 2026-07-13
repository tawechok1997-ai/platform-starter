import { BadRequestException } from '@nestjs/common';
import { RiskEnforcementService } from './risk-enforcement.service';

describe('RiskEnforcementService', () => {
  function createService(matchResult: any) {
    const prisma = {
      $executeRaw: jest.fn().mockResolvedValue(1),
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const watchlist = { match: jest.fn().mockResolvedValue(matchResult) };
    return { service: new RiskEnforcementService(prisma as any, watchlist as any), prisma, watchlist };
  }

  it('allows requests without watchlist matches', async () => {
    const { service, prisma } = createService({ matched: false, blocked: false, items: [] });
    await expect(service.enforce({ subjects: [{ subjectType: 'PHONE', subjectValue: '0812345678' }], context: 'REGISTER' }))
      .resolves.toEqual({ matched: false, blocked: false, items: [] });
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('creates a risk alert and blocks a blacklist match without override', async () => {
    const { service, prisma } = createService({
      matched: true,
      blocked: true,
      items: [{ id: 'entry-1', listType: 'BLACKLIST', reasonCode: 'FRAUD_CONFIRMED' }],
    });
    await expect(service.enforce({
      subjects: [{ subjectType: 'BANK_ACCOUNT', subjectValue: '1234567890' }],
      context: 'WITHDRAWAL_APPROVAL',
      memberId: '11111111-1111-4111-8111-111111111111',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('requires a meaningful reason and records an admin override', async () => {
    const { service, prisma } = createService({
      matched: true,
      blocked: true,
      items: [{ id: 'entry-1', listType: 'BLACKLIST', reasonCode: 'MANUAL_REVIEW' }],
    });
    await expect(service.enforce({
      subjects: [{ subjectType: 'MEMBER', subjectValue: 'member-1' }],
      context: 'BANK_APPROVAL',
      actorId: 'admin-1',
      overrideReason: 'verified by compliance team',
      referenceId: 'bank-1',
    })).resolves.toEqual(expect.objectContaining({ matched: true, blocked: true, overridden: true }));
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'OVERRIDE_BLACKLIST_MATCH', targetId: 'bank-1' }),
    }));
  });
});
