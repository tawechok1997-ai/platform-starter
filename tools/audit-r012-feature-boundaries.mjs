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

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const depositContainerPath = 'apps/web-member/app/deposit/deposit-client.tsx';
const depositViewPath = 'apps/web-member/src/features/finance/deposit-view.tsx';
const depositFormPath = 'apps/web-member/src/features/finance/deposit-form.ts';
const queryKeysPath = 'apps/web-member/src/features/finance/query-keys.ts';
const serverStatePath = 'apps/web-member/src/features/finance/use-deposit-server-state.ts';
const withdrawalContainerPath = 'apps/web-member/app/withdraw/page.tsx';
const withdrawalViewPath = 'apps/web-member/src/features/finance/withdrawal-view.tsx';
const financeEntryPath = 'apps/web-member/src/features/finance/index.ts';
const registerContainerPath = 'apps/web-member/app/(auth)/register/page.tsx';
const registerViewPath = 'apps/web-member/src/features/auth/register-view.tsx';
const authEntryPath = 'apps/web-member/src/features/auth/index.ts';
const providerRoutePath = 'apps/web-admin/app/(admin)/game-providers/page.tsx';
const providerFeaturePath = 'apps/web-admin/src/features/finance/game-providers-page.tsx';
const adminFinanceEntryPath = 'apps/web-admin/src/features/finance/index.ts';
const depositContainer = read(depositContainerPath);
const withdrawalContainer = read(withdrawalContainerPath);
const financeEntry = read(financeEntryPath);
const registerContainer = read(registerContainerPath);
const registerView = read(registerViewPath);
const authEntry = read(authEntryPath);
const providerRoute = read(providerRoutePath);
const providerFeature = read(providerFeaturePath);
const adminFinanceEntry = read(adminFinanceEntryPath);

if (!fs.existsSync(depositViewPath)) failures.push('web-member: missing DepositView presentation component');
if (!fs.existsSync(depositFormPath)) failures.push('web-member: missing deposit form contract');
if (!fs.existsSync(queryKeysPath)) failures.push('web-member: missing finance query-key factory');
if (!fs.existsSync(serverStatePath)) failures.push('web-member: missing deposit server-state hook');
if (!depositContainer.includes("from '../../src/features/finance'")) failures.push('web-member: deposit container must import through finance public boundary');
if (!depositContainer.includes('<DepositView')) failures.push('web-member: deposit container must render DepositView');
if (depositContainer.includes('member-finance-flow')) failures.push('web-member: deposit container must not import presentation primitives directly');
for (const symbol of ['DEPOSIT_FORM_DEFAULTS', 'validateDepositSelection', 'serializeDepositCreateRequest', 'serializeDepositEvidenceRequest', 'resolveDepositError', 'useDepositServerState', 'financeInvalidationRules']) if (!depositContainer.includes(symbol)) failures.push(`web-member: deposit container must use ${symbol}`);
for (const localServerState of ['setAccounts(', 'setHistory(', 'useState<ReceivingAccount[]>', 'useState<TopUpItem[]>']) if (depositContainer.includes(localServerState)) failures.push(`web-member: deposit container must not own server state (${localServerState})`);

if (!fs.existsSync(withdrawalViewPath)) failures.push('web-member: missing WithdrawalView presentation component');
if (!withdrawalContainer.includes("import { WithdrawalView } from '../../src/features/finance'")) failures.push('web-member: withdrawal container must import WithdrawalView through finance public boundary');
if (!withdrawalContainer.includes('<WithdrawalView')) failures.push('web-member: withdrawal container must render WithdrawalView');
if (withdrawalContainer.includes('member-finance-flow')) failures.push('web-member: withdrawal container must not import presentation primitives directly');

if (!fs.existsSync(registerViewPath)) failures.push('web-member: missing RegisterView presentation component');
if (!registerContainer.includes("from '../../../src/features/auth'")) failures.push('web-member: register container must import through auth public boundary');
if (!registerContainer.includes('<RegisterView')) failures.push('web-member: register container must render RegisterView');
if (registerContainer.includes('public-auth-card" onSubmit')) failures.push('web-member: register container must not own public auth form markup');
if (registerContainer.includes('AntiBotWidget')) failures.push('web-member: register container must not render captcha directly');
if (registerView.includes('memberApiFetch(')) failures.push('web-member: RegisterView must not own API requests');
if (registerView.includes('useEffect(')) failures.push('web-member: RegisterView must not own route effects');
if (!authEntry.includes("from './register-view'")) failures.push('web-member: auth public boundary must export RegisterView');

if (!fs.existsSync(providerFeaturePath)) failures.push('web-admin: missing game provider feature implementation');
if (!providerRoute.includes("from '../../../src/features/finance/game-providers-page'")) failures.push('web-admin: provider route must delegate to finance feature implementation');
if (providerRoute.includes('adminApiFetch(') || providerRoute.includes('useState(')) failures.push('web-admin: provider route must remain a thin entry point');
if (!providerFeature.includes("from '../../../app/admin-api'")) failures.push('web-admin: provider feature must own provider API orchestration');
if (!adminFinanceEntry.includes("GameProvidersPage") || !adminFinanceEntry.includes("from './game-providers-page'")) failures.push('web-admin: finance public boundary must export GameProvidersPage');

if (!financeEntry.includes("export { DepositView } from './deposit-view'")) failures.push('web-member: finance public boundary must export DepositView');
if (!financeEntry.includes('export { WithdrawalView')) failures.push('web-member: finance public boundary must export WithdrawalView');
if (!financeEntry.includes("from './deposit-form'")) failures.push('web-member: finance public boundary must export deposit form contracts');
if (!financeEntry.includes("from './query-keys'")) failures.push('web-member: finance public boundary must export query-key contracts');
if (!financeEntry.includes("export { useDepositServerState } from './use-deposit-server-state'")) failures.push('web-member: finance public boundary must export deposit server-state hook');

if (failures.length) {
  console.error('R-012 feature-boundary audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('R-012 feature-boundary audit passed.');