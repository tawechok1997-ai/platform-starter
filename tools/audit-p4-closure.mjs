import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const worklistPath = join(root, 'docs', 'master-project-worklist.md');
const failures = [];
const worklist = await readFile(worklistPath, 'utf8');

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
  for (let index = 1; index <= 14; index += 1) {
    const id = `R-${String(index).padStart(3, '0')}`;
    if (!p4.includes(`### ${id} `)) failures.push(`master-project-worklist.md: missing ${id}`);
  }

  const doneCount = [...p4.matchAll(/สถานะ:\s*✅ DONE/g)].length;
  const partialCount = [...p4.matchAll(/สถานะ:\s*🟡 PARTIAL/g)].length;
  const todoCount = [...p4.matchAll(/สถานะ:\s*🔴 TODO/g)].length;
  console.log(`P4 closure audit: ${doneCount} DONE, ${partialCount} PARTIAL, ${todoCount} TODO`);

  if (partialCount > 0 || todoCount > 0) {
    failures.push(`P4 is not closable: ${partialCount} PARTIAL and ${todoCount} TODO work items remain`);
  }

  const uncheckedDefinitionOfDone = p4
    .slice(p4.indexOf('## P4 Definition of Done'), p4.indexOf('## P4-A'))
    .split('\n')
    .filter((line) => line.trim().startsWith('- [ ]'));
  if (uncheckedDefinitionOfDone.length > 0) {
    failures.push(`P4 Definition of Done has ${uncheckedDefinitionOfDone.length} unchecked items`);
  }
}

console.log(`  required scripts: ${requiredRootScripts.length}`);
console.log(`  required evidence files: ${requiredEvidenceFiles.length}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nP4 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
