import { PROMOTION_ASSET_CAMPAIGNS } from './promotion-asset-campaigns';
import { canonicalizePromotionCampaignMedia, mergePromotionCampaignSettings } from './promotion-campaign-settings';

describe('promotion campaign settings runtime', () => {
  it('adds every asset campaign while preserving configured overrides', () => {
    const template = PROMOTION_ASSET_CAMPAIGNS[0]!;
    const result = mergePromotionCampaignSettings([{
      ...template,
      title: 'ชื่อที่แก้จาก Admin',
      imageUrl: '/custom/promotion.webp',
      desktopImageUrl: '/desktop/old.webp',
      mobileImageUrl: '/mobile/old.webp',
    }]);

    expect(result).toHaveLength(PROMOTION_ASSET_CAMPAIGNS.length);
    expect(result[0]).toMatchObject({
      id: template.id,
      title: 'ชื่อที่แก้จาก Admin',
      imageUrl: '/custom/promotion.webp',
      desktopImageUrl: '/custom/promotion.webp',
      mobileImageUrl: '/custom/promotion.webp',
    });
  });

  it('keeps custom campaigns after the bundled asset campaigns', () => {
    const custom = {
      ...PROMOTION_ASSET_CAMPAIGNS[0]!,
      id: 'custom-campaign',
      sourcePromotionId: 999999,
      title: 'Custom campaign',
    };
    const result = mergePromotionCampaignSettings([custom]);

    expect(result.some((item) => item.id === 'custom-campaign')).toBe(true);
    expect(result.length).toBe(PROMOTION_ASSET_CAMPAIGNS.length + 1);
  });

  it('uses one canonical image across desktop and mobile', () => {
    const campaign = canonicalizePromotionCampaignMedia({
      ...PROMOTION_ASSET_CAMPAIGNS[0]!,
      imageUrl: '',
      desktopImageUrl: '/desktop/promotion.webp',
      mobileImageUrl: '/mobile/promotion.webp',
    });

    expect(campaign.imageUrl).toBe('/desktop/promotion.webp');
    expect(campaign.desktopImageUrl).toBe('/desktop/promotion.webp');
    expect(campaign.mobileImageUrl).toBe('/desktop/promotion.webp');
  });
});
