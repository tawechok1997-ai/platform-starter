import fs from 'node:fs';

const accessibility = fs.readFileSync('packages/design-tokens/accessibility.css', 'utf8');
const colors = fs.readFileSync('packages/design-tokens/colors.css', 'utf8');
const adminLayout = fs.readFileSync('apps/web-admin/app/layout.tsx', 'utf8');
const memberLayout = fs.readFileSync('apps/web-member/app/layout.tsx', 'utf8');
const memberChrome = fs.readFileSync('apps/web-member/app/member-chrome.tsx', 'utf8');
const financeFlow = fs.readFileSync('apps/web-member/src/features/finance/finance-components.tsx', 'utf8');
const memberLogin = fs.readFileSync('apps/web-member/app/(auth)/login/page.tsx', 'utf8');

function token(name) {
  const match = colors.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing hex token ${name}`);
  return match[1];
}

function luminance(hex) {
  const values = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + .05) / (low + .05);
}

const primaryContrast = contrast(token('--color-text-primary'), token('--color-canvas'));
const inverseBrandContrast = contrast(token('--color-text-inverse'), token('--color-brand-primary'));

const checks = [
  ['focus-visible baseline', accessibility.includes(':focus-visible') && accessibility.includes('outline-offset: 3px')],
  ['invalid-field baseline', accessibility.includes('[aria-invalid="true"]')],
  ['screen-reader-only utility', accessibility.includes('.ui-sr-only')],
  ['skip-link utility', accessibility.includes('.ui-skip-link')],
  ['reduced-motion baseline', accessibility.includes('@media (prefers-reduced-motion: reduce)') && accessibility.includes('animation-duration: .01ms')],
  ['forced-colors baseline', accessibility.includes('@media (forced-colors: active)')],
  ['admin imports accessibility source', adminLayout.includes('packages/design-tokens/accessibility.css')],
  ['member imports accessibility source', memberLayout.includes('packages/design-tokens/accessibility.css')],
  ['drawer dialog semantics', memberChrome.includes('role="dialog"') && memberChrome.includes('aria-modal="true"') && memberChrome.includes('aria-label="เมนูสมาชิก"')],
  ['drawer keyboard escape', memberChrome.includes("event.key === 'Escape'")],
  ['confirm dialog semantics', financeFlow.includes('aria-labelledby={titleId}') && financeFlow.includes('aria-describedby={description ? descriptionId : undefined}')],
  ['confirm focus trap and restore', financeFlow.includes("event.key !== 'Tab'") && financeFlow.includes('returnFocusRef.current?.focus()')],
  ['invalid login fields', memberLogin.includes('aria-invalid={Boolean(errors.identifier)}') && memberLogin.includes('aria-invalid={Boolean(errors.secret)}')],
  [`primary text contrast ${primaryContrast.toFixed(2)} >= 4.5`, primaryContrast >= 4.5],
  [`inverse brand contrast ${inverseBrandContrast.toFixed(2)} >= 4.5`, inverseBrandContrast >= 4.5],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`R-013 accessibility baseline passed (${checks.length} checks).`);
