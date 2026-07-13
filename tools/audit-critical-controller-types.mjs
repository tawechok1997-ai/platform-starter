import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'api', 'src', 'modules');
const CRITICAL_MODULES = new Set([
  'admin-access',
  'admin-auth',
  'finance',
  'withdrawals',
  'risk-alerts',
  'support',
  'promotions',
  'game-platform',
  'money-ops',
]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.controller.ts')) files.push(path);
  }
  return files;
}

function moduleName(file) {
  return relative(ROOT, file).split(sep)[0];
}

const violations = [];
const files = await walk(ROOT);
for (const file of files) {
  const owner = moduleName(file);
  if (!CRITICAL_MODULES.has(owner)) continue;
  const source = await readFile(file, 'utf8');
  const lines = source.split('\n');
  lines.forEach((line, index) => {
    if (/@CurrentUser\(\)\s+\w+\s*:\s*any\b/.test(line)) {
      violations.push({ file, line: index + 1, kind: 'current-user-any' });
    }
    if (/@Req\(\)\s+\w+\s*:\s*any\b/.test(line)) {
      violations.push({ file, line: index + 1, kind: 'request-any' });
    }
    if (/@Query\(\)\s+\w+\s*:\s*any\b/.test(line)) {
      violations.push({ file, line: index + 1, kind: 'query-any' });
    }
  });
}

console.log(`Critical controller type audit: ${files.length} controller files scanned`);
console.log(`  violations: ${violations.length}`);

if (violations.length) {
  console.error('\nUntyped actors, requests, or queries in critical controllers:');
  for (const item of violations) {
    console.error(`  - ${relative(process.cwd(), item.file)}:${item.line} (${item.kind})`);
  }
  process.exitCode = 1;
}
