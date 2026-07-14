import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const appRoots = [
  join(root, 'apps', 'web-admin'),
  join(root, 'apps', 'web-member'),
];

const allowedFiles = new Set([
  'apps/web-admin/lib/api.ts',
  'apps/web-admin/src/lib/api.ts',
  'apps/web-member/lib/api.ts',
  'apps/web-member/src/lib/api.ts',
]);

const forbidden = [
  { name: 'direct fetch', pattern: /\bfetch\s*\(/g },
  { name: 'axios import/use', pattern: /\baxios\b/g },
  { name: 'local API route', pattern: /["'`]\/api\//g },
  { name: 'duplicate adminFetch helper', pattern: /\b(?:function|const)\s+adminFetch\b/g },
  { name: 'duplicate memberFetch helper', pattern: /\b(?:function|const)\s+memberFetch\b/g },
  { name: 'duplicate fetchJson helper', pattern: /\b(?:function|const)\s+fetchJson\b/g },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['node_modules', '.next', 'dist', 'coverage'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && /\.(?:ts|tsx|js|jsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(root, path).split(sep).join('/');
}

const files = (await Promise.all(appRoots.map(walk))).flat();
const violations = [];
let apiClientImports = 0;

for (const file of files) {
  const path = normalize(file);
  const source = await readFile(file, 'utf8');
  if (source.includes('@platform/api-client')) apiClientImports += 1;
  if (allowedFiles.has(path)) continue;
  for (const rule of forbidden) {
    const matches = [...source.matchAll(rule.pattern)];
    for (const match of matches) {
      const line = source.slice(0, match.index).split('\n').length;
      violations.push(`${path}:${line}: ${rule.name}`);
    }
  }
}

console.log(`Shared API client audit: ${files.length} frontend source files`);
console.log(`  @platform/api-client imports: ${apiClientImports}`);
console.log(`  allowlisted transport bridges: ${allowedFiles.size}`);
console.log(`  violations: ${violations.length}`);

if (!apiClientImports) violations.push('No frontend file imports @platform/api-client');

if (violations.length) {
  console.error('\nDirect or duplicate API transport usage:');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exitCode = 1;
}
