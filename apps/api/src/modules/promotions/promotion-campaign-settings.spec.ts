import { Prisma } from '@prisma/client';
import { PROMOTION_ASSET_CAMPAIGNS } from './promotion-asset-campaigns';
import {
  canonicalizePromotionCampaignMedia,
  loadPromotionCampaignSettings,
  mergePromotionCampaignSettings,
} from './promotion-campaign-settings';

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

  it('falls back to bundled campaigns when site_settings has not been migrated yet', async () => {
    const missingTableError = new Prisma.PrismaClientKnownRequestError(
      'The table public.site_settings does not exist in the current database.',
      {
        code: 'P2021',
        clientVersion: 'test',
        meta: { modelName: 'SiteSetting', table: 'public.site_settings' },
      },
    );
    const prisma = {
      siteSetting: {
        findUnique: jest.fn().mockRejectedValue(missingTableError),
        upsert: jest.fn(),
      },
    } as unknown as Parameters<typeof loadPromotionCampaignSettings>[0];

    const result = await loadPromotionCampaignSettings(prisma);

    expect(result).toHaveLength(PROMOTION_ASSET_CAMPAIGNS.length);
    expect(prisma.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it('rethrows database errors that are unrelated to the site_settings table', async () => {
    const databaseError = new Prisma.PrismaClientKnownRequestError(
      'Database query failed.',
      {
        code: 'P2022',
        clientVersion: 'test',
        meta: { modelName: 'SiteSetting', column: 'site_settings.unknown' },
      },
    );
    const prisma = {
      siteSetting: {
        findUnique: jest.fn().mockRejectedValue(databaseError),
        upsert: jest.fn(),
      },
    } as unknown as Parameters<typeof loadPromotionCampaignSettings>[0];

    await expect(loadPromotionCampaignSettings(prisma)).rejects.toBe(databaseError);
  });
});
