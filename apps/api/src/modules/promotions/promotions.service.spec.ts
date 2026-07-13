import { BadRequestException } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

const bonusLedger = {
  id: 'bonus-1',
  refType: 'BONUS_LEDGER',
  refId: 'claim-1',
  memberId: 'member-1',
  status: 'OPEN',
  metadata: {
    claimId: 'claim-1',
    campaignId: 'welcome',
    amount: 100,
    currency: 'THB',
    turnoverRequired: 300,
    turnoverProgress: 250,
    turnoverCompleted: false,
    lifecycleStatus: 'ACTIVE',
    walletCreditEnabled: false,
    walletCreditStatus: 'BLOCKED_UNTIL_TURNOVER_GUARD',
    events: [],
  },
  createdAt: new Date('2026-07-13T00:00:00.000Z'),
  updatedAt: new Date('2026-07-13T00:00:00.000Z'),
  resolvedAt: null,
};

function createService(prisma: any) {
  return new PromotionsService(prisma);
}

describe('PromotionsService bonus lifecycle', () => {
  it('tracks turnover progress and marks ledger ready when requirement is met', async () => {
    const prisma = {
      riskAlert: {
        findFirst: jest.fn().mockResolvedValue(bonusLedger),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...bonusLedger, ...data })),
      },
      adminAuditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    const service = createService(prisma);

    const result = await service.addTurnoverProgress({ id: 'admin-1' }, 'bonus-1', { amount: 50, note: 'turnover check' });

    expect(prisma.riskAlert.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'bonus-1' },
      data: expect.objectContaining({ status: 'RESOLVED' }),
    }));
    expect(result.item.turnoverCompleted).toBe(true);
    expect(result.item.lifecycleStatus).toBe('TURNOVER_COMPLETED');
    expect(result.item.walletCreditEnabled).toBe(false);
    expect(result.item.walletCreditStatus).toBe('READY_FOR_MANUAL_RELEASE');
  });

  it('blocks release before turnover is completed', async () => {
    const prisma = {
      riskAlert: { findFirst: jest.fn().mockResolvedValue(bonusLedger) },
      adminAuditLog: { create: jest.fn() },
    };
    const service = createService(prisma);

    await expect(service.updateBonusLifecycle({ id: 'admin-1' }, 'bonus-1', { action: 'RELEASE' })).rejects.toThrow(BadRequestException);
  });
});
