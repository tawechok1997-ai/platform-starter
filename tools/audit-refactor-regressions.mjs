import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(toolDirectory, '..');
const failures = [];

async function read(relativePath) {
  try {
    return await readFile(join(root, relativePath), 'utf8');
  } catch {
    failures.push(`missing required file: ${relativePath}`);
    return '';
  }
}

async function requireReadable(relativePath) {
  try {
    await access(join(root, relativePath), constants.R_OK);
  } catch {
    failures.push(`file is not readable: ${relativePath}`);
  }
}

await Promise.all([
  requireReadable('tools/check-api-build-artifact.mjs'),
  requireReadable('apps/api/tsconfig.strict-next.json'),
  requireReadable('docs/master-worklist.md'),
  requireReadable('docs/master-project-worklist.md'),
]);

const strictConfigText = await read('apps/api/tsconfig.strict-next.json');
if (strictConfigText) {
  const strictConfig = JSON.parse(strictConfigText);
  const options = strictConfig.compilerOptions ?? {};
  if (options.noEmit !== true) failures.push('strict-next config must set noEmit=true');
  if (options.noUncheckedIndexedAccess !== true) failures.push('strict-next config must enable noUncheckedIndexedAccess');
  if (options.exactOptionalPropertyTypes !== true) failures.push('strict-next config must enable exactOptionalPropertyTypes');
  if (!Array.isArray(strictConfig.include) || strictConfig.include.length === 0) failures.push('strict-next config must include at least one migrated module');
}

const nestConfigText = await read('packages/config/typescript/nest.json');
if (nestConfigText) {
  const nestConfig = JSON.parse(nestConfigText);
  const options = nestConfig.compilerOptions ?? {};
  if (options.noEmit !== false) failures.push('Nest config must keep noEmit=false');
}

const depositView = await read('apps/web-member/src/features/finance/deposit-view.tsx');
const withdrawalView = await read('apps/web-member/src/features/finance/withdrawal-view.tsx');
for (const [name, source] of [['deposit-view', depositView], ['withdrawal-view', withdrawalView]]) {
  if (source.includes("app/components/member-finance-flow")) {
    failures.push(`${name} must import finance UI from the feature boundary, not app/components`);
  }
}

const financeBridge = await read('apps/web-member/app/components/member-finance-flow.tsx');
if (financeBridge && !financeBridge.includes('src/features/finance')) {
  failures.push('member-finance-flow compatibility bridge must re-export from src/features/finance');
}

const worklistEntry = await read('docs/master-worklist.md');
if (worklistEntry) {
  if (!worklistEntry.includes('./master-project-worklist.md')) failures.push('master-worklist entry point must reference the canonical worklist');
  if (/^- \[[ xX]\]/m.test(worklistEntry)) failures.push('master-worklist entry point must not duplicate work checkboxes');
}

console.log('Refactor regression audit');
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nRefactor regression violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
