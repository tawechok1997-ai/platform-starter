import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const appRoots = [
  { name: 'admin', path: join(root, 'apps', 'web-admin') },
  { name: 'member', path: join(root, 'apps', 'web-member') },
];

const allowedTransportBridges = new Set([
  'apps/web-admin/app/admin-api.ts',
  'apps/web-member/app/member-api.ts',
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

function isServerProxyRoute(path) {
  return /^apps\/web-(?:admin|member)\/app\/api\/.+\/route\.(?:ts|js)$/.test(path);
}

function isAllowedTransportBoundary(path) {
  return allowedTransportBridges.has(path) || isServerProxyRoute(path);
}

const grouped = [];
const allViolations = [];
let totalFiles = 0;
let totalImports = 0;
let existingBridges = 0;

for (const app of appRoots) {
  const files = await walk(app.path);
  const violations = [];
  let apiClientImports = 0;

  for (const file of files) {
    const path = normalize(file);
    const source = await readFile(file, 'utf8');
    if (source.includes('@platform/api-client')) apiClientImports += 1;
    if (isAllowedTransportBoundary(path)) {
      if (allowedTransportBridges.has(path)) existingBridges += 1;
      continue;
    }
    for (const rule of forbidden) {
      for (const match of source.matchAll(rule.pattern)) {
        const line = source.slice(0, match.index).split('\n').length;
        violations.push({ app: app.name, path, line, rule: rule.name });
      }
    }
  }

  grouped.push({ app: app.name, files: files.length, apiClientImports, violations });
  totalFiles += files.length;
  totalImports += apiClientImports;
  allViolations.push(...violations);
}

const result = {
  totalFiles,
  apiClientImports: totalImports,
  existingAllowlistedTransportBridges: existingBridges,
  groups: grouped,
  violations: allViolations,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Shared API client audit: ${totalFiles} frontend source files`);
  console.log(`  @platform/api-client imports: ${totalImports}`);
  console.log(`  existing allowlisted transport bridges: ${existingBridges}`);
  for (const group of grouped) {
    console.log(`  ${group.app}: ${group.files} files, ${group.apiClientImports} imports, ${group.violations.length} violations`);
  }
  console.log(`  violations: ${allViolations.length}`);
}

if (!totalImports) allViolations.push({ app: 'all', path: '-', line: 0, rule: 'No frontend file imports @platform/api-client' });
if (existingBridges !== allowedTransportBridges.size) {
  allViolations.push({ app: 'all', path: '-', line: 0, rule: 'A documented transport bridge is missing' });
}

if (allViolations.length) {
  if (!process.argv.includes('--json')) {
    console.error('\nDirect or duplicate API transport usage:');
    for (const violation of allViolations.sort((a, b) => `${a.path}:${a.line}`.localeCompare(`${b.path}:${b.line}`))) {
      console.error(`  - ${violation.path}:${violation.line}: ${violation.rule}`);
    }
  }
  process.exitCode = 1;
}
