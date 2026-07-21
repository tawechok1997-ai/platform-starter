import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pipeline } from 'node:stream/promises';
import { createUnzip } from 'node:zlib';

// Source archives are intentionally kept outside Git. This tool consumes an
// extracted asset directory so audits remain deterministic and reviewable.
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
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function platformHint(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/').toLowerCase();
  return normalized.includes('/mobile-') || normalized.includes('/casino-mobile/')
    ? 'mobile'
    : 'pc_or_shared';
}

const sourceFiles = (await walk(sourceRoot))
  .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
  .sort();

const items = [];
const byHash = new Map();
for (const absolute of sourceFiles) {
  const contents = await readFile(absolute);
  const relative = path.relative(sourceRoot, absolute).replaceAll('\\', '/');
  const sha256 = createHash('sha256').update(contents).digest('hex');
  const category = relative.split('/')[1] ?? relative.split('/')[0] ?? 'misc';
  const item = {
    sourceFile: relative,
    platformHint: platformHint(relative),
    category,
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
  .map(([sha256, files]) => ({ sha256, count: files.length, files }))
  .sort((a, b) => b.count - a.count || a.files[0].localeCompare(b.files[0]));

const countBy = (key) => Object.fromEntries(
  [...items.reduce((map, item) => {
    const value = item[key];
    map.set(value, (map.get(value) ?? 0) + 1);
    return map;
  }, new Map())].sort(([a], [b]) => String(a).localeCompare(String(b))),
);

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
