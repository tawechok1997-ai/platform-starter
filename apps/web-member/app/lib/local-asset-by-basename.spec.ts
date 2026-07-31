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
const auditSource = readFileSync(
  new URL('../../tools/audit-source-cdn-asset-basename-matches.mjs', import.meta.url),
  'utf8',
);
const sourceCatalog = readFileSync(
  new URL('../../tools/source-cdn-asset-catalog.json', import.meta.url),
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
    extractAssetBasename('https://cdn.zabbet.com/gamecard/1696220882369-08f56f11-f604-4f39-a75f-98e9d185447f.png'),
    '1696220882369-08f56f11-f604-4f39-a75f-98e9d185447f.png',
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
  const fileName = '1696220882369-08f56f11-f604-4f39-a75f-98e9d185447f.png';
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

test('records all supplied category CDN assets and audits them against local files', () => {
  const catalog = JSON.parse(sourceCatalog) as {
    counts?: { entries?: number; uniqueBasenames?: number };
    categories?: Record<string, string[]>;
  };
  const sourcePaths = Object.values(catalog.categories ?? {}).flat();
  const uniqueBasenames = new Set(sourcePaths.map((value) => value.split('/').pop()?.toLowerCase()));

  assert.equal(catalog.counts?.entries, 84);
  assert.equal(catalog.counts?.uniqueBasenames, 82);
  assert.equal(sourcePaths.length, 84);
  assert.equal(uniqueBasenames.size, 82);
  assert.equal(sourcePaths.includes('/providers/set/1_1_h/dg.png'), true);
  assert.equal(sourcePaths.includes('/providers/set/1_1_l/misoltfish.png'), true);
  assert.equal(sourcePaths.includes('/providers/set/1_1_l/lali.png'), true);
  assert.equal(sourcePaths.includes('/providers/set/1_1_h/lotmw.png'), true);
  assert.equal(sourcePaths.some((value) => value.startsWith('/gamecard/')), true);
  assert.match(auditSource, /status:\s*candidates\.length \? 'matched' : 'missing'/);
  assert.match(auditSource, /source-cdn-asset-match-report\.json/);
  assert.match(auditSource, /Catalog entry count drift/);
  assert.match(auditSource, /Catalog basename count drift/);
});

test('refreshes the generated asset map before development and verification commands', () => {
  const parsed = JSON.parse(packageJson) as { scripts?: Record<string, string> };
  const scripts = parsed.scripts ?? {};
  for (const hook of ['predev', 'prelint', 'pretest', 'pretypecheck']) {
    assert.equal(scripts[hook], 'pnpm generate:asset-basename-map');
  }
  for (const hook of ['preanalyze', 'prebuild']) {
    assert.equal(
      scripts[hook],
      'pnpm generate:asset-basename-map && pnpm audit:source-cdn-assets',
    );
  }
  assert.equal(scripts['audit:source-cdn-assets'], 'node tools/audit-source-cdn-asset-basename-matches.mjs');
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
