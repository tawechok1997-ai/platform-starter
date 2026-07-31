import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(toolDirectory, '..');
const repositoryRoot = path.resolve(packageRoot, '..', '..');
const assetRoot = path.join(packageRoot, 'public', 'assets');
const catalogPath = path.join(toolDirectory, 'source-cdn-asset-catalog.json');
const reportPath = path.join(repositoryRoot, 'docs', 'generated', 'source-cdn-asset-match-report.json');
const SUPPORTED_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webm', '.webp']);

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
    if (!entry.isFile() || !SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    files.push(path.relative(baseDirectory, absolute).replaceAll('\\', '/'));
  }
  return files;
}

function rankCandidate(value, sourceUrl) {
  const candidate = value.toLowerCase();
  let sourcePath = '';
  try {
    sourcePath = new URL(sourceUrl).pathname.toLowerCase().replace(/^\/+/, '');
  } catch {
    sourcePath = '';
  }

  let score = 100;
  if (sourcePath && candidate.endsWith(sourcePath)) score -= 80;

  const parent = sourcePath.split('/').slice(0, -1).join('/');
  if (parent && candidate.includes(parent)) score -= 40;
  if (candidate.includes('asset-pc/')) score -= 20;
  if (candidate.includes('asset-mobile/') || candidate.includes('asset-moblie/')) score -= 10;
  return score;
}

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
if (!Array.isArray(catalog.items)) throw new Error('source-cdn-asset-catalog.json must contain an items array');

const localFiles = await walk(assetRoot);
const localByBasename = new Map();
for (const relative of localFiles) {
  const basename = path.posix.basename(relative).toLowerCase();
  const candidates = localByBasename.get(basename) ?? [];
  candidates.push(`/assets/${relative}`);
  localByBasename.set(basename, candidates);
}

const items = catalog.items.map((entry) => {
  const fileName = String(entry.fileName ?? '').toLowerCase();
  const candidates = [...(localByBasename.get(fileName) ?? [])]
    .sort((left, right) => rankCandidate(left, entry.sourceUrl) - rankCandidate(right, entry.sourceUrl) || left.localeCompare(right));
  return {
    category: entry.category,
    sourceUrl: entry.sourceUrl,
    fileName,
    status: candidates.length ? 'matched' : 'missing',
    selectedLocalAsset: candidates[0] ?? null,
    localCandidates: candidates,
  };
});

const uniqueByBasename = new Map();
for (const item of items) {
  const existing = uniqueByBasename.get(item.fileName);
  if (!existing || (!existing.selectedLocalAsset && item.selectedLocalAsset)) uniqueByBasename.set(item.fileName, item);
}

const uniqueItems = [...uniqueByBasename.values()].sort((left, right) => left.fileName.localeCompare(right.fileName));
const counts = {
  sourceEntries: items.length,
  uniqueBasenames: uniqueItems.length,
  matchedEntries: items.filter((item) => item.status === 'matched').length,
  missingEntries: items.filter((item) => item.status === 'missing').length,
  matchedUniqueBasenames: uniqueItems.filter((item) => item.status === 'matched').length,
  missingUniqueBasenames: uniqueItems.filter((item) => item.status === 'missing').length,
  duplicatedLocalBasenames: uniqueItems.filter((item) => item.localCandidates.length > 1).length,
  localAssetFilesScanned: localFiles.length,
};

const report = {
  generatedAt: new Date().toISOString(),
  sourceCatalog: 'apps/web-member/tools/source-cdn-asset-catalog.json',
  assetRoot: 'apps/web-member/public/assets',
  counts,
  missing: uniqueItems.filter((item) => item.status === 'missing').map((item) => ({
    category: item.category,
    fileName: item.fileName,
    sourceUrl: item.sourceUrl,
  })),
  items,
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`Source CDN entries: ${counts.sourceEntries}`);
console.log(`Unique CDN basenames: ${counts.uniqueBasenames}`);
console.log(`Matched unique basenames: ${counts.matchedUniqueBasenames}`);
console.log(`Missing unique basenames: ${counts.missingUniqueBasenames}`);
console.log(`Local asset files scanned: ${counts.localAssetFilesScanned}`);
console.log(`Report: ${path.relative(repositoryRoot, reportPath).replaceAll('\\', '/')}`);
