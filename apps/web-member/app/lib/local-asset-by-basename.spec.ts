import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { LOCAL_ASSET_PATHS_BY_BASENAME } from '../generated/local-asset-basename-map';
import { extractAssetBasename, resolveLocalAssetByBasename } from './local-asset-by-basename';

const packageJson = readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
const generatorSource = readFileSync(
  new URL('../../tools/generate-local-asset-basename-map.mjs', import.meta.url),
  'utf8',
);
const homeResolverSource = readFileSync(
  new URL('../components/member-home/local-game-asset-resolver.ts', import.meta.url),
  'utf8',
);

const mutableAssetIndex = LOCAL_ASSET_PATHS_BY_BASENAME as Record<string, readonly string[]>;

function withAssetCandidates(fileName: string, candidates: readonly string[], run: () => void) {
  const key = fileName.toLowerCase();
  const previous = mutableAssetIndex[key];
  mutableAssetIndex[key] = candidates;
  try {
    run();
  } finally {
    if (previous) mutableAssetIndex[key] = previous;
    else delete mutableAssetIndex[key];
  }
}

test('extracts the final CDN filename from provider and gamecard URLs', () => {
  assert.equal(
    extractAssetBasename('https://cdn.zabbet.com/providers/set/1_1_h/dg.png?version=2'),
    'dg.png',
  );
  assert.equal(
    extractAssetBasename('https://cdn.zabbet.com/gamecard/af857d02-fde9-475e-bebb-94d19c9d5f52.png'),
    'af857d02-fde9-475e-bebb-94d19c9d5f52.png',
  );
});

test('matches a CDN provider filename to the closest local asset path', () => {
  withAssetCandidates('dg.png', [
    '/assets/asset-mobile/images/providers/set/1_1_h/dg.png',
    '/assets/asset-pc/images/providers/set/1_1_badge/dg.png',
    '/assets/asset-pc/images/providers/set/1_1_h/dg.png',
  ], () => {
    assert.equal(
      resolveLocalAssetByBasename('https://cdn.zabbet.com/providers/set/1_1_h/dg.png'),
      '/assets/asset-pc/images/providers/set/1_1_h/dg.png',
    );
  });
});

test('matches UUID gamecard filenames without relying on provider names', () => {
  const fileName = 'af857d02-fde9-475e-bebb-94d19c9d5f52.png';
  withAssetCandidates(fileName, [
    `/assets/asset-pc/images/gamecard/${fileName}`,
  ], () => {
    assert.equal(
      resolveLocalAssetByBasename(`https://cdn.zabbet.com/gamecard/${fileName}`),
      `/assets/asset-pc/images/gamecard/${fileName}`,
    );
  });
});

test('prefers PC or Mobile assets deterministically when the basename is duplicated', () => {
  withAssetCandidates('amb.png', [
    '/assets/asset-mobile/images/providers/set/1_1_h/amb.png',
    '/assets/asset-pc/images/providers/set/1_1_h/amb.png',
  ], () => {
    const source = 'https://cdn.zabbet.com/providers/amb.png';
    assert.equal(
      resolveLocalAssetByBasename(source, 'pc'),
      '/assets/asset-pc/images/providers/set/1_1_h/amb.png',
    );
    assert.equal(
      resolveLocalAssetByBasename(source, 'mobile'),
      '/assets/asset-mobile/images/providers/set/1_1_h/amb.png',
    );
  });
});

test('generates a case-insensitive basename index by scanning all public assets recursively', () => {
  assert.match(generatorSource, /async function walk\(/);
  assert.match(generatorSource, /path\.posix\.basename\(relative\)\.toLowerCase\(\)/);
  assert.match(generatorSource, /SUPPORTED_EXTENSIONS/);
  assert.match(generatorSource, /asset-mobile/);
  assert.match(generatorSource, /asset-moblie/);
});

test('refreshes the generated asset map before development and verification commands', () => {
  const parsed = JSON.parse(packageJson) as { scripts?: Record<string, string> };
  const scripts = parsed.scripts ?? {};
  for (const hook of ['predev', 'prebuild', 'prelint', 'pretest', 'pretypecheck']) {
    assert.equal(scripts[hook], 'pnpm generate:asset-basename-map');
  }
});

test('game and provider media try basename matching before external fallbacks', () => {
  assert.match(homeResolverSource, /resolveLocalAssetByBasename\(source\)/);
  assert.match(homeResolverSource, /resolveLocalAssetByBasename\(provider\.logoUrl\)/);
  assert.equal(
    homeResolverSource.indexOf('resolveLocalAssetByBasename(source)')
      < homeResolverSource.indexOf("resolveMirroredAsset(source, 'games')"),
    true,
  );
});
