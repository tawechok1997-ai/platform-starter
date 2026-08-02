import { GAME_CATALOG, type SimulatorGameCatalogItem } from '../provider-simulator/provider-simulator-catalog';
import { catalogForPlatform } from './member-game-catalog.service';

describe('member mobile game catalog projection', () => {
  it('exposes fishing, card, and the complete slot provider inventory on mobile', () => {
    const mobileCatalog = catalogForPlatform(GAME_CATALOG, 'mobile');
    const fishingProviders = providersFor(mobileCatalog, 'fishing');
    const cardProviders = providersFor(mobileCatalog, 'card');
    const slotProviders = providersFor(mobileCatalog, 'slot');

    expect(mobileCatalog.every((game) => game.platform === 'mobile' || game.platform === 'both')).toBe(true);
    expect(fishingProviders.size).toBeGreaterThan(0);
    expect(cardProviders.size).toBeGreaterThan(0);
    expect(slotProviders.size).toBeGreaterThan(20);
  });

  it('keeps a native mobile record instead of replacing it with the PC projection', () => {
    const catalog: readonly SimulatorGameCatalogItem[] = [
      game({ name: 'PC source', platform: 'pc' }),
      game({ name: 'Native Mobile', platform: 'mobile' }),
    ];

    const projected = catalogForPlatform(catalog, 'mobile');

    expect(projected).toHaveLength(1);
    expect(projected[0]).toMatchObject({
      name: 'Native Mobile',
      platform: 'mobile',
    });
  });
});

function providersFor(catalog: readonly SimulatorGameCatalogItem[], category: string) {
  return new Set(
    catalog
      .filter((game) => game.category === category)
      .map((game) => game.provider),
  );
}

function game(overrides: Partial<SimulatorGameCatalogItem>): SimulatorGameCatalogItem {
  return {
    code: 'same-game',
    name: 'Game',
    provider: 'same-provider',
    platform: 'pc',
    category: 'slot',
    accent: '#000000',
    symbol: 'G',
    ...overrides,
  };
}
