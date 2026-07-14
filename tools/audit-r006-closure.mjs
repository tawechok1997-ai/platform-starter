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
  '.github/workflows/r006-quality.yml',
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

const workflow = await readFile(join(root, '.github/workflows/r006-quality.yml'), 'utf8');
for (const marker of ['Detect changed scopes', 'Upload quality failure evidence', 'if: failure()', 'actions/upload-artifact@v4']) {
  if (!workflow.includes(marker)) failures.push(`r006-quality.yml: missing ${marker}`);
}
if (!workflow.includes('Architecture and test-safety guards')) {
  failures.push('r006-quality.yml: critical guards must remain unconditional');
}

console.log('R-006 CI quality baseline audit:');
console.log(`  required scripts: ${requiredScripts.length}`);
console.log(`  required files: ${requiredFiles.length}`);
console.log('  scoped CI and failure evidence: checked');
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nR-006 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
