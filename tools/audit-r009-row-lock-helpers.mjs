import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const helperPath = path.join(ROOT, 'apps/api/src/common/infrastructure/prisma-row-locks.ts');
const adapterPaths = [
  'apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts',
  'apps/api/src/common/infrastructure/prisma-admin-ownership-repository.adapter.ts',
];

const requiredHelpers = [
  'lockTopUpRequestForUpdate',
  'lockWithdrawalRequestForUpdate',
  'lockAdminUserForUpdate',
  'lockActiveOwnerAdminIds',
];

const failures = [];
if (!fs.existsSync(helperPath)) failures.push('missing prisma-row-locks.ts');
const helper = fs.existsSync(helperPath) ? fs.readFileSync(helperPath, 'utf8') : '';
for (const name of requiredHelpers) {
  if (!helper.includes(`export function ${name}`) && !helper.includes(`export async function ${name}`)) {
    failures.push(`missing helper ${name}`);
  }
}
if (!helper.includes('FOR UPDATE')) failures.push('row-lock helper file does not issue FOR UPDATE');

for (const relativePath of adapterPaths) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing adapter ${relativePath}`);
    continue;
  }
  const source = fs.readFileSync(fullPath, 'utf8');
  if (source.includes('$queryRaw')) failures.push(`${relativePath} still contains direct raw row-lock SQL`);
  if (!source.includes("from './prisma-row-locks'")) failures.push(`${relativePath} does not import row-lock helpers`);
}

if (failures.length > 0) {
  console.error('R-009 row-lock helper audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-009 row-lock helper audit passed for finance and ownership adapters.');
