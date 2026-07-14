import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const workflow = await readFile(join(root, '.github', 'workflows', 'build.yml'), 'utf8');
const closure = await readFile(join(root, 'docs', 'architecture', 'r001-closure.md'), 'utf8');

for (const path of [
  'docs/architecture/module-map.md',
  'docs/architecture/dependency-map.md',
  'docs/architecture/route-ownership.md',
  'tools/audit-architecture-inventory.mjs',
  'tools/audit-architecture-boundaries.mjs',
]) {
  try { await access(join(root, path)); } catch { failures.push(`${path}: missing`); }
}
for (const script of ['audit:architecture-inventory', 'audit:architecture-boundaries']) {
  if (!pkg.scripts?.[script]) failures.push(`package.json: missing ${script}`);
}
for (const marker of ['pnpm audit:architecture-inventory', 'pnpm audit:architecture-boundaries']) {
  if (!workflow.includes(marker)) failures.push(`build.yml: missing ${marker}`);
}
if (!closure.includes('Status: **DONE**')) failures.push('r001-closure.md: status is not DONE');

console.log(`R-001 closure audit: ${failures.length} failure(s)`);
if (failures.length) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
