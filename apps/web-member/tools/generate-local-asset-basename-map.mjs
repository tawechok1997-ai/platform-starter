import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(toolDirectory, '..');
const publicRoot = path.join(packageRoot, 'public');
const assetRoot = path.join(publicRoot, 'assets');
const outputPath = path.join(packageRoot, 'app', 'generated', 'local-asset-basename-map.ts');

const SUPPORTED_EXTENSIONS = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.png',
  '.svg',
  '.webm',
  '.webp',
]);

const GENERIC_IDENTITY_SEGMENTS = new Set([
  'asset',
  'assets',
  'asset-pc',
  'asset-mobile',
  'asset-moblie',
  'images',
  'image',
  'games',
  'game',
  'gamecard',
  'providers',
  'provider',
  'set',
  'cdn-zabbet-com',
  'www',
  'public',
  'catalog',
  'mobile',
  'pc',
  'desktop',
  'shared',
  'icon',
  'icons',
  'badge',
  'badges',
  'card',
  'cards',
  'logo',
  'logos',
  'background',
  'backgrounds',
  'bg',
  'title',
  'titles',
  'avatar',
  'avatars',
]);

async function walk(directory, baseDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(absolute, baseDirectory));
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) continue;
    files.push(path.relative(baseDirectory, absolute).replaceAll('\\', '/'));
  }
  return files;
}

function candidateRank(value) {
  const normalized = value.toLowerCase().replace(/^\/+/, '');
  if (normalized.startsWith('asset-pc/') || normalized.includes('/asset-pc/')) return 0;
  if (
    normalized.startsWith('asset-mobile/')
    || normalized.includes('/asset-mobile/')
    || normalized.startsWith('asset-moblie/')
    || normalized.includes('/asset-moblie/')
  ) return 1;
  if (normalized.startsWith('reference-brand/') || normalized.includes('/reference-brand/')) return 2;
  return 3;
}

function assetPlatform(value) {
  const normalized = value.toLowerCase().replace(/^\/+/, '');
  if (normalized.startsWith('asset-pc/') || normalized.includes('/asset-pc/')) return 'pc';
  if (
    normalized.startsWith('asset-mobile/')
    || normalized.includes('/asset-mobile/')
    || normalized.startsWith('asset-moblie/')
    || normalized.includes('/asset-moblie/')
  ) return 'mobile';
  return 'other';
}

function decodeSegment(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeIdentity(value) {
  const decoded = decodeSegment(String(value ?? '').trim());
  const withoutExtension = decoded.replace(/\.(?:avif|gif|ico|jpe?g|png|svg|webm|webp)$/i, '');
  return withoutExtension
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizedSegments(relative) {
  return relative
    .split('/')
    .filter(Boolean)
    .map((segment) => ({ raw: segment, identity: normalizeIdentity(segment) }));
}

function usefulIdentity(value) {
  return Boolean(
    value
    && !GENERIC_IDENTITY_SEGMENTS.has(value)
    && !/^1-1-(?:v|h|l|bg|title|avatar|badge)$/i.test(value)
  );
}

function addCandidate(map, key, publicUrl) {
  if (!key) return;
  const candidates = map.get(key) ?? [];
  candidates.push(publicUrl);
  map.set(key, candidates);
}

function inferProviderArtworkKind(relative) {
  const normalized = `/${relative.toLowerCase().replaceAll('\\', '/')}/`;
  if (/\/(?:1_1_badge|badge|badges)\//.test(normalized)) return 'badge';
  if (/\/(?:icon|icons)\//.test(normalized)) return 'icon';
  if (/\/(?:1_1_avatar|avatar|avatars)\//.test(normalized)) return 'avatar';
  if (/\/(?:1_1_bg|bg|background|backgrounds)\//.test(normalized)) return 'background';
  if (/\/(?:1_1_title|title|titles)\//.test(normalized)) return 'title';
  if (/\/(?:1_1_v|1_1_h|1_1_l|card|cards)\//.test(normalized)) return 'card';
  return 'logo';
}

function indexProviderAsset(map, relative, publicUrl, platform) {
  const segments = normalizedSegments(relative);
  const providerIndex = segments.findIndex((segment) => segment.identity === 'providers');
  if (providerIndex < 0) return false;

  const fileIdentity = normalizeIdentity(path.posix.basename(relative));
  const providerIdentities = new Set();
  if (usefulIdentity(fileIdentity)) providerIdentities.add(fileIdentity);

  for (const segment of segments.slice(providerIndex + 1, -1)) {
    if (usefulIdentity(segment.identity)) providerIdentities.add(segment.identity);
  }

  if (providerIdentities.size === 0) return false;
  const kind = inferProviderArtworkKind(relative);
  for (const providerIdentity of providerIdentities) {
    addCandidate(map, `${platform}|${providerIdentity}|${kind}`, publicUrl);
    addCandidate(map, `${platform}|${providerIdentity}|any`, publicUrl);
  }
  return true;
}

function gameMarkerIndex(segments) {
  for (let index = segments.length - 2; index >= 0; index -= 1) {
    if (segments[index].identity === 'games' || segments[index].identity === 'gamecard') return index;
  }

  for (let index = segments.length - 3; index >= 0; index -= 1) {
    if (segments[index].identity === 'game') return index;
  }
  return -1;
}

function indexGameAsset(map, relative, publicUrl, platform) {
  const segments = normalizedSegments(relative);
  const markerIndex = gameMarkerIndex(segments);
  if (markerIndex < 0) return false;

  const gameIdentity = normalizeIdentity(path.posix.basename(relative));
  if (!gameIdentity || /^(?:bg|background|logo|title)(?:-|$)/.test(gameIdentity)) return false;

  const providerIdentities = new Set(['*']);
  for (const segment of segments.slice(markerIndex + 1, -1)) {
    if (usefulIdentity(segment.identity)) providerIdentities.add(segment.identity);
  }

  for (const providerIdentity of providerIdentities) {
    addCandidate(map, `${platform}|${providerIdentity}|${gameIdentity}`, publicUrl);
  }
  return true;
}

function serializeMap(name, map) {
  const entries = [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([identity, candidates]) => {
      const sorted = [...new Set(candidates)].sort((left, right) => {
        const rankDifference = candidateRank(left) - candidateRank(right);
        return rankDifference || left.localeCompare(right);
      });
      return `  ${JSON.stringify(identity)}: ${JSON.stringify(sorted)},`;
    });

  return [
    `export const ${name}: Readonly<Record<string, readonly string[]>> = {`,
    ...entries,
    '};',
    '',
  ];
}

function serialize(basenameMap, providerMap, gameMap) {
  return [
    '/* This file is generated by tools/generate-local-asset-basename-map.mjs. */',
    '/* Do not edit it by hand. Provider/game identity maps are authoritative; basename is final fallback only. */',
    '',
    ...serializeMap('LOCAL_ASSET_PATHS_BY_BASENAME', basenameMap),
    ...serializeMap('LOCAL_PROVIDER_ASSET_PATHS_BY_IDENTITY', providerMap),
    ...serializeMap('LOCAL_GAME_ASSET_PATHS_BY_IDENTITY', gameMap),
  ].join('\n');
}

const files = await walk(assetRoot);
const byBasename = new Map();
const providersByIdentity = new Map();
const gamesByIdentity = new Map();
const platformCounts = { pc: 0, mobile: 0, other: 0 };
let indexedAssetCount = 0;
let providerAssetCount = 0;
let gameAssetCount = 0;

for (const relative of files) {
  const basename = path.posix.basename(relative).toLowerCase();
  const publicUrl = `/${path.posix.join('assets', relative)}`;
  const candidates = byBasename.get(basename) ?? [];
  candidates.push(publicUrl);
  byBasename.set(basename, candidates);

  const platform = assetPlatform(relative);
  if (indexProviderAsset(providersByIdentity, relative, publicUrl, platform)) providerAssetCount += 1;
  else if (indexGameAsset(gamesByIdentity, relative, publicUrl, platform)) gameAssetCount += 1;

  platformCounts[platform] += 1;
  indexedAssetCount += 1;
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, serialize(byBasename, providersByIdentity, gamesByIdentity), 'utf8');

const duplicateBasenames = [...byBasename.values()].filter((candidates) => candidates.length > 1).length;
console.log(
  `Generated ${path.relative(packageRoot, outputPath).replaceAll('\\', '/')} from ${indexedAssetCount} local assets (${platformCounts.pc} PC, ${platformCounts.mobile} Mobile, ${platformCounts.other} other; ${byBasename.size} basenames, ${duplicateBasenames} duplicated basenames; ${providerAssetCount} provider assets / ${providersByIdentity.size} identities; ${gameAssetCount} game assets / ${gamesByIdentity.size} identities).`,
);
