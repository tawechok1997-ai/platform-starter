import { BadRequestException } from '@nestjs/common';
import { PromotionClaimCommandService } from './promotion-claim-command.service';

describe('PromotionClaimCommandService', () => {
  function setup() {
    const prisma: any = {
      siteSetting: { findUnique: jest.fn() },
      topUpRequest: { findFirst: jest.fn() },
      riskAlert: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      adminAuditLog: { create: jest.fn() },
    };
    const domain: any = {
      createClaim: jest.fn(),
      markClaimReviewed: jest.fn(),
      createBonusLedger: jest.fn(),
    };
    return { prisma, domain, service: new PromotionClaimCommandService(prisma, domain) };
  }

  const campaign = {
    id: 'campaign-1', title: 'Welcome', description: '', enabled: true,
    bonusType: 'percent', bonusValue: 10, minDeposit: 100, maxBonus: 500,
    turnoverMultiplier: 2, claimMode: 'manual_review',
  };

  it('rolls back the risk alert when domain claim creation fails', async () => {
    const { prisma, domain, service } = setup();
    prisma.siteSetting.findUnique.mockResolvedValue({ valueJson: [campaign] });
    prisma.riskAlert.findFirst.mockResolvedValue(null);
    prisma.riskAlert.create.mockResolvedValue({
      id: 'claim-1', memberId: 'member-1', refId: campaign.id, status: 'OPEN',
      metadata: { campaign, campaignId: campaign.id, depositAmount: 100 },
    });
    domain.createClaim.mockRejectedValue(new Error('domain failed'));
    prisma.riskAlert.delete.mockResolvedValue({});

    await expect(service.createClaim({ id: 'member-1' }, { campaignId: campaign.id, depositAmount: 100 }))
      .rejects.toThrow('domain failed');
    expect(prisma.riskAlert.delete).toHaveBeenCalledWith({ where: { id: 'claim-1' } });
  });

  it('rejects a duplicate open claim before creating another record', async () => {
    const { prisma, domain, service } = setup();
    prisma.siteSetting.findUnique.mockResolvedValue({ valueJson: [campaign] });
    prisma.riskAlert.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(service.createClaim({ id: 'member-1' }, { campaignId: campaign.id, depositAmount: 100 }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.riskAlert.create).not.toHaveBeenCalled();
    expect(domain.createClaim).not.toHaveBeenCalled();
  });

  it('requires an admin note when rejecting a claim', async () => {
    const { prisma, domain, service } = setup();
    prisma.riskAlert.findFirst.mockResolvedValue({
      id: 'claim-1', memberId: 'member-1', refId: campaign.id, status: 'OPEN',
      severity: 'LOW', metadata: { campaign, campaignId: campaign.id, depositAmount: 100, events: [] },
    });

    await expect(service.reviewClaim({ id: 'admin-1' }, 'claim-1', { status: 'REJECTED' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(domain.markClaimReviewed).not.toHaveBeenCalled();
    expect(prisma.riskAlert.update).not.toHaveBeenCalled();
  });

  it('approves a claim, reuses an existing bonus ledger, and writes shared audit data', async () => {
    const { prisma, domain, service } = setup();
    const claim = {
      id: 'claim-1', memberId: 'member-1', refId: campaign.id, status: 'OPEN', severity: 'LOW',
      metadata: { campaign, campaignId: campaign.id, depositAmount: 100, events: [] },
    };
    const updated = { ...claim, status: 'RESOLVED' };
    const ledger = {
      id: 'ledger-1', memberId: 'member-1', refId: claim.id, status: 'OPEN',
      metadata: { claimId: claim.id, campaignId: campaign.id, amount: 10, turnoverRequired: 20 },
    };
    prisma.riskAlert.findFirst.mockResolvedValueOnce(claim).mockResolvedValueOnce(ledger);
    prisma.riskAlert.update.mockResolvedValue(updated);
    prisma.adminAuditLog.create.mockResolvedValue({});

    const result = await service.reviewClaim({ id: 'admin-1' }, claim.id, { status: 'APPROVED', adminNote: 'ok' });

    expect(domain.markClaimReviewed).toHaveBeenCalledWith(expect.objectContaining({
      sourceRiskAlertId: claim.id,
      status: 'APPROVED',
      adminUserId: 'admin-1',
    }));
    expect(domain.createBonusLedger).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: 'admin-1',
        module: 'promotions',
        action: 'promotion.claim.review',
        targetId: claim.id,
      }),
    });
    expect(result.bonusLedger).toEqual(expect.objectContaining({ id: ledger.id }));
  });
});
