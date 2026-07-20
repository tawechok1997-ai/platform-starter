import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const adminUiSource = readFileSync(
  resolve(process.cwd(), 'app/(admin)/_components/admin-ui.tsx'),
  'utf8',
);

const overlayCss = readFileSync(
  resolve(process.cwd(), 'app/admin-shell-overlay-fix.css'),
  'utf8',
);

test('canonical Admin primitive exports remain available', () => {
  const requiredExports = [
    'AdminPage',
    'AdminCard',
    'AdminMetric',
    'AdminToolbar',
    'AdminNotice',
    'AdminEmpty',
    'AdminSkeleton',
    'AdminButton',
    'AdminIconButton',
    'AdminLinkButton',
    'AdminBadge',
    'AdminPagination',
    'AdminConfirmDialog',
  ];

  for (const exportName of requiredExports) {
    assert.match(
      adminUiSource,
      new RegExp(`export function ${exportName}\\b`),
      `${exportName} must remain part of the canonical Admin primitive API`,
    );
  }
});

test('interactive Admin primitives retain accessible names and dialog semantics', () => {
  assert.match(adminUiSource, /aria-label=\{ariaLabel\}/);
  assert.match(adminUiSource, /aria-label=\{label\}/);
  assert.match(adminUiSource, /role="alertdialog"/);
  assert.match(adminUiSource, /aria-modal="true"/);
  assert.match(adminUiSource, /aria-labelledby=\{titleId\}/);
  assert.match(adminUiSource, /aria-describedby=\{descriptionId\}/);
  assert.match(adminUiSource, /event\.key === 'Escape'/);
  assert.match(adminUiSource, /confirmRef\.current\?\.focus\(\)/);
});

test('loading and feedback primitives expose status semantics', () => {
  assert.match(adminUiSource, /className="admin-ui-skeleton"[^>]*role="status"/);
  assert.match(adminUiSource, /role=\{tone === 'danger' \? 'alert' : 'status'\}/);
});

test('Admin styles do not couple selectors to serialized inline style text', () => {
  assert.doesNotMatch(adminUiSource, /\[style\*=/);
  assert.doesNotMatch(overlayCss, /\[style\*=/);
  assert.match(overlayCss, /:has\(> \.admin-drawer-backdrop\)/);
});
