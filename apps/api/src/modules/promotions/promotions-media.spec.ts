import { PromotionsQueryService } from './promotions-query.service';

describe('promotion media contract', () => {
  it('returns responsive promotion media and legacy imageUrl', async () => {
    const prisma = {
      siteSetting: {
        findUnique: jest.fn().mockResolvedValue({
          valueJson: [{
            id: 'welcome',
            title: 'Welcome',
            description: 'Welcome bonus',
            enabled: true,
            lifecycle: 'published',
            imageUrl: '/legacy.jpg',
            desktopImageUrl: '/desktop.jpg',
            mobileImageUrl: '/mobile.jpg',
            desktopAssetId: 'asset-desktop',
            mobileAssetId: 'asset-mobile',
            iconUrl: '/icon.png',
            href: '/promotions/welcome',
            priority: 20,
          }],
        }),
      },
    } as any;

    const service = new PromotionsQueryService(prisma);
    const result = await service.listPublicCampaigns();

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(expect.objectContaining({
      imageUrl: '/legacy.jpg',
      desktopImageUrl: '/desktop.jpg',
      mobileImageUrl: '/mobile.jpg',
      desktopAssetId: 'asset-desktop',
      mobileAssetId: 'asset-mobile',
      iconUrl: '/icon.png',
      href: '/promotions/welcome',
      priority: 20,
    }));
  });

  it('falls back responsive variants to legacy imageUrl', async () => {
    const prisma = {
      siteSetting: {
        findUnique: jest.fn().mockResolvedValue({ valueJson: [{ id: 'legacy', title: 'Legacy', enabled: true, imageUrl: '/legacy.jpg' }] }),
      },
    } as any;

    const service = new PromotionsQueryService(prisma);
    const result = await service.listPublicCampaigns();

    expect(result.items[0]).toEqual(expect.objectContaining({
      imageUrl: '/legacy.jpg',
      desktopImageUrl: '/legacy.jpg',
      mobileImageUrl: '/legacy.jpg',
    }));
  });

  it('does not expose draft or archived campaigns even when enabled is malformed', async () => {
    const prisma = {
      siteSetting: {
        findUnique: jest.fn().mockResolvedValue({
          valueJson: [
            { id: 'draft', title: 'Draft', lifecycle: 'draft', enabled: true, priority: 100 },
            { id: 'archived', title: 'Archived', lifecycle: 'archived', enabled: true, priority: 90 },
            { id: 'published-low', title: 'Low', lifecycle: 'published', enabled: true, priority: 10 },
            { id: 'published-high', title: 'High', lifecycle: 'published', enabled: true, priority: 20 },
          ],
        }),
      },
    } as any;

    const service = new PromotionsQueryService(prisma);
    const result = await service.listPublicCampaigns();

    expect(result.items.map((item) => item.id)).toEqual(['published-high', 'published-low']);
  });
});
