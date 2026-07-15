import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const worklist = await readFile(join(root, 'docs', 'master-project-worklist.md'), 'utf8');

const requiredRootScripts = [
  'audit:architecture-inventory',
  'audit:architecture-boundaries',
  'audit:critical-test-safety',
  'audit:mutation-dto-coverage',
  'audit:critical-controller-types',
  'audit:critical-service-types',
  'audit:error-code-catalog',
  'audit:critical-error-contracts',
  'audit:admin-permissions',
  'audit:admin-ui-permissions',
  'audit:master-worklist',
];

const requiredEvidenceFiles = [
  'docs/architecture/module-map.md',
  'docs/architecture/dependency-map.md',
  'docs/architecture/route-ownership.md',
  'docs/architecture/test-inventory.md',
  'docs/architecture/r001-closure.md',
  'docs/architecture/r003-closure.md',
];

const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
for (const script of requiredRootScripts) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json: missing ${script}`);
}

for (const path of requiredEvidenceFiles) {
  try {
    await access(join(root, path));
  } catch {
    failures.push(`${path}: missing required P4 evidence`);
  }
}

const p4Start = worklist.indexOf('# P4 —');
const p5Start = worklist.indexOf('# P5 —');
if (p4Start < 0 || p5Start < 0 || p5Start <= p4Start) {
  failures.push('master-project-worklist.md: cannot locate P4 section');
} else {
  const p4 = worklist.slice(p4Start, p5Start);
  for (const heading of ['## R-001 ถึง R-012', '## R-013 UI system', '## R-014 Observability']) {
    if (!p4.includes(heading)) failures.push(`master-project-worklist.md: missing ${heading}`);
  }

  const unchecked = [...p4.matchAll(/^- \[ \]/gm)].length;
  console.log(`P4 closure audit: ${unchecked} unchecked code items`);
  if (unchecked > 0) failures.push(`P4 is not closable: ${unchecked} code items remain`);
}

console.log(`  required scripts: ${requiredRootScripts.length}`);
console.log(`  required evidence files: ${requiredEvidenceFiles.length}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nP4 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
