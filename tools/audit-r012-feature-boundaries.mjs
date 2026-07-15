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
const depositFormPath = 'apps/web-member/src/features/finance/deposit-form.ts';
const queryKeysPath = 'apps/web-member/src/features/finance/query-keys.ts';
const serverStatePath = 'apps/web-member/src/features/finance/use-deposit-server-state.ts';
const withdrawalContainerPath = 'apps/web-member/app/withdraw/page.tsx';
const withdrawalViewPath = 'apps/web-member/src/features/finance/withdrawal-view.tsx';
const financeEntryPath = 'apps/web-member/src/features/finance/index.ts';
const depositContainer = fs.existsSync(depositContainerPath) ? fs.readFileSync(depositContainerPath, 'utf8') : '';
const withdrawalContainer = fs.existsSync(withdrawalContainerPath) ? fs.readFileSync(withdrawalContainerPath, 'utf8') : '';
const financeEntry = fs.existsSync(financeEntryPath) ? fs.readFileSync(financeEntryPath, 'utf8') : '';

if (!fs.existsSync(depositViewPath)) failures.push('web-member: missing DepositView presentation component');
if (!fs.existsSync(depositFormPath)) failures.push('web-member: missing deposit form contract');
if (!fs.existsSync(queryKeysPath)) failures.push('web-member: missing finance query-key factory');
if (!fs.existsSync(serverStatePath)) failures.push('web-member: missing deposit server-state hook');
if (!depositContainer.includes("from '../../src/features/finance'")) failures.push('web-member: deposit container must import through finance public boundary');
if (!depositContainer.includes('<DepositView')) failures.push('web-member: deposit container must render DepositView');
if (depositContainer.includes('member-finance-flow')) failures.push('web-member: deposit container must not import presentation primitives directly');
for (const symbol of ['DEPOSIT_FORM_DEFAULTS', 'validateDepositSelection', 'serializeDepositCreateRequest', 'serializeDepositEvidenceRequest', 'resolveDepositError', 'useDepositServerState', 'financeInvalidationRules']) {
  if (!depositContainer.includes(symbol)) failures.push(`web-member: deposit container must use ${symbol}`);
}
for (const localServerState of ['setAccounts(', 'setHistory(', 'useState<ReceivingAccount[]>', 'useState<TopUpItem[]>']) {
  if (depositContainer.includes(localServerState)) failures.push(`web-member: deposit container must not own server state (${localServerState})`);
}

if (!fs.existsSync(withdrawalViewPath)) failures.push('web-member: missing WithdrawalView presentation component');
if (!withdrawalContainer.includes("import { WithdrawalView } from '../../src/features/finance'")) failures.push('web-member: withdrawal container must import WithdrawalView through finance public boundary');
if (!withdrawalContainer.includes('<WithdrawalView')) failures.push('web-member: withdrawal container must render WithdrawalView');
if (withdrawalContainer.includes('member-finance-flow')) failures.push('web-member: withdrawal container must not import presentation primitives directly');

if (!financeEntry.includes("export { DepositView } from './deposit-view'")) failures.push('web-member: finance public boundary must export DepositView');
if (!financeEntry.includes("export { WithdrawalView")) failures.push('web-member: finance public boundary must export WithdrawalView');
if (!financeEntry.includes("from './deposit-form'")) failures.push('web-member: finance public boundary must export deposit form contracts');
if (!financeEntry.includes("from './query-keys'")) failures.push('web-member: finance public boundary must export query-key contracts');
if (!financeEntry.includes("export { useDepositServerState } from './use-deposit-server-state'")) failures.push('web-member: finance public boundary must export deposit server-state hook');

if (failures.length) {
  console.error('R-012 feature-boundary audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('R-012 feature-boundary audit passed.');
