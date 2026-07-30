import {
  assetUrl,
  buildSimulatorMediaContract,
  GAME_CATALOG,
  normalizeSimulatorPlatform,
  platformMatches,
} from './provider-simulator-catalog';

describe('provider simulator catalog contracts', () => {
  it('normalizes legacy pc platform to desktop', () => {
    expect(normalizeSimulatorPlatform('pc')).toBe('desktop');
    expect(normalizeSimulatorPlatform('mobile')).toBe('mobile');
    expect(normalizeSimulatorPlatform('both')).toBe('both');
  });

  it('matches both-platform games against mobile and desktop requests', () => {
    expect(platformMatches('both', 'mobile')).toBe(true);
    expect(platformMatches('both', 'desktop')).toBe(true);
    expect(platformMatches('mobile', 'desktop')).toBe(false);
    expect(platformMatches('pc', 'desktop')).toBe(true);
  });

  it('returns a generated placeholder media contract when no asset exists', () => {
    const media = buildSimulatorMediaContract({ code: 'missing', assetPath: undefined, providerLogoPath: undefined }, 'https://api.example.com/');
    expect(media).toEqual({
      imageUrl: 'https://api.example.com/provider-simulator/icons/missing.svg',
      iconUrl: 'https://api.example.com/provider-simulator/icons/missing.svg',
      fallbackIconUrl: 'https://api.example.com/provider-simulator/icons/missing.svg',
      providerLogoUrl: null,
      source: 'generated-placeholder',
      placeholder: true,
    });
  });

  it('preserves recovered source images while repository assets are still being localized', () => {
    const source = 'https://cdn.zabbet.com/games/example.png';
    expect(assetUrl(source, 'https://api.example.com')).toBe(source);
    expect(buildSimulatorMediaContract({ code: 'source', assetPath: source }, 'https://api.example.com').source).toBe('source-cdn');
  });

  it('restores the complete recovered lobby without duplicate provider codes', () => {
    const recoveredPcGames = GAME_CATALOG.filter((game) => game.platform === 'pc');
    const keys = recoveredPcGames.map((game) => `${game.provider}:${game.code}:${game.platform}`);
    expect(recoveredPcGames.length).toBeGreaterThanOrEqual(4_670);
    expect(new Set(keys).size).toBe(keys.length);
    expect(GAME_CATALOG.some((game) => game.category === 'fishing')).toBe(true);
    expect(GAME_CATALOG.some((game) => game.category === 'card')).toBe(true);
  });

  it('normalizes legacy provider filenames and damaged tag labels', () => {
    expect(GAME_CATALOG.some((game) => /\.(?:png|jpe?g|webp|svg)$/i.test(game.provider))).toBe(false);
    const tags = new Set(GAME_CATALOG.flatMap((game) => game.tags ?? []));
    expect(tags.has('เกมยล็อต')).toBe(false);
    expect(tags.has('เกมสใหม่')).toBe(false);
    expect(tags.has('ถวายสัตย์')).toBe(false);
    expect(tags.has('红黑大战')).toBe(false);
    expect(tags.has(' cod')).toBe(false);
    expect(tags.has('MASConstraint')).toBe(false);
    expect(tags.has('ยิงปลา')).toBe(false);
    expect(Array.from(tags)).toEqual(expect.arrayContaining(['เกมส์อาเขต', 'ซื้อฟรีสปิน', 'เกมส์ฮิต', 'เกมส์ใหม่', 'เกมส์สล็อต', 'เกมส์โต๊ะ']));
  });
});
