import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const checks = [
  'audit:mutation-dto-coverage',
  'audit:critical-controller-types',
  'audit:critical-service-types',
  'audit:api-response-safety',
  'audit:error-code-catalog',
  'audit:critical-error-contracts',
  'typecheck:api',
];

const [baseTsconfig, main, workflow] = await Promise.all([
  readFile(join(root, 'tsconfig.base.json'), 'utf8'),
  readFile(join(root, 'apps/api/src/main.ts'), 'utf8'),
  readFile(join(root, '.github/workflows/build.yml'), 'utf8'),
]);

const staticViolations = [];
if (!baseTsconfig.includes('"strict": true')) staticViolations.push('tsconfig.base.json must enable strict mode');
if (!main.includes('whitelist: true')) staticViolations.push('ValidationPipe whitelist must be enabled');
if (!main.includes('transform: true')) staticViolations.push('ValidationPipe transform must be enabled');
if (!main.includes('SensitiveResponseInterceptor')) staticViolations.push('global sensitive response interceptor missing');
for (const marker of [
  'Audit mutation DTO coverage',
  'Audit critical controller types',
  'Audit critical service types',
  'Audit API response safety',
  'Audit error code catalog',
  'Audit critical error contracts',
  'Typecheck API',
]) {
  if (!workflow.includes(marker)) staticViolations.push(`build.yml missing ${marker}`);
}

const failedCommands = [];
for (const check of checks) {
  console.log(`\n[R-004] pnpm ${check}`);
  const result = spawnSync('pnpm', [check], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) failedCommands.push(check);
}

console.log('\nR-004 closure audit');
console.log(`  automated checks: ${checks.length}`);
console.log(`  failed commands: ${failedCommands.length}`);
console.log(`  static violations: ${staticViolations.length}`);

for (const check of failedCommands) console.error(`  - pnpm ${check} failed`);
for (const violation of staticViolations) console.error(`  - ${violation}`);
if (failedCommands.length || staticViolations.length) process.exitCode = 1;
