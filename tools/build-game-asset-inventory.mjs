import { createHash } from 'node:crypto';
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const assetRoot = path.join(root, 'asset', 'mobil');
const manifestPath = path.join(assetRoot, 'manifest.json');
const outputDir = path.join(root, 'docs', 'generated');
const inventoryPath = path.join(outputDir, 'game-asset-inventory.json');
const duplicatePath = path.join(outputDir, 'game-asset-duplicates.json');
const renamePath = path.join(outputDir, 'game-asset-rename-manifest.json');

await access(manifestPath);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!Array.isArray(manifest)) throw new Error('asset/mobil/manifest.json must contain an array');

const classify = (file) => {
  const normalized = file.replaceAll('\\', '/').toLowerCase();
  if (normalized.includes('/providers/')) return 'provider-logo';
  if (normalized.includes('/games/') || normalized.includes('/gamecard/')) return 'game-image';
  if (normalized.includes('/imageslides/') || normalized.includes('/highlight/')) return 'banner';
  if (normalized.includes('/promotions/')) return 'promotion';
  return 'other';
};

const stripDuplicateSuffix = (filename) => filename.replace(/_\d+(?=\.[^.]+$)/, '');
const slugify = (value) => value
  .normalize('NFKD')
  .replace(/[^a-zA-Z0-9._/-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .toLowerCase();

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
    // Keep missing entries in the report so uploads can be reconciled safely.
  }
  const kind = classify(relative);
  records.push({
    sourceUrl: typeof entry.url === 'string' ? entry.url : null,
    mimeType: typeof entry.mimeType === 'string' ? entry.mimeType : null,
    status: Number(entry.status ?? 0),
    file: relative,
    kind,
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

const canonicalByHash = new Map(duplicateGroups.map((group) => [group.sha256, group.canonical]));
const renameManifest = records
  .filter((record) => record.kind === 'provider-logo' || record.kind === 'game-image')
  .map((record) => {
    const parsed = path.posix.parse(record.file);
    const cleanName = slugify(stripDuplicateSuffix(parsed.base));
    const targetFolder = record.kind === 'provider-logo' ? 'providers' : 'games';
    const duplicateOf = record.sha256 ? canonicalByHash.get(record.sha256) ?? null : null;
    return {
      source: record.file,
      proposedTarget: `asset/catalog/mobile/${targetFolder}/${cleanName}`,
      kind: record.kind,
      duplicateOf: duplicateOf && duplicateOf !== record.file ? duplicateOf : null,
      action: duplicateOf && duplicateOf !== record.file ? 'skip-duplicate' : 'copy',
      reviewRequired: /(^|[-_])\d{6,}([-_.]|$)/.test(cleanName),
    };
  })
  .sort((a, b) => a.proposedTarget.localeCompare(b.proposedTarget));

const counts = records.reduce((summary, record) => {
  summary.total += 1;
  summary[record.kind] = (summary[record.kind] ?? 0) + 1;
  if (!record.exists) summary.missing += 1;
  return summary;
}, { total: 0, missing: 0 });

await mkdir(outputDir, { recursive: true });
await writeFile(inventoryPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), assetRoot: 'asset/mobil', counts, items: records }, null, 2)}\n`);
await writeFile(duplicatePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), duplicateGroups }, null, 2)}\n`);
await writeFile(renamePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), items: renameManifest }, null, 2)}\n`);

console.log(`Game asset inventory: ${records.length} entries`);
console.log(`Duplicate groups: ${duplicateGroups.length}`);
console.log(`Rename candidates: ${renameManifest.length}`);
console.log(`Missing files: ${counts.missing}`);
