import fs from 'node:fs';

const files = {
  shared: 'packages/design-tokens/colors.css',
  adminLayout: 'apps/web-admin/app/layout.tsx',
  memberLayout: 'apps/web-member/app/layout.tsx',
  adminAliases: 'apps/web-admin/app/admin-color-aliases.css',
  memberAliases: 'apps/web-member/app/member-color-aliases.css',
};

const failures = [];
const read = (path) => {
  if (!fs.existsSync(path)) {
    failures.push(`missing ${path}`);
    return '';
  }
  return fs.readFileSync(path, 'utf8');
};

const shared = read(files.shared);
const adminLayout = read(files.adminLayout);
const memberLayout = read(files.memberLayout);
const adminAliases = read(files.adminAliases);
const memberAliases = read(files.memberAliases);

for (const token of [
  '--color-canvas',
  '--color-surface',
  '--color-surface-raised',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-brand-primary',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-border-subtle',
  '--color-border-strong',
  '--color-backdrop',
]) {
  if (!shared.includes(`${token}:`)) failures.push(`shared color token missing: ${token}`);
}

const sharedImport = "../../../packages/design-tokens/colors.css";
if (!adminLayout.includes(sharedImport)) failures.push('Admin layout does not import shared colors');
if (!memberLayout.includes(sharedImport)) failures.push('Member layout does not import shared colors');
if (!adminLayout.includes("./admin-color-aliases.css")) failures.push('Admin color aliases are not loaded');
if (!memberLayout.includes("./member-color-aliases.css")) failures.push('Member color aliases are not loaded');

for (const [name, content] of [['admin', adminAliases], ['member', memberAliases]]) {
  if (/--([\w-]+):\s*var\(--\1\)/.test(content)) failures.push(`${name} aliases contain a self-reference`);
  if (!content.includes('--brand: var(--color-brand-primary)')) failures.push(`${name} brand alias is not semantic`);
  if (!content.includes('--text: var(--color-text-primary)')) failures.push(`${name} text alias is not semantic`);
  if (!content.includes('--line: var(--color-border-subtle)')) failures.push(`${name} border alias is not semantic`);
}

if (failures.length) {
  console.error('R-013 shared color token contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-013 shared color token contract passed.');
