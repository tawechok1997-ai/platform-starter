import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const boundary = await readFile(join(root, 'tools', 'audit-architecture-boundaries.mjs'), 'utf8');
const dependencyMap = await readFile(join(root, 'docs', 'architecture', 'dependency-map.md'), 'utf8');
const registry = await readFile(join(root, 'docs', 'architecture', 'boundary-exceptions.md'), 'utf8');
const workflow = await readFile(join(root, '.github', 'workflows', 'build.yml'), 'utf8');
const closure = await readFile(join(root, 'docs', 'architecture', 'r002-closure.md'), 'utf8');

for (const path of ['docs/architecture/dependency-map.md', 'docs/architecture/boundary-exceptions.md', 'tools/audit-architecture-boundaries.mjs']) {
  try { await access(join(root, path)); } catch { failures.push(`${path}: missing`); }
}
for (const marker of ['## Intended direction', '## Approved cross-module relationships', '## Public module contracts', '## Prohibited relationships', '## Enforcement']) {
  if (!dependencyMap.includes(marker)) failures.push(`dependency-map.md: missing ${marker}`);
}
for (const marker of ['DOMAIN_FORBIDDEN_IMPORTS', 'PRIVATE_CROSS_MODULE_SEGMENTS', 'boundary-exceptions.md', 'invalid/expired exceptions']) {
  if (!boundary.includes(marker)) failures.push(`audit-architecture-boundaries.mjs: missing ${marker}`);
}
if (!registry.includes('no active boundary exceptions')) failures.push('boundary-exceptions.md: active state is not explicit');
if (!pkg.scripts?.['audit:architecture-boundaries']) failures.push('package.json: missing audit:architecture-boundaries');
if (!workflow.includes('pnpm audit:architecture-boundaries')) failures.push('build.yml: boundary audit is not enforced');
if (!closure.includes('Status: **DONE**')) failures.push('r002-closure.md: status is not DONE');

console.log(`R-002 closure audit: ${failures.length} failure(s)`);
if (failures.length) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
