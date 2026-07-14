import { PromotionsService } from './promotions.service';

describe('PromotionsService compatibility facade', () => {
  it('delegates reads and mutations to focused services', async () => {
    const queries = {
      listPublicCampaigns: jest.fn().mockResolvedValue({ items: [] }),
      listMemberClaims: jest.fn().mockResolvedValue({ items: [] }),
      listAdminClaims: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      listMemberBonusLedgers: jest.fn().mockResolvedValue({ items: [] }),
      listAdminBonusLedgers: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as any;
    const claims = {
      createClaim: jest.fn().mockResolvedValue({ ok: true }),
      reviewClaim: jest.fn().mockResolvedValue({ ok: true }),
    } as any;
    const bonus = {
      addTurnoverProgress: jest.fn().mockResolvedValue({ ok: true }),
      updateBonusLifecycle: jest.fn().mockResolvedValue({ ok: true }),
    } as any;
    const service = new PromotionsService(queries, claims, bonus);
    const member = { id: 'member-1' };
    const admin = { id: 'admin-1' };

    await service.listMemberClaims(member);
    await service.listAdminBonusLedgers({ status: 'OPEN' });
    await service.createClaim(member, { campaignId: 'campaign-1' });
    await service.reviewClaim(admin, 'claim-1', { status: 'APPROVED' });
    await service.addTurnoverProgress(admin, 'bonus-1', { amount: 100 });
    await service.updateBonusLifecycle(admin, 'bonus-1', { action: 'RETRY', note: 'retry' });

    expect(queries.listMemberClaims).toHaveBeenCalledWith('member-1');
    expect(queries.listAdminBonusLedgers).toHaveBeenCalledWith('OPEN');
    expect(claims.createClaim).toHaveBeenCalledWith(member, { campaignId: 'campaign-1' });
    expect(claims.reviewClaim).toHaveBeenCalledWith(admin, 'claim-1', { status: 'APPROVED' });
    expect(bonus.addTurnoverProgress).toHaveBeenCalledWith(admin, 'bonus-1', { amount: 100 });
    expect(bonus.updateBonusLifecycle).toHaveBeenCalledWith(admin, 'bonus-1', { action: 'RETRY', note: 'retry' });
  });
});
