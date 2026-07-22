import { readFile } from 'node:fs/promises';

const files = {
  contract: 'packages/design-tokens/data-display.css',
  adminLayout: 'apps/web-admin/app/layout.tsx',
  memberLayout: 'apps/web-member/app/layout.tsx',
  adminSystem: 'apps/web-admin/app/admin-system.css',
  memberFinance: 'apps/web-member/src/features/finance/finance-components.tsx',
};

const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])));
const failures = [];
const requireText = (key, value, label = value) => { if (!source[key].includes(value)) failures.push(`${key}: missing ${label}`); };

for (const selector of ['.ui-table-wrap', '.ui-table', '.ui-pagination', '.ui-pagination__controls', '.ui-tabs', '.ui-tab', '.ui-badge', '.ui-badge--success', '.ui-badge--warning', '.ui-badge--danger']) requireText('contract', selector);
for (const semantic of ['[aria-current="page"]', '[aria-selected="true"]', 'data-mobile="cards"', 'content: attr(data-label)']) requireText('contract', semantic);
for (const key of ['adminLayout', 'memberLayout']) requireText(key, 'packages/design-tokens/data-display.css', 'shared data-display import');
requireText('contract', '.admin-ui-badge', 'Admin compatibility badge selector');
requireText('contract', '.finance-status', 'Member compatibility badge selector');
requireText('adminSystem', '.admin-ui-badge', 'existing Admin badge usage');
requireText('memberFinance', 'finance-status', 'existing Member status badge usage');

if (failures.length) {
  console.error('R-013 data-display primitive contract failed:\n' + failures.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log('R-013 data-display primitive contract passed.');
