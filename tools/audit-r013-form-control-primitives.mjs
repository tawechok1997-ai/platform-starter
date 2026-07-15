import fs from 'node:fs';

const cssPath = 'packages/design-tokens/form-controls.css';
const adminLayoutPath = 'apps/web-admin/app/layout.tsx';
const memberLayoutPath = 'apps/web-member/app/layout.tsx';
const adminLoginPath = 'apps/web-admin/app/(auth)/login/page.tsx';
const memberLoginPath = 'apps/web-member/app/(auth)/login/page.tsx';

const css = fs.readFileSync(cssPath, 'utf8');
const adminLayout = fs.readFileSync(adminLayoutPath, 'utf8');
const memberLayout = fs.readFileSync(memberLayoutPath, 'utf8');
const adminLogin = fs.readFileSync(adminLoginPath, 'utf8');
const memberLogin = fs.readFileSync(memberLoginPath, 'utf8');
const failures = [];

for (const selector of ['.ui-button', '.ui-input', '.ui-select', '.ui-textarea']) {
  if (!css.includes(selector)) failures.push(`missing primitive ${selector}`);
}

for (const contract of [
  ':focus-visible',
  ":disabled",
  "[aria-invalid='true']",
  'prefers-reduced-motion',
  '--shadow-focus-brand',
]) {
  if (!css.includes(contract)) failures.push(`missing form-control contract ${contract}`);
}

for (const [path, source] of [[adminLayoutPath, adminLayout], [memberLayoutPath, memberLayout]]) {
  if (!source.includes("../../../packages/design-tokens/form-controls.css")) {
    failures.push(`${path} does not import shared form controls`);
  }
}

for (const [path, source] of [[adminLoginPath, adminLogin], [memberLoginPath, memberLogin]]) {
  if (!source.includes('ui-input')) failures.push(`${path} has no migrated ui-input usage`);
  if (!source.includes('ui-button')) failures.push(`${path} has no migrated ui-button usage`);
  if (!source.includes('ui-button--primary')) failures.push(`${path} has no primary button primitive usage`);
}

if (!memberLogin.includes('aria-invalid={Boolean(errors.identifier)}') || !memberLogin.includes('aria-invalid={Boolean(errors.secret)}')) {
  failures.push('member login must preserve accessible invalid-state wiring');
}

if (failures.length > 0) {
  console.error('R-013 form-control primitive contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-013 shared Button, Input, Select, and TextArea primitive contract passed.');
