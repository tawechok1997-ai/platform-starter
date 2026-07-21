import { buildSimulatorMediaContract, normalizeSimulatorPlatform, platformMatches } from './provider-simulator-catalog';

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
});
