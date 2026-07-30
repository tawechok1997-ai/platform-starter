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
    expect(tags.has(' a')).toBe(false);
    expect(tags.has('b')).toBe(false);
    expect(tags.has('c')).toBe(false);
    expect(tags.has('d')).toBe(false);
    expect(tags.has('e')).toBe(false);
    expect(tags.has('f')).toBe(false);
    expect(tags.has('g')).toBe(false);
    expect(tags.has('h')).toBe(false);
    expect(tags.has('i')).toBe(false);
    expect(tags.has('j')).toBe(false);
    expect(tags.has('k')).toBe(false);
    expect(tags.has('l')).toBe(false);
    expect(tags.has('m')).toBe(false);
    expect(tags.has('n')).toBe(false);
    expect(tags.has('o')).toBe(false);
    expect(tags.has('p')).toBe(false);
    expect(tags.has('q')).toBe(false);
    expect(tags.has('r')).toBe(false);
    expect(tags.has('s')).toBe(false);
    expect(tags.has('t')).toBe(false);
    expect(tags.has('u')).toBe(false);
    expect(tags.has('v')).toBe(false);
    expect(tags.has('w')).toBe(false);
    expect(tags.has('x')).toBe(false);
    expect(tags.has('y')).toBe(false);
    expect(tags.has('z')).toBe(false);
    expect(tags.has('彩票娱乐')).toBe(false);
    expect(tags.has('捕鱼')).toBe(false);
    expect(tags.has('彩票代理')).toBe(false);
    expect(tags.has('捕鱼达人')).toBe(false);
    expect(tags.has('สล็อตออนไลน์')).toBe(false);
    expect(tags.has('เกมสล็อตออนไลน์')).toBe(false);
    expect(tags.has('คาสิโนออนไลน์')).toBe(false);
    expect(tags.has('บาคาร่าออนไลน์')).toBe(false);
    expect(tags.has('แทงบอล')).toBe(false);
    expect(tags.has('หวยออนไลน์')).toBe(false);
    expect(tags.has('สล็อตออนไลน์เว็บตรง')).toBe(false);
    expect(tags.has('跑狗图')).toBe(false);
    expect(tags.has('สล็อตออนไลน์แตกง่าย')).toBe(false);
    expect(tags.has('เว็บตรง')).toBe(false);
    expect(tags.has('เครดิตฟรี')).toBe(false);
    expect(tags.has('ฝากถอนออโต้')).toBe(false);
    expect(tags.has('สล็อตออนไลน์เครดิตฟรี')).toBe(false);
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
