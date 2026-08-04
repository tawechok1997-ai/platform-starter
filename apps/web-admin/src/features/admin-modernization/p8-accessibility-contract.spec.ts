import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

test('canonical drawer owns dialog semantics, focus containment, escape, scroll lock, and focus restore', () => {
  const drawer = source('app/(admin)/_components/admin-drawer.tsx');

  assert.match(drawer, /role="dialog"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(drawer, /aria-labelledby=\{titleId\}/);
  assert.match(drawer, /aria-describedby=\{description \? descriptionId : undefined\}/);
  assert.match(drawer, /event\.key === 'Escape'/);
  assert.match(drawer, /event\.key !== 'Tab'/);
  assert.match(drawer, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(drawer, /openerRef\.current = document\.activeElement/);
  assert.match(drawer, /openerRef\.current\?\.focus\(\)/);
});

test('canonical confirmation modal is an alert dialog with stable refs, focus containment, and opener restore', () => {
  const ui = source('app/(admin)/_components/admin-ui.tsx');

  assert.match(ui, /role="alertdialog"/);
  assert.match(ui, /aria-modal="true"/);
  assert.match(ui, /aria-labelledby=\{titleId\}/);
  assert.match(ui, /aria-describedby=\{descriptionId\}/);
  assert.match(ui, /onCancelRef\.current = onCancel/);
  assert.match(ui, /busyRef\.current = busy/);
  assert.match(ui, /event\.key === 'Escape' && !busyRef\.current/);
  assert.match(ui, /event\.key !== 'Tab'/);
  assert.match(ui, /cancelRef\.current\?\.focus\(\)/);
  assert.match(ui, /openerRef\.current = document\.activeElement/);
  assert.match(ui, /openerRef\.current\?\.focus\(\)/);
  assert.match(ui, /document\.body\.style\.overflow = previous\.overflow/);
  assert.match(ui, /@media\(prefers-reduced-motion:reduce\)/);
});

test('canonical data table keeps desktop and mobile semantics, keyboard rows, sorting, and pagination labels', () => {
  const table = source('src/features/admin-modernization/data-table.tsx');

  assert.match(table, /<table[^>]+aria-label=\{ariaLabel\}/);
  assert.match(table, /scope="col"/);
  assert.match(table, /aria-sort=/);
  assert.match(table, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(table, /tabIndex=\{clickable \? 0 : undefined\}/);
  assert.match(table, /<ul[^>]+aria-label=\{ariaLabel\}/);
  assert.match(table, /role="status"/);
  assert.match(table, /aria-current=\{token === currentPage \? 'page' : undefined\}/);
  assert.match(table, /aria-label=\{labels\.previousPage\}/);
  assert.match(table, /aria-label=\{labels\.nextPage\}/);
});

test('workspace tabs remain navigation links with current-page and disabled semantics', () => {
  const tabs = source('src/features/admin-modernization/workspace-tabs.tsx');

  assert.match(tabs, /<nav[^>]+aria-label=\{ariaLabel\}/);
  assert.match(tabs, /aria-current=\{active \? 'page' : undefined\}/);
  assert.match(tabs, /aria-disabled="true"/);
  assert.match(tabs, /scroll=\{false\}/);
});

test('security remains one progressive owner for sessions, 2FA, recovery, tables, tabs, and sensitive expiry', () => {
  const security = source('src/features/auth/admin-security-page.tsx');

  assert.match(security, /type SecurityTab = 'overview' \| 'sessions' \| 'two-factor' \| 'recovery'/);
  assert.match(security, /AdminWorkspaceTabs/);
  assert.match(security, /AdminDataTable/);
  assert.match(security, /AdminConfirmDialog/);
  assert.match(security, /SENSITIVE_DISPLAY_TTL_MS = 5 \* 60_000/);
  assert.match(security, /QRCode\.toDataURL/);
  assert.match(security, /clearAdminSession\(\)/);
  assert.match(security, /window\.location\.replace\('\/login'\)/);
});
