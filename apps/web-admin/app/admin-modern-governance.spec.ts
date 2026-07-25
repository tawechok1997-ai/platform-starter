import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const cssSource = readFileSync(path.join(appRoot, 'admin-modern-governance.css'), 'utf8');
const rolesSource = readFileSync(path.join(appRoot, '(admin)/admin-roles/page.tsx'), 'utf8');
const settingsSource = readFileSync(path.join(appRoot, '(admin)/settings/page.tsx'), 'utf8');
const antiBotSource = readFileSync(path.join(appRoot, '(admin)/anti-bot/page.tsx'), 'utf8');

test('loads governance styles after the final normalization layer', () => {
  const normalizationIndex = layoutSource.indexOf("import './admin-modern-normalization.css';");
  const governanceIndex = layoutSource.indexOf("import './admin-modern-governance.css';");
  assert.notEqual(normalizationIndex, -1);
  assert.notEqual(governanceIndex, -1);
  assert.equal(governanceIndex > normalizationIndex, true);
});

test('keeps roles and anti-bot workflows class based', () => {
  assert.equal(rolesSource.includes('admin-governance-page'), true);
  assert.equal(rolesSource.includes('admin-role-row'), true);
  assert.equal(rolesSource.includes('admin-permission-chip'), true);
  assert.equal(rolesSource.includes('const roleStyle'), false);
  assert.equal(rolesSource.includes('const permissionButtonStyle'), false);

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

test('preserves tablet, mobile and reduced-motion behavior', () => {
  assert.equal(cssSource.includes('@media (max-width: 1099px)'), true);
  assert.equal(cssSource.includes('@media (max-width: 720px)'), true);
  assert.equal(cssSource.includes('@media (max-width: 430px)'), true);
  assert.equal(cssSource.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(cssSource.includes('env(safe-area-inset-bottom)'), true);
});
