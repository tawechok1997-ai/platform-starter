import { mapPromotionBonusLedger, mapPromotionClaim } from './promotion.mapper';

describe('promotion mapper', () => {
  it('maps approved claim status and numeric metadata', () => {
    const item = mapPromotionClaim({ id: 'claim-1', refId: 'campaign-1', status: 'RESOLVED', metadata: { depositAmount: '500', campaignId: 'campaign-1' } });
    expect(item.status).toBe('APPROVED');
    expect(item.depositAmount).toBe(500);
  });

  it('prioritizes settled lifecycle over risk alert status', () => {
    const item = mapPromotionBonusLedger({ id: 'bonus-1', refId: 'claim-1', status: 'OPEN', metadata: { lifecycleStatus: 'SETTLED', amount: '100' } });
    expect(item.status).toBe('SETTLED');
    expect(item.amount).toBe(100);
  });

  it('does not expose storage or internal hash fields from metadata', () => {
    const item = mapPromotionClaim({ id: 'claim-1', status: 'OPEN', metadata: { campaignId: 'campaign-1', storageKey: 'private/key', subjectHash: 'secret' } }) as Record<string, unknown>;
    expect(item.storageKey).toBeUndefined();
    expect(item.subjectHash).toBeUndefined();
  });
});
