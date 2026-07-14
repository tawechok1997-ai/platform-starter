import { access, readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const appRoots = [
  { name: 'admin', path: join(root, 'apps', 'web-admin') },
  { name: 'member', path: join(root, 'apps', 'web-member') },
];

// Temporary transport bridges must stay tiny and explicit. Remove entries as each
// app is migrated. A listed file that does not exist is ignored rather than
// pretending it protects anything.
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

function appName(path) {
  return path.startsWith('apps/web-admin/') ? 'admin' : 'member';
}

const files = (await Promise.all(appRoots.map(({ path }) => walk(path)))).flat();
const violations = [];
const appStats = {
  admin: { files: 0, imports: 0, violations: 0 },
  member: { files: 0, imports: 0, violations: 0 },
};
let apiClientImports = 0;

for (const file of files) {
  const path = normalize(file);
  const source = await readFile(file, 'utf8');
  const app = appName(path);
  appStats[app].files += 1;
  if (source.includes('@platform/api-client')) {
    apiClientImports += 1;
    appStats[app].imports += 1;
  }
  if (allowedFiles.has(path)) continue;
  for (const rule of forbidden) {
    const matches = [...source.matchAll(rule.pattern)];
    for (const match of matches) {
      const line = source.slice(0, match.index).split('\n').length;
      violations.push({ path, line, rule: rule.name, app });
      appStats[app].violations += 1;
    }
  }
}

const existingAllowlist = [];
for (const path of [...allowedFiles].sort()) {
  try {
    await access(join(root, path));
    existingAllowlist.push(path);
  } catch {
    // Missing historical bridge paths are deliberately not counted as coverage.
  }
}

violations.sort((left, right) => left.path.localeCompare(right.path) || left.line - right.line || left.rule.localeCompare(right.rule));

console.log(`Shared API client audit: ${files.length} frontend source files`);
console.log(`  @platform/api-client imports: ${apiClientImports}`);
console.log(`  existing allowlisted transport bridges: ${existingAllowlist.length}`);
console.log(`  admin: ${appStats.admin.files} files, ${appStats.admin.imports} imports, ${appStats.admin.violations} violations`);
console.log(`  member: ${appStats.member.files} files, ${appStats.member.imports} imports, ${appStats.member.violations} violations`);
console.log(`  violations: ${violations.length}`);

if (!apiClientImports) {
  violations.push({ path: '(frontend)', line: 0, rule: 'No frontend file imports @platform/api-client', app: 'all' });
}

if (process.env.API_CLIENT_AUDIT_JSON === '1') {
  console.log(JSON.stringify({ files: files.length, apiClientImports, existingAllowlist, appStats, violations }, null, 2));
}

if (violations.length) {
  console.error('\nDirect or duplicate API transport usage:');
  for (const violation of violations) {
    const location = violation.line ? `${violation.path}:${violation.line}` : violation.path;
    console.error(`  - ${location}: ${violation.rule}`);
  }
  process.exitCode = 1;
}
