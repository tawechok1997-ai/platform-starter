import fs from 'node:fs';

const tokenPath = 'packages/design-tokens/shape-space-shadow.css';
const adminLayoutPath = 'apps/web-admin/app/layout.tsx';
const memberLayoutPath = 'apps/web-member/app/layout.tsx';
const adminAliasPath = 'apps/web-admin/app/admin-color-aliases.css';
const memberAliasPath = 'apps/web-member/app/member-color-aliases.css';

const read = (path) => fs.readFileSync(path, 'utf8');
const tokens = read(tokenPath);
const adminLayout = read(adminLayoutPath);
const memberLayout = read(memberLayoutPath);
const adminAliases = read(adminAliasPath);
const memberAliases = read(memberAliasPath);
const failures = [];

for (const token of [
  '--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8',
  '--radius-control', '--radius-card', '--radius-card-lg', '--radius-card-xl', '--radius-pill',
  '--shadow-card', '--shadow-card-raised', '--shadow-drawer', '--shadow-overlay', '--shadow-focus-brand',
]) {
  if (!tokens.includes(`${token}:`)) failures.push(`missing shared token ${token}`);
}

const sharedImport = "../../../packages/design-tokens/shape-space-shadow.css";
if (!adminLayout.includes(sharedImport)) failures.push('Admin layout does not import the shared shape/space/shadow contract');
if (!memberLayout.includes(sharedImport)) failures.push('Member layout does not import the shared shape/space/shadow contract');

if (!adminAliases.includes('--radius: var(--radius-card);')) failures.push('Admin radius alias is not mapped to the shared contract');
if (!adminAliases.includes('--shadow: var(--shadow-card);')) failures.push('Admin shadow alias is not mapped to the shared contract');
if (!memberAliases.includes('--radius: var(--radius-card-lg);')) failures.push('Member radius alias is not mapped to the shared contract');
if (!memberAliases.includes('--shadow: var(--shadow-card-raised);')) failures.push('Member shadow alias is not mapped to the shared contract');

for (const [name, content] of [['Admin aliases', adminAliases], ['Member aliases', memberAliases]]) {
  if (/--([\w-]+):\s*var\(--\1\)/.test(content)) failures.push(`${name} contain a self-referencing custom property`);
}

if (failures.length) {
  console.error('R-013 shape/space/shadow contract audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-013 shape/space/shadow contract audit passed.');
