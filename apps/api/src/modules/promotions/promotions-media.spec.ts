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
        upsert: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new PromotionsQueryService(prisma);
    const result = await service.listPublicCampaigns();
    const welcome = result.items.find((item) => item.id === 'welcome');

    expect(welcome).toEqual(expect.objectContaining({
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
        upsert: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new PromotionsQueryService(prisma);
    const result = await service.listPublicCampaigns();
    const legacy = result.items.find((item) => item.id === 'legacy');

    expect(legacy).toEqual(expect.objectContaining({
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
        upsert: jest.fn().mockResolvedValue({}),
      },
    } as any;

    const service = new PromotionsQueryService(prisma);
    const ids = (await service.listPublicCampaigns()).items.map((item) => item.id);

    expect(ids).toEqual(expect.arrayContaining(['published-high', 'published-low']));
    expect(ids).not.toContain('draft');
    expect(ids).not.toContain('archived');
  });
});
