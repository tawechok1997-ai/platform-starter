import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const worklist = await readFile(join(root, 'docs', 'master-project-worklist.md'), 'utf8');

const start = worklist.indexOf('### R-007 Backend service decomposition');
const end = worklist.indexOf('### R-008 Domain model', start);
if (start < 0 || end < 0) {
  failures.push('master-project-worklist.md: cannot locate complete R-007 section');
} else {
  const section = worklist.slice(start, end);
  if (!section.includes('สถานะ: ✅ DONE')) {
    failures.push('R-007 status is not ✅ DONE');
  }
  const unchecked = section.split('\n').filter((line) => line.trim().startsWith('- [ ]'));
  if (unchecked.length) failures.push(`R-007 still has ${unchecked.length} unchecked work items`);
}

const requiredEvidence = [
  'docs/architecture/backend-decomposition-policy.md',
  'docs/architecture/r007-progress.md',
  'tools/audit-backend-decomposition.mjs',
  'apps/api/src/modules/finance/finance-summary-query.service.ts',
  'apps/api/src/modules/finance/finance-reports-query.service.ts',
  'apps/api/src/modules/finance/finance-report.mapper.ts',
  'apps/api/src/modules/finance/finance-report.mapper.spec.ts',
];

for (const path of requiredEvidence) {
  try {
    await access(join(root, path));
  } catch {
    failures.push(`${path}: missing R-007 evidence`);
  }
}

console.log('R-007 backend decomposition closure audit:');
console.log(`  required evidence files: ${requiredEvidence.length}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nR-007 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
