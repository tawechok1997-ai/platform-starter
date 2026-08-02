import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'member-game-catalog.service.ts'), 'utf8');

describe('member game catalog presentation contract', () => {
  it('includes provider and media metadata for presentation resolution', () => {
    expect(source).toMatch(/logoUrl:\s*true,[\s\S]*metadata:\s*true/);
    expect(source).toMatch(/media:[\s\S]*take:\s*12/);
    expect(source).toMatch(/normalizeDatabaseItem\(item, platform\)/);
  });

  it('follows platform override then shared fallback for game images', () => {
    expect(source).toMatch(/presentationUrl\(gamePresentation, 'image', requestedPlatform\)/);
    expect(source).toMatch(/selectMedia\(item\.media, requestedPlatform\)/);
    expect(source).toMatch(/mediaPlatform\(item\.metadata\) === platform/);
    expect(source).toMatch(/shared\$\{capitalized\}Url/);
  });

  it('exposes every provider surface from one central record', () => {
    for (const field of ['logoUrl', 'badgeUrl', 'cardUrl', 'backgroundUrl', 'titleUrl', 'avatarUrl']) {
      expect(source).toMatch(new RegExp(`\\b${field}:`));
    }
    expect(source).toMatch(/presentationUrl\(providerPresentation, 'card', requestedPlatform\)/);
    expect(source).toMatch(/presentationUrl\(providerPresentation, 'background', requestedPlatform\)/);
    expect(source).toMatch(/presentationUrl\(providerPresentation, 'title', requestedPlatform\)/);
    expect(source).toMatch(/presentationUrl\(providerPresentation, 'avatar', requestedPlatform\)/);
  });

  it('keeps the generated catalog presentation-ready without replacing real flags', () => {
    expect(source).toMatch(/isFeatured:\s*isPopular \|\| isNew/);
    expect(source).toMatch(/const featured = allItems\.filter\(\(item\) => item\.isFeatured\)/);
    expect(source).toMatch(/featured\.length > 0[\s\S]*allItems\.filter\(\(item\) => item\.isPopular \|\| item\.isNew\)/);
  });
});
