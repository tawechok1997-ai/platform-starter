import { createHash } from 'node:crypto';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'docs', 'generated');
const inventoryPath = path.join(outputDir, 'game-asset-inventory.json');
const duplicatePath = path.join(outputDir, 'game-asset-duplicates.json');
const renamePath = path.join(outputDir, 'game-asset-rename-manifest.json');
const platforms = ['mobile', 'pc'];

const records = [];

for (const platform of platforms) {
  const assetRoot = path.join(root, 'asset', 'catalog', platform);
  const manifestPath = path.join(assetRoot, 'manifest.json');
  await access(manifestPath);

  const parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
  const manifest = Array.isArray(parsed) ? parsed : parsed?.items;
  if (!Array.isArray(manifest)) {
    throw new Error(`asset/catalog/${platform}/manifest.json must contain an items array`);
  }

  for (const entry of manifest) {
    if (!entry || typeof entry.file !== 'string') continue;

    const relative = entry.file.replaceAll('\\', '/');
    const absolute = path.join(assetRoot, ...relative.split('/'));
    let size = Number.isFinite(Number(entry.size)) ? Number(entry.size) : null;
    let sha256 = typeof entry.sha256 === 'string' && entry.sha256.trim() ? entry.sha256.trim() : null;
    let exists = false;

    try {
      const info = await stat(absolute);
      if (info.isFile()) {
        exists = true;
        size = info.size;
        sha256 = createHash('sha256').update(await readFile(absolute)).digest('hex');
      }
    } catch {
      // Catalog manifests intentionally remain useful even when source binaries are stored outside Git.
    }

    records.push({
      platform,
      sourceUrl: typeof entry.sourceUrl === 'string' ? entry.sourceUrl : null,
      sourceFile: typeof entry.sourceFile === 'string' ? entry.sourceFile : null,
      repositoryPath:
        typeof entry.repositoryPath === 'string'
          ? entry.repositoryPath.replaceAll('\\', '/')
          : `asset/catalog/${platform}/${relative}`,
      mimeType: typeof entry.mimeType === 'string' ? entry.mimeType : null,
      status: Number(entry.status ?? 0),
      file: relative,
      category: String(entry.category ?? relative.split('/')[0] ?? 'misc'),
      exists,
      size,
      sha256,
    });
  }
}

const byHash = new Map();
for (const record of records) {
  if (!record.sha256) continue;
  const group = byHash.get(record.sha256) ?? [];
  group.push({ platform: record.platform, file: record.file, repositoryPath: record.repositoryPath });
  byHash.set(record.sha256, group);
}

const duplicateGroups = [...byHash.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([sha256, files]) => ({
    sha256,
    canonical: files[0],
    duplicates: files.slice(1),
    files,
    crossPlatform: new Set(files.map((item) => item.platform)).size > 1,
  }))
  .sort((a, b) => b.files.length - a.files.length || a.canonical.repositoryPath.localeCompare(b.canonical.repositoryPath));

const renameManifest = records
  .filter((record) => /(^|[-_])\d{6,}([-_.]|$)/.test(path.posix.basename(record.file)))
  .map((record) => ({
    source: record.repositoryPath,
    platform: record.platform,
    category: record.category,
    sha256: record.sha256,
    action: 'review-name',
    reviewRequired: true,
  }))
  .sort((a, b) => a.source.localeCompare(b.source));

const counts = records.reduce(
  (summary, record) => {
    summary.total += 1;
    summary.byPlatform[record.platform] = (summary.byPlatform[record.platform] ?? 0) + 1;
    summary.byCategory[record.category] = (summary.byCategory[record.category] ?? 0) + 1;
    if (!record.exists) summary.notCheckedIntoGit += 1;
    if (!record.sha256) summary.missingHash += 1;
    return summary;
  },
  { total: 0, notCheckedIntoGit: 0, missingHash: 0, byPlatform: {}, byCategory: {} },
);

await mkdir(outputDir, { recursive: true });
const generatedAt = new Date().toISOString();
await writeFile(
  inventoryPath,
  `${JSON.stringify({ generatedAt, assetRoots: platforms.map((platform) => `asset/catalog/${platform}`), counts, items: records }, null, 2)}\n`,
);
await writeFile(
  duplicatePath,
  `${JSON.stringify({ generatedAt, counts: { groups: duplicateGroups.length, crossPlatform: duplicateGroups.filter((group) => group.crossPlatform).length }, duplicateGroups }, null, 2)}\n`,
);
await writeFile(
  renamePath,
  `${JSON.stringify({ generatedAt, counts: { reviewCandidates: renameManifest.length }, items: renameManifest }, null, 2)}\n`,
);

console.log(`Game asset inventory: ${records.length} entries`);
console.log(`Mobile entries: ${counts.byPlatform.mobile ?? 0}`);
console.log(`PC entries: ${counts.byPlatform.pc ?? 0}`);
console.log(`Duplicate groups: ${duplicateGroups.length}`);
console.log(`Cross-platform duplicate groups: ${duplicateGroups.filter((group) => group.crossPlatform).length}`);
console.log(`Rename review candidates: ${renameManifest.length}`);
console.log(`Entries without SHA-256: ${counts.missingHash}`);
