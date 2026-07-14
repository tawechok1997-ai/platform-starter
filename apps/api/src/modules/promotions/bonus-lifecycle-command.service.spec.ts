import { BadRequestException } from '@nestjs/common';
import { BonusLifecycleCommandService } from './bonus-lifecycle-command.service';

describe('BonusLifecycleCommandService', () => {
  const baseItem = {
    id: 'bonus-1',
    refType: 'BONUS_LEDGER',
    status: 'OPEN',
    resolvedAt: null,
    metadata: {
      claimId: 'claim-1',
      campaignId: 'campaign-1',
      amount: 100,
      currency: 'THB',
      turnoverRequired: 500,
      turnoverProgress: 100,
      turnoverCompleted: false,
      lifecycleStatus: 'ACTIVE',
      walletCreditStatus: 'BLOCKED',
      events: [],
    },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  it('writes turnover mutation and audit in one transaction', async () => {
    const tx = {
      riskAlert: { update: jest.fn().mockResolvedValue({ ...baseItem, status: 'RESOLVED', metadata: { ...baseItem.metadata, turnoverProgress: 500, turnoverCompleted: true, lifecycleStatus: 'TURNOVER_COMPLETED' } }) },
      adminAuditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      riskAlert: { findFirst: jest.fn().mockResolvedValue(baseItem) },
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const domain = {
      addTurnover: jest.fn().mockResolvedValue({ turnover_progress: 500, turnover_required: 500, status: 'TURNOVER_COMPLETED' }),
    };
    const settlementCommands = { execute: jest.fn() };
    const service = new BonusLifecycleCommandService(prisma as never, domain as never, settlementCommands as never);

    const result = await service.addTurnoverProgress({ id: 'admin-1' }, 'bonus-1', { amount: 400 });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.riskAlert.update).toHaveBeenCalledTimes(1);
    expect(tx.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        adminUser: { connect: { id: 'admin-1' } },
        module: 'promotions',
        action: 'bonus.turnover.progress',
        targetId: 'bonus-1',
      }),
    }));
    expect(result.item.turnoverCompleted).toBe(true);
  });

  it('delegates release settlement to the settlement command service', async () => {
    const prisma = { riskAlert: { findFirst: jest.fn().mockResolvedValue(baseItem) } };
    const domain = { updateLifecycle: jest.fn() };
    const settlementCommands = { execute: jest.fn().mockRejectedValue(new BadRequestException('turnover incomplete')) };
    const service = new BonusLifecycleCommandService(prisma as never, domain as never, settlementCommands as never);

    await expect(service.updateBonusLifecycle({ id: 'admin-1' }, 'bonus-1', { action: 'RELEASE' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(settlementCommands.execute).toHaveBeenCalledWith({ id: 'admin-1' }, 'bonus-1', 'RELEASE', undefined);
    expect(domain.updateLifecycle).not.toHaveBeenCalled();
  });

  it('requires a note when revoking a bonus', async () => {
    const prisma = { riskAlert: { findFirst: jest.fn().mockResolvedValue(baseItem) } };
    const domain = { updateLifecycle: jest.fn() };
    const settlementCommands = { execute: jest.fn() };
    const service = new BonusLifecycleCommandService(prisma as never, domain as never, settlementCommands as never);

    await expect(service.updateBonusLifecycle({ id: 'admin-1' }, 'bonus-1', { action: 'REVOKE', note: '  ' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(domain.updateLifecycle).not.toHaveBeenCalled();
  });
});
