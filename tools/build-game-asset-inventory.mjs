import { createHash } from 'node:crypto';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assetRoot = path.join(root, 'asset', 'catalog', 'mobile');
const manifestPath = path.join(assetRoot, 'manifest.json');
const outputDir = path.join(root, 'docs', 'generated');
const inventoryPath = path.join(outputDir, 'game-asset-inventory.json');
const duplicatePath = path.join(outputDir, 'game-asset-duplicates.json');
const renamePath = path.join(outputDir, 'game-asset-rename-manifest.json');

await access(manifestPath);
const parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
const manifest = Array.isArray(parsed) ? parsed : parsed?.items;
if (!Array.isArray(manifest)) throw new Error('asset/catalog/mobile/manifest.json must contain an items array');

const records = [];
for (const entry of manifest) {
  if (!entry || typeof entry.file !== 'string') continue;
  const relative = entry.file.replaceAll('\\', '/');
  const absolute = path.join(assetRoot, ...relative.split('/'));
  let size = null;
  let sha256 = null;
  let exists = false;
  try {
    const info = await stat(absolute);
    if (info.isFile()) {
      exists = true;
      size = info.size;
      sha256 = createHash('sha256').update(await readFile(absolute)).digest('hex');
    }
  } catch {
    // Missing entries remain visible in the report for reconciliation.
  }
  records.push({
    sourceUrl: typeof entry.sourceUrl === 'string' ? entry.sourceUrl : null,
    mimeType: typeof entry.mimeType === 'string' ? entry.mimeType : null,
    status: Number(entry.status ?? 0),
    file: relative,
    category: String(entry.category ?? relative.split('/')[0] ?? 'misc'),
    exists,
    size,
    sha256,
  });
}

const byHash = new Map();
for (const record of records) {
  if (!record.sha256) continue;
  const group = byHash.get(record.sha256) ?? [];
  group.push(record.file);
  byHash.set(record.sha256, group);
}
const duplicateGroups = [...byHash.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([sha256, files]) => ({ sha256, canonical: files[0], duplicates: files.slice(1), files }))
  .sort((a, b) => b.files.length - a.files.length || a.canonical.localeCompare(b.canonical));

const renameManifest = records
  .filter((record) => /(^|[-_])\d{6,}([-_.]|$)/.test(path.posix.basename(record.file)))
  .map((record) => ({
    source: `asset/catalog/mobile/${record.file}`,
    category: record.category,
    action: 'review-name',
    reviewRequired: true,
  }))
  .sort((a, b) => a.source.localeCompare(b.source));

const counts = records.reduce((summary, record) => {
  summary.total += 1;
  summary[record.category] = (summary[record.category] ?? 0) + 1;
  if (!record.exists) summary.missing += 1;
  return summary;
}, { total: 0, missing: 0 });

await mkdir(outputDir, { recursive: true });
await writeFile(inventoryPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), assetRoot: 'asset/catalog/mobile', counts, items: records }, null, 2)}\n`);
await writeFile(duplicatePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), duplicateGroups }, null, 2)}\n`);
await writeFile(renamePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), items: renameManifest }, null, 2)}\n`);

console.log(`Game asset inventory: ${records.length} entries`);
console.log(`Duplicate groups: ${duplicateGroups.length}`);
console.log(`Rename review candidates: ${renameManifest.length}`);
console.log(`Missing files: ${counts.missing}`);
