import { readFile } from 'node:fs/promises';

const files = {
  contract: 'packages/design-tokens/feedback.css',
  adminLayout: 'apps/web-admin/app/layout.tsx',
  memberLayout: 'apps/web-member/app/layout.tsx',
  adminSystem: 'apps/web-admin/app/admin-system.css',
  memberFinance: 'apps/web-member/src/features/finance/finance-components.tsx',
};

const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])));
const failures = [];
const requireText = (key, value, label = value) => { if (!source[key].includes(value)) failures.push(`${key}: missing ${label}`); };

for (const selector of ['.ui-toast-region', '.ui-toast', '.ui-alert', '.ui-alert--info', '.ui-alert--success', '.ui-alert--warning', '.ui-alert--danger', '.ui-skeleton', '.ui-empty-state', '.ui-error-state', '.ui-state-actions']) requireText('contract', selector);
for (const key of ['adminLayout', 'memberLayout']) requireText(key, 'packages/design-tokens/feedback.css', 'shared feedback import');
for (const selector of ['.admin-ui-notice', '.admin-ui-empty', '.admin-ui-skeleton', '.finance-empty-state', '.member-ui-notice']) requireText('contract', selector, `compatibility selector ${selector}`);
for (const selector of ['.admin-ui-notice', '.admin-ui-empty', '.admin-ui-skeleton']) requireText('adminSystem', selector, `existing Admin state ${selector}`);
requireText('memberFinance', 'finance-empty-state', 'existing Member empty state');
requireText('contract', '@media (prefers-reduced-motion: reduce)', 'reduced-motion fallback');
requireText('contract', 'z-index: var(--z-toast)', 'toast z-index token');

if (failures.length) {
  console.error('R-013 feedback primitive contract failed:\n' + failures.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log('R-013 feedback primitive contract passed.');
