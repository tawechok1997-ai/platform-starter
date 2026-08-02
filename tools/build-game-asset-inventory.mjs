import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'docs', 'generated');
const inventoryPath = path.join(outputDir, 'game-asset-inventory.json');
const duplicatePath = path.join(outputDir, 'game-asset-duplicates.json');
const renamePath = path.join(outputDir, 'game-asset-rename-manifest.json');
const platforms = ['mobile', 'pc'];
const centralAssetRoot = path.join(
  root,
  'apps',
  'web-member',
  'public',
  'assets',
  'asset-pc',
);
const publicAssetRootCandidates = {
  mobile: [
    path.join(root, 'apps', 'web-member', 'public', 'assets', 'asset-mobile'),
    path.join(root, 'apps', 'web-member', 'public', 'assets', 'asset-moblie'),
    centralAssetRoot,
  ],
  pc: [centralAssetRoot],
};
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const UUID_PATTERN = /(^|[-_])[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}([-_.]|$)/i;
const LONG_TOKEN_PATTERN = /(^|[-_])(?:\d{6,}|[a-f0-9]{16,})([-_.]|$)/i;

const records = [];
const manifestGeneratedAt = [];
const manifestKeys = new Set();
const validationErrors = [];
const resolvedAssetRoots = [];

function normalizeManifestFile(platform, value) {
  const relative = value.replaceAll('\\', '/').replace(/^\.\//, '');
  if (!relative || path.posix.isAbsolute(relative)) {
    throw new Error(`asset/catalog/${platform}/manifest.json contains an invalid absolute or empty file path: ${value}`);
  }

  const normalized = path.posix.normalize(relative);
  if (normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`asset/catalog/${platform}/manifest.json contains a path outside the catalog root: ${value}`);
  }

  return normalized;
}

function needsNameReview(file) {
  const basename = path.posix.basename(file);
  return UUID_PATTERN.test(basename) || LONG_TOKEN_PATTERN.test(basename);
}

async function listFiles(directory, baseDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolute, baseDirectory));
      continue;
    }
    if (!entry.isFile()) continue;
    files.push(path.relative(baseDirectory, absolute).replaceAll('\\', '/'));
  }
  return files;
}

async function resolvePublicAssetRoot(platform) {
  for (const candidate of publicAssetRootCandidates[platform]) {
    try {
      const info = await stat(candidate);
      if (info.isDirectory()) return candidate;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  const expected = publicAssetRootCandidates[platform]
    .map((candidate) => path.relative(root, candidate).replaceAll('\\', '/'))
    .join(' or ');
  throw new Error(`No checked-in ${platform} game asset root found at ${expected}`);
}

async function loadPlatformManifest(platform) {
  const catalogRoot = path.join(root, 'asset', 'catalog', platform);
  const manifestPath = path.join(catalogRoot, 'manifest.json');

  try {
    const parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
    return { assetRoot: catalogRoot, parsed, source: `asset/catalog/${platform}/manifest.json` };
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;

    const assetRoot = await resolvePublicAssetRoot(platform);
    const files = await listFiles(assetRoot);
    const relativeAssetRoot = path.relative(root, assetRoot).replaceAll('\\', '/');
    const usesSharedPcAssets = platform === 'mobile' && assetRoot === centralAssetRoot;
    console.warn(
      usesSharedPcAssets
        ? `asset/catalog/mobile/manifest.json and a dedicated Mobile asset root are missing; reusing the central ${relativeAssetRoot} library for Mobile inventory (${files.length} files). Explicit Mobile Admin overrides still take priority at runtime.`
        : `asset/catalog/${platform}/manifest.json is missing; synthesizing inventory from ${relativeAssetRoot} (${files.length} files)`,
    );

    return {
      assetRoot,
      source: usesSharedPcAssets ? `${relativeAssetRoot} (shared-mobile-fallback)` : relativeAssetRoot,
      parsed: {
        generatedAt: '1970-01-01T00:00:00.000Z',
        items: files.map((file) => ({
          file,
          category: file.split('/')[0] ?? 'misc',
          repositoryPath: path.posix.join(relativeAssetRoot, file),
        })),
      },
    };
  }
}

for (const platform of platforms) {
  const { assetRoot, parsed, source } = await loadPlatformManifest(platform);
  resolvedAssetRoots.push({
    platform,
    path: path.relative(root, assetRoot).replaceAll('\\', '/'),
    shared: platform === 'mobile' && assetRoot === centralAssetRoot,
  });
  if (typeof parsed?.generatedAt === 'string' && !Number.isNaN(Date.parse(parsed.generatedAt))) {
    manifestGeneratedAt.push(parsed.generatedAt);
  }

  const manifest = Array.isArray(parsed) ? parsed : parsed?.items;
  if (!Array.isArray(manifest)) {
    throw new Error(`${source} must contain an items array`);
  }

  for (const [index, entry] of manifest.entries()) {
    if (!entry || typeof entry.file !== 'string' || !entry.file.trim()) {
      validationErrors.push(`${source} item ${index} is missing a valid file`);
      continue;
    }

    const relative = normalizeManifestFile(platform, entry.file.trim());
    const manifestKey = `${platform}:${relative.toLowerCase()}`;
    if (manifestKeys.has(manifestKey)) {
      validationErrors.push(`Duplicate manifest file entry: ${source}:${relative}`);
      continue;
    }
    manifestKeys.add(manifestKey);

    const absolute = path.join(assetRoot, ...relative.split('/'));
    let size = Number.isFinite(Number(entry.size)) ? Number(entry.size) : null;
    let sha256 = typeof entry.sha256 === 'string' && entry.sha256.trim()
      ? entry.sha256.trim().toLowerCase()
      : null;
    let exists = false;

    if (sha256 && !SHA256_PATTERN.test(sha256)) {
      validationErrors.push(`Invalid SHA-256 for ${source}:${relative}`);
      sha256 = null;
    }

    try {
      const info = await stat(absolute);
      if (info.isFile()) {
        exists = true;
        size = info.size;
        sha256 = createHash('sha256').update(await readFile(absolute)).digest('hex');
      }
    } catch {
      // Catalog manifests remain useful when source binaries are stored outside Git.
    }

    records.push({
      platform,
      sourceUrl: typeof entry.sourceUrl === 'string' ? entry.sourceUrl : null,
      sourceFile: typeof entry.sourceFile === 'string' ? entry.sourceFile : null,
      repositoryPath:
        typeof entry.repositoryPath === 'string'
          ? entry.repositoryPath.replaceAll('\\', '/')
          : path.relative(root, absolute).replaceAll('\\', '/'),
      mimeType: typeof entry.mimeType === 'string' ? entry.mimeType : null,
      status: Number(entry.status ?? 0),
      file: relative,
      category: String(entry.category ?? relative.split('/')[0] ?? 'misc'),
      exists,
      size,
      sha256,
      sharedAssetRoot: platform === 'mobile' && assetRoot === centralAssetRoot,
    });
  }
}

if (validationErrors.length > 0) {
  throw new Error(`Game asset manifest validation failed:\n- ${validationErrors.join('\n- ')}`);
}

records.sort((a, b) => a.platform.localeCompare(b.platform) || a.file.localeCompare(b.file));

const byHash = new Map();
for (const record of records) {
  if (!record.sha256) continue;
  const group = byHash.get(record.sha256) ?? [];
  group.push({ platform: record.platform, file: record.file, repositoryPath: record.repositoryPath });
  byHash.set(record.sha256, group);
}

const duplicateGroups = [...byHash.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([sha256, files]) => {
    const sortedFiles = [...files].sort((a, b) => a.repositoryPath.localeCompare(b.repositoryPath));
    return {
      sha256,
      canonical: sortedFiles[0],
      duplicates: sortedFiles.slice(1),
      files: sortedFiles,
      crossPlatform: new Set(sortedFiles.map((item) => item.platform)).size > 1,
    };
  })
  .sort((a, b) => b.files.length - a.files.length || a.canonical.repositoryPath.localeCompare(b.canonical.repositoryPath));

const renameManifest = records
  .filter((record) => needsNameReview(record.file))
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
    if (record.sharedAssetRoot) summary.sharedPcMobileEntries += 1;
    return summary;
  },
  {
    total: 0,
    notCheckedIntoGit: 0,
    missingHash: 0,
    sharedPcMobileEntries: 0,
    byPlatform: {},
    byCategory: {},
  },
);

const generatedAt = manifestGeneratedAt
  .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? '1970-01-01T00:00:00.000Z';

await mkdir(outputDir, { recursive: true });
await writeFile(
  inventoryPath,
  `${JSON.stringify({ generatedAt, assetRoots: resolvedAssetRoots, counts, items: records }, null, 2)}\n`,
);
await writeFile(
  duplicatePath,
  `${JSON.stringify({
    generatedAt,
    counts: {
      groups: duplicateGroups.length,
      crossPlatform: duplicateGroups.filter((group) => group.crossPlatform).length,
    },
    duplicateGroups,
  }, null, 2)}\n`,
);
await writeFile(
  renamePath,
  `${JSON.stringify({
    generatedAt,
    counts: { reviewCandidates: renameManifest.length },
    items: renameManifest,
  }, null, 2)}\n`,
);

console.log(`Game asset inventory: ${records.length} entries`);
console.log(`Mobile entries: ${counts.byPlatform.mobile ?? 0}`);
console.log(`PC entries: ${counts.byPlatform.pc ?? 0}`);
console.log(`Mobile entries reusing asset-pc: ${counts.sharedPcMobileEntries}`);
console.log(`Duplicate groups: ${duplicateGroups.length}`);
console.log(`Cross-platform duplicate groups: ${duplicateGroups.filter((group) => group.crossPlatform).length}`);
console.log(`Rename review candidates: ${renameManifest.length}`);
console.log(`Entries without SHA-256: ${counts.missingHash}`);
