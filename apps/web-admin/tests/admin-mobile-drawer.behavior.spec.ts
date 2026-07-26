import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(import.meta.dirname, '..');
const controller = fs.readFileSync(path.join(appRoot, 'app/admin-mobile-drawer-controller.tsx'), 'utf8');
const css = fs.readFileSync(path.join(appRoot, 'app/admin-mobile-drawer-fix.css'), 'utf8');
const rootLayout = fs.readFileSync(path.join(appRoot, 'app/layout.tsx'), 'utf8');

test('mounts the dedicated mobile controller after the shell', () => {
  assert.equal(rootLayout.includes("import './admin-mobile-drawer-fix.css';"), true);
  assert.equal(rootLayout.includes('<AdminMobileDrawerController />'), true);
});

test('uses a full viewport drawer on mobile', () => {
  assert.equal(css.includes('width: 100dvw !important'), true);
  assert.equal(css.includes('height: 100dvh !important'), true);
  assert.equal(css.includes('#admin-sidebar .admin-drawer-head'), true);
  assert.equal(css.includes('#admin-sidebar .admin-sidebar-footer'), true);
});

test('keeps profile identity, close, locale and logout functional', () => {
  assert.equal(controller.includes('useAdminLocale()'), true);
  assert.equal(controller.includes('AdminIcon name="close"'), true);
  assert.equal(controller.includes("changeLocale('th')"), true);
  assert.equal(controller.includes("changeLocale('en')"), true);
  assert.equal(controller.includes("await adminApiFetch('/admin/auth/logout'"), true);
  assert.equal(controller.includes('clearAdminSession()'), true);
  assert.equal(controller.includes("window.location.href = '/login'"), true);
});

test('shows the current administrator name and role', () => {
  assert.equal(controller.includes('admin.displayName'), true);
  assert.equal(controller.includes('roleLabel(admin.roles)'), true);
  assert.equal(controller.includes('admin.department'), true);
});
