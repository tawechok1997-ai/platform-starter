import {
  mobileProviderArtworkCount,
  mobileProviderCardUrl,
} from './mobile-provider-artwork';

describe('Mobile provider artwork', () => {
  it('keeps the complete provider-only source inventory', () => {
    expect(mobileProviderArtworkCount()).toBe(76);
  });

  it('uses the exact source filenames supplied for Mobile provider cards', () => {
    expect(mobileProviderCardUrl('slot', 'hotdog')).toBe(
      'https://cdn.zabbet.com/providers/set/1_1_l/hotdog.png',
    );
    expect(mobileProviderCardUrl('fishing', 'misoltfish')).toBe(
      'https://cdn.zabbet.com/providers/set/1_1_l/misoltfish.png',
    );
    expect(mobileProviderCardUrl('card', 'amb')).toBe(
      'https://cdn.zabbet.com/providers/set/1_1_l/amb.png',
    );
    expect(mobileProviderCardUrl('sport', 'lali')).toBe(
      'https://cdn.zabbet.com/providers/set/1_1_l/lali.png',
    );
    expect(mobileProviderCardUrl('casino', 'sexyd')).toBe(
      'https://cdn.zabbet.com/providers/set/1_1_l/sexyd.png',
    );
  });

  it('normalizes source category aliases without guessing unknown categories', () => {
    expect(mobileProviderCardUrl('arcade', 'ygr')).toBe(
      'https://cdn.zabbet.com/providers/set/1_1_h/ygr.png',
    );
    expect(mobileProviderCardUrl('table', 'kingm.png')).toBe(
      'https://cdn.zabbet.com/providers/set/1_1_h/kingm.png',
    );
    expect(mobileProviderCardUrl('unknown', 'ygr')).toBe('');
    expect(mobileProviderCardUrl('slot', 'missing-provider')).toBe('');
  });
});
