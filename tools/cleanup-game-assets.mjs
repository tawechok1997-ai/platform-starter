import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const legacyRoot = path.join(root, 'asset', 'mobil');
const canonicalRoot = path.join(root, 'asset', 'catalog', 'mobile');
const assetRoot = await exists(legacyRoot) ? legacyRoot : canonicalRoot;
const manifestPath = path.join(assetRoot, 'manifest.json');
const reportDir = path.join(root, 'docs', 'generated');
const reportPath = path.join(reportDir, 'game-asset-cleanup-report.json');

const DRY_RUN = process.argv.includes('--dry-run');
const JUNK_NAMES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);
const DUPLICATE_SUFFIX = /_\d+(?=\.[^.]+$)/;

const manifestDocument = JSON.parse(await readFile(manifestPath, 'utf8'));
const manifest = Array.isArray(manifestDocument) ? manifestDocument : manifestDocument?.items;
if (!Array.isArray(manifest)) throw new Error(`${path.relative(root, manifestPath)} must contain an items array`);

const allFiles = await walk(assetRoot);
const manifestFile = path.relative(assetRoot, manifestPath).split(path.sep).join('/');
const excludedControlFiles = new Set([manifestFile, 'catalog.json']);
const junkFiles = allFiles.map(relativeFromRoot).filter((file) => !excludedControlFiles.has(file) && isJunk(file));
const contentFiles = allFiles.map(relativeFromRoot).filter((file) => !excludedControlFiles.has(file) && !isJunk(file));

const byHash = new Map();
const fileMetadata = new Map();
for (const relative of contentFiles) {
  const absolute = path.join(assetRoot, ...relative.split('/'));
  const info = await stat(absolute);
  const sha256 = createHash('sha256').update(await readFile(absolute)).digest('hex');
  fileMetadata.set(relative, { sha256, size: info.size });
  const group = byHash.get(sha256) ?? [];
  group.push(relative);
  byHash.set(sha256, group);
}

const duplicateGroups = [...byHash.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([sha256, files]) => {
    const canonical = chooseCanonical(files);
    return { sha256, size: fileMetadata.get(canonical)?.size ?? 0, canonical, duplicates: files.filter((file) => file !== canonical).sort() };
  })
  .sort((a, b) => b.duplicates.length - a.duplicates.length || a.canonical.localeCompare(b.canonical));

const duplicateToCanonical = new Map();
for (const group of duplicateGroups) {
  for (const duplicate of group.duplicates) duplicateToCanonical.set(duplicate, group.canonical);
}

const removed = [...junkFiles, ...duplicateToCanonical.keys()].sort();
if (!DRY_RUN) {
  for (const relative of removed) await unlink(path.join(assetRoot, ...relative.split('/')));
}

const existingAfterCleanup = new Set(contentFiles.filter((file) => !duplicateToCanonical.has(file)));
const normalizedManifest = [];
const seenFiles = new Set();
for (const entry of manifest) {
  if (!entry || typeof entry.file !== 'string') continue;
  const original = entry.file.replaceAll('\\', '/');
  const canonical = duplicateToCanonical.get(original) ?? original;
  if (!existingAfterCleanup.has(canonical) || seenFiles.has(canonical)) continue;
  seenFiles.add(canonical);
  normalizedManifest.push({ ...entry, file: canonical, repositoryPath: `asset/catalog/mobile/${canonical}` });
}
normalizedManifest.sort((a, b) => String(a.file).localeCompare(String(b.file)));

if (!DRY_RUN) {
  const output = Array.isArray(manifestDocument)
    ? normalizedManifest
    : { ...manifestDocument, generatedAt: new Date().toISOString(), counts: summarize(normalizedManifest), items: normalizedManifest };
  await writeFile(manifestPath, `${JSON.stringify(output, null, 2)}\n`);
}

const bytesSaved = duplicateGroups.reduce((total, group) => total + group.size * group.duplicates.length, 0);
const report = {
  generatedAt: new Date().toISOString(),
  dryRun: DRY_RUN,
  assetRoot: path.relative(root, assetRoot).split(path.sep).join('/'),
  policy: {
    exactByteDuplicatesOnly: true,
    junkPatterns: [...JUNK_NAMES, '__MACOSX/**', '._*'],
    preservesUniqueAssets: true,
  },
  before: { files: contentFiles.length + junkFiles.length, manifestEntries: manifest.length },
  after: { files: existingAfterCleanup.size, manifestEntries: normalizedManifest.length },
  removedCount: removed.length,
  duplicateGroups: duplicateGroups.length,
  bytesSaved,
  junkFiles,
  groups: duplicateGroups,
};

await mkdir(reportDir, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Asset cleanup ${DRY_RUN ? 'dry run' : 'complete'} at ${report.assetRoot}`);
console.log(`Exact duplicate groups: ${duplicateGroups.length}`);
console.log(`Files removed: ${removed.length}`);
console.log(`Bytes saved: ${bytesSaved}`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function relativeFromRoot(absolute) {
  return path.relative(assetRoot, absolute).split(path.sep).join('/');
}

function isJunk(relative) {
  const parts = relative.split('/');
  const base = parts.at(-1) ?? '';
  return JUNK_NAMES.has(base) || parts.includes('__MACOSX') || base.startsWith('._');
}

function canonicalScore(relative) {
  const base = path.posix.basename(relative);
  let score = 0;
  if (!DUPLICATE_SUFFIX.test(base)) score += 1000;
  if (!relative.includes('/copy/')) score += 100;
  if (!relative.startsWith('misc/')) score += 50;
  score -= relative.length;
  return score;
}

function chooseCanonical(files) {
  return [...files].sort((left, right) => canonicalScore(right) - canonicalScore(left) || left.localeCompare(right))[0];
}

function summarize(items) {
  const counts = { total: items.length };
  for (const item of items) counts[item.category ?? 'misc'] = (counts[item.category ?? 'misc'] ?? 0) + 1;
  return counts;
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
