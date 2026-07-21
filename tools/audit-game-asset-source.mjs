import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

// Source archives intentionally remain outside Git. This tool consumes an
// extracted asset directory and writes a deterministic, reviewable audit.
const sourceRoot = path.resolve(process.argv[2] ?? 'asset-source');
const outputPath = path.resolve(
  process.argv[3] ?? 'docs/generated/game-asset-source-audit.json',
);

const IMAGE_EXTENSIONS = new Set([
  '.png',
  '.webp',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.ico',
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(absolute));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
}

function platformHint(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/').toLowerCase();
  const segments = normalized.split('/').filter(Boolean);
  const mobile = segments.some((segment) =>
    segment === 'mobile'
    || segment.startsWith('mobile-')
    || segment.endsWith('-mobile')
    || segment === 'casino-mobile',
  );

  return mobile ? 'mobile' : 'pc_or_shared';
}

function categoryHint(relativePath) {
  const segments = relativePath.replaceAll('\\', '/').split('/').filter(Boolean);
  if (segments.length === 0) return 'misc';

  const platformIndex = segments.findIndex((segment) =>
    /^(mobile|pc|desktop|shared)(-|$)/i.test(segment),
  );

  return segments[platformIndex + 1] ?? segments[1] ?? segments[0] ?? 'misc';
}

const sourceFiles = (await walk(sourceRoot))
  .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
  .sort((a, b) => a.localeCompare(b));

const items = [];
const byHash = new Map();

for (const absolute of sourceFiles) {
  const contents = await readFile(absolute);
  const relative = path.relative(sourceRoot, absolute).replaceAll('\\', '/');
  const sha256 = createHash('sha256').update(contents).digest('hex');
  const item = {
    sourceFile: relative,
    platformHint: platformHint(relative),
    category: categoryHint(relative),
    size: contents.byteLength,
    sha256,
    extension: path.extname(relative).toLowerCase(),
  };

  items.push(item);
  const group = byHash.get(sha256) ?? [];
  group.push(relative);
  byHash.set(sha256, group);
}

const duplicateGroups = [...byHash.entries()]
  .filter(([, files]) => files.length > 1)
  .map(([sha256, files]) => ({ sha256, count: files.length, files: [...files].sort() }))
  .sort((a, b) => b.count - a.count || a.files[0].localeCompare(b.files[0]));

function countBy(key) {
  const counts = new Map();
  for (const item of items) {
    const value = item[key];
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(([a], [b]) => String(a).localeCompare(String(b))),
  );
}

const report = {
  sourceRoot: path.relative(process.cwd(), sourceRoot).replaceAll('\\', '/'),
  counts: {
    total: items.length,
    mobileHint: items.filter((item) => item.platformHint === 'mobile').length,
    pcOrSharedHint: items.filter((item) => item.platformHint === 'pc_or_shared').length,
    duplicateGroups: duplicateGroups.length,
    duplicateFiles: duplicateGroups.reduce((sum, group) => sum + group.count - 1, 0),
    byCategory: countBy('category'),
    byExtension: countBy('extension'),
  },
  duplicateGroups,
  items,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Asset source files: ${report.counts.total}`);
console.log(`Mobile hints: ${report.counts.mobileHint}`);
console.log(`PC/shared hints: ${report.counts.pcOrSharedHint}`);
console.log(`Duplicate groups: ${report.counts.duplicateGroups}`);
console.log(`Audit written to ${outputPath}`);
