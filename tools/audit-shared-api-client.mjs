import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const appRoots = [
  { name: 'admin', path: join(root, 'apps', 'web-admin') },
  { name: 'member', path: join(root, 'apps', 'web-member') },
];
const packageRoot = join(root, 'packages', 'api-client');

const allowedTransportBridges = new Set([
  'apps/web-admin/app/admin-api.ts',
  'apps/web-member/app/member-api.ts',
]);

const forbidden = [
  { name: 'direct fetch', pattern: /\bfetch\s*\(/g },
  { name: 'axios import/use', pattern: /\baxios\b/g },
  { name: 'duplicate adminFetch helper', pattern: /\b(?:function|const)\s+adminFetch\b/g },
  { name: 'duplicate memberFetch helper', pattern: /\b(?:function|const)\s+memberFetch\b/g },
  { name: 'duplicate fetchJson helper', pattern: /\b(?:function|const)\s+fetchJson\b/g },
];

const forbiddenPackageBoundaries = [
  { name: 'shared package imports application code', pattern: /(?:from\s+|import\s*\()\s*['"][^'"]*(?:apps\/|web-admin|web-member)/g },
  { name: 'shared package reads process.env', pattern: /\bprocess\.env\b/g },
  { name: 'shared package imports Prisma', pattern: /@prisma\/client|\bPrismaClient\b/g },
  { name: 'shared package imports Node filesystem', pattern: /node:fs|['"]fs['"]/g },
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

function findViolations(source, path, rules, extra = {}) {
  const violations = [];
  for (const rule of rules) {
    for (const match of source.matchAll(rule.pattern)) {
      const line = source.slice(0, match.index).split('\n').length;
      violations.push({ path, line, rule: rule.name, ...extra });
    }
  }
  return violations;
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
    violations.push(...findViolations(source, path, forbidden, { app: app.name }));
  }

  grouped.push({ app: app.name, files: files.length, apiClientImports, violations });
  totalFiles += files.length;
  totalImports += apiClientImports;
  allViolations.push(...violations);
}

const packageFiles = await walk(packageRoot);
const packageViolations = [];
for (const file of packageFiles) {
  const path = normalize(file);
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) continue;
  const source = await readFile(file, 'utf8');
  packageViolations.push(...findViolations(source, path, forbiddenPackageBoundaries, { app: 'api-client' }));
}
allViolations.push(...packageViolations);

const result = {
  totalFiles,
  apiClientImports: totalImports,
  existingAllowlistedTransportBridges: existingBridges,
  sharedPackageFiles: packageFiles.length,
  sharedPackageBoundaryViolations: packageViolations,
  groups: grouped,
  violations: allViolations,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Shared API client audit: ${totalFiles} frontend source files`);
  console.log(`  @platform/api-client imports: ${totalImports}`);
  console.log(`  existing allowlisted transport bridges: ${existingBridges}`);
  console.log(`  shared package source files: ${packageFiles.length}`);
  console.log(`  shared package boundary violations: ${packageViolations.length}`);
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
    console.error('\nShared API client boundary violations:');
    for (const violation of allViolations.sort((a, b) => `${a.path}:${a.line}`.localeCompare(`${b.path}:${b.line}`))) {
      console.error(`  - ${violation.path}:${violation.line}: ${violation.rule}`);
    }
  }
  process.exitCode = 1;
}
