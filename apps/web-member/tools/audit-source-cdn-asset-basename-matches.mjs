import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(toolDirectory, '..');
const repositoryRoot = path.resolve(packageRoot, '..', '..');
const assetRoot = path.join(packageRoot, 'public', 'assets');
const CDN_ORIGIN = 'https://cdn.zabbet.com';
const SUPPORTED_EXTENSIONS = new Set(['.avif', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.svg', '.webm', '.webp']);

const CATALOGS = [
  {
    id: 'mobile-left-menu',
    catalogPath: path.join(toolDirectory, 'source-cdn-asset-catalog.json'),
    catalogLabel: 'apps/web-member/tools/source-cdn-asset-catalog.json',
    reportPath: path.join(repositoryRoot, 'docs', 'generated', 'source-cdn-asset-match-report.json'),
  },
  {
    id: 'authenticated-mobile',
    catalogPath: path.join(toolDirectory, 'authenticated-source-cdn-asset-catalog.json'),
    catalogLabel: 'apps/web-member/tools/authenticated-source-cdn-asset-catalog.json',
    reportPath: path.join(repositoryRoot, 'docs', 'generated', 'authenticated-source-cdn-asset-match-report.json'),
  },
];

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

function sourceItemsFromCatalog(catalog) {
  if (!catalog.categories || typeof catalog.categories !== 'object' || Array.isArray(catalog.categories)) {
    throw new Error('CDN asset catalog must contain a categories object');
  }

  const items = [];
  for (const [category, sourcePaths] of Object.entries(catalog.categories)) {
    if (!Array.isArray(sourcePaths)) throw new Error(`Category ${category} must contain an array`);
    for (const sourcePath of sourcePaths) {
      if (typeof sourcePath !== 'string' || !sourcePath.startsWith('/')) {
        throw new Error(`Category ${category} contains an invalid CDN path`);
      }
      const fileName = path.posix.basename(sourcePath).toLowerCase();
      items.push({ category, sourceUrl: `${CDN_ORIGIN}${sourcePath}`, fileName });
    }
  }
  return items;
}

function buildLocalIndex(localFiles) {
  const localByBasename = new Map();
  for (const relative of localFiles) {
    const basename = path.posix.basename(relative).toLowerCase();
    const candidates = localByBasename.get(basename) ?? [];
    candidates.push(`/assets/${relative}`);
    localByBasename.set(basename, candidates);
  }
  return localByBasename;
}

function matchCatalog(catalog, localByBasename, localFiles) {
  const sourceItems = sourceItemsFromCatalog(catalog);
  const uniqueSourceBasenames = new Set(sourceItems.map((item) => item.fileName));

  if (sourceItems.length !== Number(catalog.counts?.entries)) {
    throw new Error(`Catalog entry count drift: expected ${catalog.counts?.entries}, received ${sourceItems.length}`);
  }
  if (uniqueSourceBasenames.size !== Number(catalog.counts?.uniqueBasenames)) {
    throw new Error(
      `Catalog basename count drift: expected ${catalog.counts?.uniqueBasenames}, received ${uniqueSourceBasenames.size}`,
    );
  }

  const items = sourceItems.map((entry) => {
    const candidates = [...(localByBasename.get(entry.fileName) ?? [])]
      .sort((left, right) => rankCandidate(left, entry.sourceUrl) - rankCandidate(right, entry.sourceUrl) || left.localeCompare(right));
    return {
      ...entry,
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

  return {
    counts,
    missing: uniqueItems.filter((item) => item.status === 'missing').map((item) => ({
      category: item.category,
      fileName: item.fileName,
      sourceUrl: item.sourceUrl,
    })),
    items,
  };
}

const localFiles = await walk(assetRoot);
const localByBasename = buildLocalIndex(localFiles);

for (const descriptor of CATALOGS) {
  const catalog = JSON.parse(await readFile(descriptor.catalogPath, 'utf8'));
  const matched = matchCatalog(catalog, localByBasename, localFiles);
  const report = {
    generatedAt: new Date().toISOString(),
    catalogId: descriptor.id,
    sourceCatalog: descriptor.catalogLabel,
    assetRoot: 'apps/web-member/public/assets',
    ...matched,
  };

  await mkdir(path.dirname(descriptor.reportPath), { recursive: true });
  await writeFile(descriptor.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`[${descriptor.id}] Source CDN entries: ${matched.counts.sourceEntries}`);
  console.log(`[${descriptor.id}] Unique CDN basenames: ${matched.counts.uniqueBasenames}`);
  console.log(`[${descriptor.id}] Matched unique basenames: ${matched.counts.matchedUniqueBasenames}`);
  console.log(`[${descriptor.id}] Missing unique basenames: ${matched.counts.missingUniqueBasenames}`);
  console.log(`[${descriptor.id}] Local asset files scanned: ${matched.counts.localAssetFilesScanned}`);
  console.log(`[${descriptor.id}] Report: ${path.relative(repositoryRoot, descriptor.reportPath).replaceAll('\\', '/')}`);
}
