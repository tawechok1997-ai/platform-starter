import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'asset', 'mobil');
const catalogRoot = path.join(root, 'asset', 'catalog', 'mobile');
const sourceManifestPath = path.join(sourceRoot, 'manifest.json');
const catalogManifestPath = path.join(catalogRoot, 'manifest.json');
const activeCatalogPath = path.join(catalogRoot, 'catalog.json');

const CATEGORY_RULES = [
  ['games', ['/games/', '/gamecard/', '/mini_game/']],
  ['providers', ['/providers/']],
  ['banners', ['/imageslides/', '/highlight/', '/slides/', '/banner/']],
  ['promotions', ['/promotions/', '/promotion/']],
  ['banks', ['/banks/']],
  ['footer', ['/footer/']],
  ['flags', ['/flags/']],
  ['tournament', ['/tournament/', '/predict/']],
  ['theme', ['/theme/', '/shortcut/']],
  ['ui', ['/images/', '/icons/', '/icon/', '/lobby_settings/']],
];

await mkdir(catalogRoot, { recursive: true });

const sourceManifest = await readJsonArray(sourceManifestPath);
const existingManifest = await readJsonArray(catalogManifestPath);
const activeCatalog = await readJsonObject(activeCatalogPath);
const activeItems = Array.isArray(activeCatalog?.items) ? activeCatalog.items : [];

const existingBySource = new Map(
  existingManifest
    .filter((item) => item && typeof item.sourceFile === 'string')
    .map((item) => [item.sourceFile, item]),
);
const occupiedTargets = new Set(
  existingManifest
    .filter((item) => item && typeof item.file === 'string')
    .map((item) => item.file),
);
for (const item of activeItems) {
  if (item && typeof item.file === 'string') occupiedTargets.add(item.file);
}

const migrated = [];
const missing = [];

for (const entry of sourceManifest) {
  if (!entry || typeof entry.file !== 'string') continue;
  const sourceRelative = normalize(entry.file);
  const sourceAbsolute = path.join(sourceRoot, ...sourceRelative.split('/'));
  if (!(await exists(sourceAbsolute))) {
    missing.push(sourceRelative);
    continue;
  }

  const sourceFile = `asset/mobil/${sourceRelative}`;
  const previous = existingBySource.get(sourceFile);
  if (previous?.file && await exists(path.join(catalogRoot, ...String(previous.file).split('/')))) {
    await rm(sourceAbsolute, { force: true });
    migrated.push(previous);
    continue;
  }

  const sha256 = await hashFile(sourceAbsolute);
  const category = classify(sourceRelative, entry.url);
  const targetRelative = await chooseTarget(category, sourceRelative, sha256, occupiedTargets);
  const targetAbsolute = path.join(catalogRoot, ...targetRelative.split('/'));
  await mkdir(path.dirname(targetAbsolute), { recursive: true });
  await rename(sourceAbsolute, targetAbsolute);
  occupiedTargets.add(targetRelative);

  const info = await stat(targetAbsolute);
  migrated.push({
    file: targetRelative,
    repositoryPath: `asset/catalog/mobile/${targetRelative}`,
    sourceFile,
    sourceUrl: typeof entry.url === 'string' ? entry.url : null,
    mimeType: typeof entry.mimeType === 'string' ? entry.mimeType : mimeFromExtension(targetRelative),
    status: Number(entry.status ?? 0),
    category,
    size: info.size,
    sha256,
  });
}

if (missing.length > 0) {
  throw new Error(`Manifest references missing files:\n${missing.map((item) => `- ${item}`).join('\n')}`);
}

const combined = [...existingManifest, ...migrated]
  .filter((item) => item && typeof item.file === 'string')
  .reduce((map, item) => map.set(item.file, item), new Map());
const normalizedManifest = [...combined.values()].sort((a, b) => String(a.file).localeCompare(String(b.file)));

await writeFile(catalogManifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  platform: 'mobile',
  sourceDirectoryRemoved: true,
  counts: summarize(normalizedManifest),
  items: normalizedManifest,
}, null, 2)}\n`);

if (await exists(sourceRoot)) await rm(sourceRoot, { recursive: true, force: true });
await removeEmptyDirectories(path.join(root, 'asset'));

console.log(`Migrated ${migrated.length} remaining mobile assets.`);
console.log(`Canonical mobile catalog now contains ${normalizedManifest.length} assets.`);
console.log('Removed asset/mobil after successful migration.');

function classify(file, url) {
  const value = `/${normalize(file).toLowerCase()} ${String(url ?? '').toLowerCase()}`;
  for (const [category, patterns] of CATEGORY_RULES) {
    if (patterns.some((pattern) => value.includes(pattern))) return category;
  }
  return 'misc';
}

async function chooseTarget(category, sourceRelative, sha256, occupied) {
  const parsed = path.posix.parse(normalize(sourceRelative));
  const host = slugify(sourceRelative.split('/')[0] || 'source');
  const parentParts = parsed.dir.split('/').slice(1).map(slugify).filter(Boolean).slice(-3);
  const base = `${slugify(parsed.name) || sha256.slice(0, 12)}${parsed.ext.toLowerCase()}`;
  let candidate = path.posix.join(category, host, ...parentParts, base);
  if (!occupied.has(candidate) && !(await exists(path.join(catalogRoot, ...candidate.split('/'))))) return candidate;
  candidate = path.posix.join(category, host, ...parentParts, `${slugify(parsed.name) || 'asset'}-${sha256.slice(0, 10)}${parsed.ext.toLowerCase()}`);
  return candidate;
}

function summarize(items) {
  const counts = { total: items.length };
  for (const item of items) counts[item.category ?? 'misc'] = (counts[item.category ?? 'misc'] ?? 0) + 1;
  return counts;
}

function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function normalize(value) {
  return String(value).replaceAll('\\', '/').replace(/^\/+/, '');
}

async function hashFile(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

async function readJsonArray(filePath) {
  if (!(await exists(filePath))) return [];
  const parsed = JSON.parse(await readFile(filePath, 'utf8'));
  if (Array.isArray(parsed)) return parsed;
  return Array.isArray(parsed?.items) ? parsed.items : [];
}

async function readJsonObject(filePath) {
  if (!(await exists(filePath))) return null;
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function mimeFromExtension(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.ico') return 'image/x-icon';
  if (extension === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

async function removeEmptyDirectories(directory) {
  if (!(await exists(directory))) return;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) await removeEmptyDirectories(path.join(directory, entry.name));
  }
  if (directory === path.join(root, 'asset')) return;
  const remaining = await readdir(directory);
  if (remaining.length === 0) await rm(directory, { recursive: true, force: true });
}
