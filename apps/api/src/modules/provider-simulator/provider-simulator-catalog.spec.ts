import {
  assetUrl,
  buildSimulatorMediaContract,
  GAME_CATALOG,
  normalizeSimulatorPlatform,
  platformMatches,
} from './provider-simulator-catalog';

describe('provider simulator catalog contracts', () => {
  it('normalizes platforms', () => {
    expect(normalizeSimulatorPlatform('pc')).toBe('desktop');
    expect(platformMatches('both', 'mobile')).toBe(true);
    expect(platformMatches('mobile', 'desktop')).toBe(false);
  });

  it('uses a placeholder when media is absent', () => {
    expect(buildSimulatorMediaContract({ code: 'missing' }, 'https://api.example.com/')).toEqual({
      imageUrl: 'https://api.example.com/provider-simulator/icons/missing.svg',
      iconUrl: 'https://api.example.com/provider-simulator/icons/missing.svg',
      fallbackIconUrl: 'https://api.example.com/provider-simulator/icons/missing.svg',
      providerLogoUrl: null,
      source: 'generated-placeholder',
      placeholder: true,
    });
  });

  it('preserves recovered source media', () => {
    const source = 'https://cdn.zabbet.com/games/example.png';
    expect(assetUrl(source, 'https://api.example.com')).toBe(source);
    expect(buildSimulatorMediaContract({ code: 'source', assetPath: source }, 'https://api.example.com').source).toBe('source-cdn');
  });

  it('restores the recovered PC catalog without duplicate keys', () => {
    const pcGames = GAME_CATALOG.filter((game) => game.platform === 'pc');
    const keys = pcGames.map((game) => `${game.provider}:${game.code}:${game.platform}`);
    expect(pcGames.length).toBeGreaterThanOrEqual(4_670);
    expect(new Set(keys).size).toBe(keys.length);
    expect(GAME_CATALOG.some((game) => game.category === 'fishing')).toBe(true);
    expect(GAME_CATALOG.some((game) => game.category === 'card')).toBe(true);
  });

  it('normalizes provider filenames and legacy tags', () => {
    expect(GAME_CATALOG.some((game) => /\.(?:png|jpe?g|webp|svg)$/i.test(game.provider))).toBe(false);
    const tags = new Set(GAME_CATALOG.flatMap((game) => game.tags ?? []));
    expect(tags.has('เกมยล็อต')).toBe(false);
    expect(tags.has('เกมสใหม่')).toBe(false);
    expect(tags.has('红黑大战')).toBe(false);
    expect(tags.has('自产拍')).toBe(false);
    expect(tags.has('ยิงปลา')).toBe(false);
    expect(Array.from(tags)).toEqual(expect.arrayContaining([
      'เกมส์อาเขต',
      'ซื้อฟรีสปิน',
      'เกมส์ฮิต',
      'เกมส์ใหม่',
      'เกมส์สล็อต',
      'เกมส์โต๊ะ',
    ]));
  });
});
