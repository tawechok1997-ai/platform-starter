import fs from 'node:fs';
import path from 'node:path';

const apps = ['web-admin', 'web-member'];
const domains = ['auth', 'finance', 'kyc', 'support', 'cms'];
const failures = [];

for (const app of apps) {
  const root = path.join('apps', app, 'src', 'features');
  const barrel = path.join(root, 'index.ts');
  if (!fs.existsSync(barrel)) failures.push(`${app}: missing feature public barrel`);
  const source = fs.existsSync(barrel) ? fs.readFileSync(barrel, 'utf8') : '';
  for (const domain of domains) {
    const entry = path.join(root, domain, 'index.ts');
    if (!fs.existsSync(entry)) failures.push(`${app}: missing ${domain} public entry`);
    if (!source.includes(`'./${domain}'`)) failures.push(`${app}: barrel does not export ${domain}`);
  }
}

const depositContainerPath = 'apps/web-member/app/deposit/deposit-client.tsx';
const depositViewPath = 'apps/web-member/src/features/finance/deposit-view.tsx';
const financeEntryPath = 'apps/web-member/src/features/finance/index.ts';
const depositContainer = fs.existsSync(depositContainerPath) ? fs.readFileSync(depositContainerPath, 'utf8') : '';
const financeEntry = fs.existsSync(financeEntryPath) ? fs.readFileSync(financeEntryPath, 'utf8') : '';

if (!fs.existsSync(depositViewPath)) failures.push('web-member: missing DepositView presentation component');
if (!depositContainer.includes("import { DepositView } from '../../src/features/finance'")) failures.push('web-member: deposit container must import DepositView through finance public boundary');
if (!depositContainer.includes('<DepositView')) failures.push('web-member: deposit container must render DepositView');
if (depositContainer.includes('member-finance-flow')) failures.push('web-member: deposit container must not import presentation primitives directly');
if (!financeEntry.includes("export { DepositView } from './deposit-view'")) failures.push('web-member: finance public boundary must export DepositView');

if (failures.length) {
  console.error('R-012 feature-boundary audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('R-012 feature-boundary audit passed.');
