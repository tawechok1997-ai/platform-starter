import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./member-game-catalog.service.ts', import.meta.url), 'utf8');

test('database catalog includes provider and media metadata for presentation resolution', () => {
  assert.match(source, /logoUrl:\s*true,[\s\S]*metadata:\s*true/);
  assert.match(source, /media:[\s\S]*take:\s*12/);
  assert.match(source, /normalizeDatabaseItem\(item, platform\)/);
});

test('game images follow platform override then shared fallback', () => {
  assert.match(source, /presentationUrl\(gamePresentation, 'image', requestedPlatform\)/);
  assert.match(source, /selectMedia\(item\.media, requestedPlatform\)/);
  assert.match(source, /mediaPlatform\(item\.metadata\) === platform/);
  assert.match(source, /shared\$\{capitalized\}Url/);
});

test('provider assets expose every surface from one central record', () => {
  for (const field of ['logoUrl', 'badgeUrl', 'cardUrl', 'backgroundUrl', 'titleUrl', 'avatarUrl']) {
    assert.match(source, new RegExp(`\\b${field}:`));
  }
  assert.match(source, /presentationUrl\(providerPresentation, 'card', requestedPlatform\)/);
  assert.match(source, /presentationUrl\(providerPresentation, 'background', requestedPlatform\)/);
  assert.match(source, /presentationUrl\(providerPresentation, 'title', requestedPlatform\)/);
  assert.match(source, /presentationUrl\(providerPresentation, 'avatar', requestedPlatform\)/);
});

test('generated catalog stays presentation-ready without replacing real flags', () => {
  assert.match(source, /isFeatured:\s*isPopular \|\| isNew/);
  assert.match(source, /const featured = allItems\.filter\(\(item\) => item\.isFeatured\)/);
  assert.match(source, /featured\.length > 0[\s\S]*allItems\.filter\(\(item\) => item\.isPopular \|\| item\.isNew\)/);
});
