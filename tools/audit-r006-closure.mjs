import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));

const requiredScripts = [
  'lint:api',
  'lint:admin',
  'lint:member',
  'lint:packages',
  'typecheck:api',
  'typecheck:admin',
  'typecheck:member',
  'typecheck:packages',
  'ci:changed-scope',
  'audit:generated-drift',
  'audit:migration-validation',
  'audit:unused-exports',
  'audit:circular-dependencies',
  'audit:browser-quality',
  'audit:architecture-inventory',
  'audit:architecture-boundaries',
  'audit:critical-test-safety',
];

const requiredFiles = [
  'eslint.config.mjs',
  '.prettierrc.json',
  '.prettierignore',
  'tools/ci-changed-scope.mjs',
  'tools/audit-generated-drift.mjs',
  'tools/audit-migration-validation.mjs',
  'tools/audit-unused-exports.mjs',
  'tools/audit-circular-dependencies.mjs',
  'tools/audit-browser-quality-gate.mjs',
  'tests/fixtures/quality-test.ts',
  '.github/workflows/r006-quality.yml',
  'docs/architecture/r006-closure.md',
];

for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json: missing ${script}`);
}

for (const path of requiredFiles) {
  try {
    await access(join(root, path));
  } catch {
    failures.push(`${path}: missing required R-006 baseline file`);
  }
}

const eslintConfig = await readFile(join(root, 'eslint.config.mjs'), 'utf8');
const unusedVarsRule = /['"]@typescript-eslint\/no-unused-vars['"]\s*:\s*\[\s*['"]error['"]/m;
if (!unusedVarsRule.test(eslintConfig)) {
  failures.push('eslint.config.mjs: unused TypeScript symbols must fail lint');
}

const workflow = await readFile(join(root, '.github/workflows/r006-quality.yml'), 'utf8');
for (const marker of [
  'Detect changed scopes',
  'Upload quality failure evidence',
  'if: failure()',
  'actions/upload-artifact@v4',
  'pnpm audit:circular-dependencies',
  'pnpm audit:browser-quality',
  'pnpm audit:architecture-inventory',
  'pnpm audit:architecture-boundaries',
  'pnpm audit:r1-closure',
  'pnpm audit:r2-closure',
  'pnpm audit:r3-closure',
]) {
  if (!workflow.includes(marker)) failures.push(`r006-quality.yml: missing ${marker}`);
}
if (!workflow.includes('Architecture and test-safety guards')) {
  failures.push('r006-quality.yml: critical guards must remain unconditional');
}

const closure = await readFile(join(root, 'docs', 'architecture', 'r006-closure.md'), 'utf8');
if (!closure.includes('Status: **DONE**')) failures.push('r006-closure.md: status is not DONE');

console.log('R-006 CI quality baseline audit:');
console.log(`  required scripts: ${requiredScripts.length}`);
console.log(`  required files: ${requiredFiles.length}`);
console.log('  scoped CI, unused-symbol enforcement, browser/circular/architecture guards and failure evidence: checked');
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nR-006 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
