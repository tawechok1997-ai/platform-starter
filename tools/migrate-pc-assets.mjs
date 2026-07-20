import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'asset', 'pc');
const targetRoot = path.join(root, 'asset', 'catalog', 'pc');
const sourceManifestPath = path.join(sourceRoot, 'manifest.json');
const targetManifestPath = path.join(targetRoot, 'manifest.json');
const reportPath = path.join(root, 'docs', 'generated', 'pc-asset-migration-report.json');

await access(sourceManifestPath);
const sourceManifest = JSON.parse(await readFile(sourceManifestPath, 'utf8'));
if (!Array.isArray(sourceManifest)) throw new Error('asset/pc/manifest.json must contain an array');

const trackerHosts = new Set([
  'tools.luckyorange.com',
  'settings.luckyorange.com',
  'www.clarity.ms',
  'static.hotjar.com',
  'matomo.drinkpa.club',
]);
const junkNames = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);

const records = [];
const dropped = [];
const seenHash = new Map();
let duplicateCount = 0;
let bytesSaved = 0;

for (const entry of sourceManifest) {
  if (!entry || typeof entry.file !== 'string') continue;
  const sourceRelative = entry.file.replaceAll('\\', '/');
  const sourceAbsolute = path.join(sourceRoot, ...sourceRelative.split('/'));
  if (!(await exists(sourceAbsolute))) continue;

  const basename = path.posix.basename(sourceRelative);
  const host = sourceRelative.split('/')[0]?.toLowerCase() ?? '';
  if (junkNames.has(basename) || sourceRelative.includes('/__MACOSX/') || basename.startsWith('._')) {
    dropped.push({ file: sourceRelative, reason: 'os-junk' });
    await rm(sourceAbsolute, { force: true });
    continue;
  }
  if (trackerHosts.has(host)) {
    dropped.push({ file: sourceRelative, reason: 'third-party-tracker' });
    await rm(sourceAbsolute, { force: true });
    continue;
  }

  const info = await stat(sourceAbsolute);
  const bytes = await readFile(sourceAbsolute);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const canonical = seenHash.get(sha256);
  if (canonical) {
    duplicateCount += 1;
    bytesSaved += info.size;
    dropped.push({ file: sourceRelative, reason: 'exact-duplicate', duplicateOf: canonical });
    await rm(sourceAbsolute, { force: true });
    continue;
  }

  const category = classify(sourceRelative, entry.mimeType);
  const normalizedRelative = normalizePath(sourceRelative);
  const targetRelative = `${category}/${normalizedRelative}`;
  const targetAbsolute = path.join(targetRoot, ...targetRelative.split('/'));
  await mkdir(path.dirname(targetAbsolute), { recursive: true });
  if (await exists(targetAbsolute)) await rm(targetAbsolute, { force: true });
  await rename(sourceAbsolute, targetAbsolute);
  seenHash.set(sha256, targetRelative);

  records.push({
    file: targetRelative,
    repositoryPath: `asset/catalog/pc/${targetRelative}`,
    sourceFile: `asset/pc/${sourceRelative}`,
    sourceUrl: typeof entry.url === 'string' ? entry.url : null,
    mimeType: typeof entry.mimeType === 'string' ? entry.mimeType : mimeFromExtension(targetRelative),
    status: Number(entry.status ?? 0),
    category,
    size: info.size,
    sha256,
  });
}

records.sort((a, b) => a.file.localeCompare(b.file));
await mkdir(targetRoot, { recursive: true });
const counts = records.reduce((result, item) => {
  result.total += 1;
  result[item.category] = (result[item.category] ?? 0) + 1;
  return result;
}, { total: 0 });
await writeFile(targetManifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  platform: 'pc',
  sourceDirectoryRemoved: true,
  counts,
  items: records,
}, null, 2)}\n`);

await rm(sourceManifestPath, { force: true });
await removeEmptyDirectories(sourceRoot);
if (await exists(sourceRoot)) {
  const leftovers = await walk(sourceRoot);
  if (leftovers.length > 0) throw new Error(`PC migration left ${leftovers.length} files in asset/pc`);
  await rm(sourceRoot, { recursive: true, force: true });
}

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  sourceEntries: sourceManifest.length,
  migrated: records.length,
  dropped: dropped.length,
  exactDuplicatesRemoved: duplicateCount,
  bytesSaved,
  counts,
  droppedItems: dropped,
}, null, 2)}\n`);

console.log(`Migrated ${records.length} PC files into asset/catalog/pc.`);
console.log(`Removed ${duplicateCount} exact duplicates and ${dropped.length - duplicateCount} junk/tracker files.`);

function classify(file, mimeType) {
  const normalized = file.toLowerCase();
  const mime = String(mimeType ?? '').toLowerCase();
  if (normalized.includes('/providers/') || normalized.includes('/provider/')) return 'providers';
  if (normalized.includes('/games/') || normalized.includes('/gamecard/') || normalized.includes('/slot/')) return 'games';
  if (normalized.includes('/promotions/') || normalized.includes('/promotion/')) return 'promotions';
  if (normalized.includes('/imageslides/') || normalized.includes('/highlight/') || normalized.includes('/banner')) return 'banners';
  if (normalized.includes('/banks/') || normalized.includes('/bank/')) return 'banks';
  if (normalized.includes('/flags/') || normalized.includes('/flag/')) return 'flags';
  if (normalized.includes('/tournament/') || normalized.includes('/event/')) return 'tournament';
  if (normalized.includes('/font') || mime.startsWith('font/')) return 'fonts';
  if (mime.includes('javascript') || normalized.endsWith('.js') || normalized.endsWith('.mjs')) return 'scripts';
  if (mime === 'text/css' || normalized.endsWith('.css')) return 'styles';
  if (mime === 'text/html' || normalized.endsWith('.html')) return 'pages';
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|ico|avif)$/i.test(normalized)) return 'images';
  if (mime.includes('json') || normalized.endsWith('.json')) return 'data';
  return 'misc';
}

function normalizePath(file) {
  return file
    .normalize('NFKD')
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean)
    .map((part) => part
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'unnamed')
    .join('/');
}

function mimeFromExtension(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.css') return 'text/css';
  if (extension === '.js') return 'application/javascript';
  if (extension === '.html') return 'text/html';
  if (extension === '.json') return 'application/json';
  return 'application/octet-stream';
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

async function removeEmptyDirectories(directory) {
  if (!(await exists(directory))) return;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) await removeEmptyDirectories(path.join(directory, entry.name));
  }
  if (directory === sourceRoot) return;
  if ((await readdir(directory)).length === 0) await rm(directory, { recursive: true, force: true });
}
