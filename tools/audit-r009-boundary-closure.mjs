import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const requiredFiles = [
  'tools/audit-r009-repository-boundaries.mjs',
  'tools/audit-r009-lock-order.mjs',
  'docs/architecture/r009-repository-boundaries.md',
  'docs/architecture/transaction-lock-order.md',
  'docs/evidence/r009-repository-type-boundary.md',
  'docs/evidence/r009-lock-order-boundary.md',
  '.github/workflows/r006-quality.yml',
  'package.json',
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, file))) failures.push(`missing required file: ${file}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

if (failures.length === 0) {
  const packageJson = JSON.parse(read('package.json'));
  const scripts = packageJson.scripts ?? {};
  if (!scripts['audit:r9-repository-boundaries:strict']) {
    failures.push('missing audit:r9-repository-boundaries:strict script');
  }
  if (!scripts['audit:r9-lock-order:strict']) {
    failures.push('missing audit:r9-lock-order:strict script');
  }

  const workflow = read('.github/workflows/r006-quality.yml');
  for (const command of [
    'pnpm audit:r9-repository-boundaries:strict',
    'pnpm audit:r9-lock-order:strict',
    'pnpm audit:r9-boundary-closure',
  ]) {
    if (!workflow.includes(command)) failures.push(`quality workflow does not run: ${command}`);
  }

  const repositoryAudit = read('tools/audit-r009-repository-boundaries.mjs');
  if (!repositoryAudit.includes('STRICT_MODE && violations.length > 0')) {
    failures.push('repository strict audit does not fail on violations');
  }

  const lockAudit = read('tools/audit-r009-lock-order.mjs');
  if (!lockAudit.includes('inversions.length > 0 || unknown.length > 0')) {
    failures.push('lock strict audit does not fail on inversions and unknown tables');
  }
}

if (failures.length > 0) {
  console.error('R-009 boundary closure audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('R-009 boundary closure structure is enforced.');
  console.log('- Repository/application contracts have a strict Prisma-leakage guard.');
  console.log('- Lock ordering has a strict inversion and unclassified-table guard.');
  console.log('- Both guards and this closure audit are required by the quality workflow.');
}
