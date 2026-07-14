import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const requiredFiles = [
  'tools/audit-r009-controller-prisma.mjs',
  'docs/evidence/r009-controller-persistence-closure.md',
  '.github/workflows/r006-quality.yml',
];

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(file));
if (missingFiles.length > 0) {
  console.error(`R-009 controller closure failed: missing ${missingFiles.join(', ')}`);
  process.exit(1);
}

const audit = spawnSync(process.execPath, ['tools/audit-r009-controller-prisma.mjs'], {
  env: { ...process.env, R009_STRICT: '1', R009_JSON: '1' },
  encoding: 'utf8',
});

if (audit.status !== 0) {
  process.stderr.write(audit.stderr || audit.stdout);
  process.exit(audit.status ?? 1);
}

let result;
try {
  result = JSON.parse(audit.stdout);
} catch {
  console.error('R-009 controller closure failed: strict audit did not return valid JSON.');
  process.exit(1);
}

if (result.offendingControllers !== 0 || result.offenders?.length) {
  console.error('R-009 controller closure failed: direct Prisma usage remains in controllers.');
  process.exit(1);
}

const workflow = fs.readFileSync('.github/workflows/r006-quality.yml', 'utf8');
if (!workflow.includes('pnpm audit:r9-controller-prisma:strict')) {
  console.error('R-009 controller closure failed: strict controller guard is not wired into CI.');
  process.exit(1);
}

console.log(`R-009 controller persistence closure passed: ${result.scannedControllers} controller(s), zero direct Prisma offenders, strict CI guard enabled.`);
