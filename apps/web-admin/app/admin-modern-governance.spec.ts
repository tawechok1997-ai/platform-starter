import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const cssSource = readFileSync(path.join(appRoot, 'admin-modern-governance.css'), 'utf8');
const adoptionSource = readFileSync(path.join(appRoot, 'admin-modernization-adoption.css'), 'utf8');
const rolesSource = readFileSync(path.join(appRoot, '(admin)/admin-roles/page.tsx'), 'utf8');
const settingsSource = readFileSync(path.join(appRoot, '(admin)/settings/page.tsx'), 'utf8');
const antiBotSource = readFileSync(path.join(appRoot, '(admin)/anti-bot/page.tsx'), 'utf8');

test('loads governance and final adoption styles in the intended order', () => {
  const normalizationIndex = layoutSource.indexOf("import './admin-modern-normalization.css';");
  const governanceIndex = layoutSource.indexOf("import './admin-modern-governance.css';");
  const adoptionIndex = layoutSource.indexOf("import './admin-modernization-adoption.css';");
  assert.notEqual(normalizationIndex, -1);
  assert.notEqual(governanceIndex, -1);
  assert.notEqual(adoptionIndex, -1);
  assert.equal(governanceIndex > normalizationIndex, true);
  assert.equal(adoptionIndex > governanceIndex, true);
});

test('keeps the modernized roles catalog compact, localized and read-only', () => {
  assert.equal(rolesSource.includes('AdminWorkspaceTabs'), true);
  assert.equal(rolesSource.includes('AdminDataTable'), true);
  assert.equal(rolesSource.includes('pageSizeOptions={[20, 50, 100]}'), true);
  assert.equal(rolesSource.includes('admin-role-modern-card'), true);
  assert.equal(rolesSource.includes('admin-role-permission-groups'), true);
  assert.equal(rolesSource.includes('copyByLocale'), true);
  assert.equal(rolesSource.includes('read-only'), true);
  assert.equal(rolesSource.includes('admin-role-row'), false);
  assert.equal(rolesSource.includes('admin-permission-chip'), false);
  assert.equal(rolesSource.includes('const roleStyle'), false);
  assert.equal(rolesSource.includes('const permissionButtonStyle'), false);

  assert.equal(adoptionSource.includes('.admin-role-modern-list'), true);
  assert.equal(adoptionSource.includes('.admin-role-permission-groups'), true);
  assert.equal(adoptionSource.includes('max-height: 300px'), true);
});

test('keeps anti-bot workflows class based', () => {
  assert.equal(antiBotSource.includes('admin-antibot-progress'), true);
  assert.equal(antiBotSource.includes('role="progressbar"'), true);
  assert.equal(antiBotSource.includes('admin-antibot-check'), true);
  assert.equal(antiBotSource.includes('const checkStyle'), false);
  assert.equal(antiBotSource.includes('const actionStyle'), false);
});

test('organizes the settings hub into semantic responsive sections', () => {
  assert.equal(settingsSource.includes('admin-settings-hub'), true);
  assert.equal(settingsSource.includes('admin-settings-section__head'), true);
  assert.equal(settingsSource.includes('admin-settings-grid'), true);
  assert.equal(settingsSource.includes("toLocaleString('th-TH')"), true);
});

test('preserves tablet, mobile, safe-area and reduced-motion behavior', () => {
  assert.equal(cssSource.includes('@media (max-width: 1099px)'), true);
  assert.equal(cssSource.includes('@media (max-width: 720px)'), true);
  assert.equal(cssSource.includes('@media (max-width: 430px)'), true);
  assert.equal(cssSource.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(cssSource.includes('env(safe-area-inset-bottom)'), true);
  assert.equal(adoptionSource.includes('@media (max-width: 760px)'), true);
  assert.equal(adoptionSource.includes('@media (prefers-reduced-motion: reduce)'), true);
});
