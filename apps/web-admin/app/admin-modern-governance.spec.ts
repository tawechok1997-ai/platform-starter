import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutSource = readFileSync(path.join(appRoot, 'layout.tsx'), 'utf8');
const cssSource = readFileSync(path.join(appRoot, 'admin-modern-governance.css'), 'utf8');
const adoptionSource = readFileSync(path.join(appRoot, 'admin-modernization-adoption.css'), 'utf8');
const rolesSource = readFileSync(path.join(appRoot, '(admin)/admin-roles/page.tsx'), 'utf8');
const rolesCssSource = readFileSync(
  path.join(appRoot, '(admin)/admin-roles/admin-role-governance.module.css'),
  'utf8',
);
const settingsSource = readFileSync(path.join(appRoot, '(admin)/settings/page.tsx'), 'utf8');
const settingsCssSource = readFileSync(path.join(appRoot, '(admin)/settings/settings-workspace.module.css'), 'utf8');
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

test('keeps the modernized roles workspace localized permission-gated and responsive', () => {
  assert.equal(rolesSource.includes('AdminWorkspaceTabs'), true);
  assert.equal(rolesSource.includes('WORKSPACES'), true);
  assert.equal(rolesSource.includes("type Workspace = 'roles' | 'teams' | 'effective' | 'overrides'"), true);
  assert.equal(rolesSource.includes('selectedRoleIds'), true);
  assert.equal(rolesSource.includes('primaryRoleId'), true);
  assert.equal(rolesSource.includes("adminApiFetch('/admin/access/role-preview'"), true);
  assert.equal(rolesSource.includes('permission-overrides'), true);
  assert.equal(rolesSource.includes('access-profile'), true);
  assert.equal(rolesSource.includes('canManageRoles'), true);
  assert.equal(rolesSource.includes('canManageTeams'), true);
  assert.equal(rolesSource.includes('canOverride'), true);
  assert.equal(rolesSource.includes("adminApiFetch('/admin/auth/me')"), true);
  assert.equal(rolesSource.includes('canAccessPath(tab.href, heldPermissions)'), true);
  assert.equal(rolesSource.includes('AdminDataTable'), false);
  assert.equal(rolesSource.includes('read-only'), false);
  assert.equal(rolesSource.includes('const roleStyle'), false);
  assert.equal(rolesSource.includes('const permissionButtonStyle'), false);

  assert.equal(rolesCssSource.includes('.workspaceSwitch'), true);
  assert.equal(rolesCssSource.includes('.roleGrid'), true);
  assert.equal(rolesCssSource.includes('@media (max-width: 900px)'), true);
  assert.equal(rolesCssSource.includes('@media (max-width: 640px)'), true);
  assert.equal(rolesCssSource.includes('@media (prefers-reduced-motion: reduce)'), true);
});

test('keeps anti-bot workflows class based', () => {
  assert.equal(antiBotSource.includes('admin-antibot-progress'), true);
  assert.equal(antiBotSource.includes('role="progressbar"'), true);
  assert.equal(antiBotSource.includes('admin-antibot-check'), true);
  assert.equal(antiBotSource.includes('const checkStyle'), false);
  assert.equal(antiBotSource.includes('const actionStyle'), false);
});

test('organizes settings into localized URL-backed responsive sections', () => {
  assert.equal(settingsSource.includes('AdminWorkspaceTabs'), true);
  assert.equal(settingsSource.includes('queryKey="section"'), true);
  assert.equal(settingsSource.includes('normalizeSection'), true);
  assert.equal(settingsSource.includes('type SettingsImpact'), true);
  assert.equal(settingsSource.includes("th: 'ทั่วไป'"), true);
  assert.equal(settingsSource.includes("en: 'General'"), true);
  assert.equal(settingsSource.includes("toLocaleString(numberLocale)"), true);
  assert.equal(settingsCssSource.includes('.workspace'), true);
  assert.equal(settingsCssSource.includes('.grid'), true);
  assert.equal(settingsCssSource.includes("[data-impact='sensitive']"), true);
  assert.equal(settingsCssSource.includes('@media (max-width: 720px)'), true);
  assert.equal(settingsSource.includes('admin-settings-hub'), false);
});

test('preserves tablet, mobile, safe-area and reduced-motion behavior', () => {
  assert.equal(cssSource.includes('@media (max-width: 1099px)'), true);
  assert.equal(cssSource.includes('@media (max-width: 720px)'), true);
  assert.equal(cssSource.includes('@media (max-width: 430px)'), true);
  assert.equal(cssSource.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(cssSource.includes('env(safe-area-inset-bottom)'), true);
  assert.equal(adoptionSource.includes('@media (max-width: 760px)'), true);
  assert.equal(adoptionSource.includes('@media (prefers-reduced-motion: reduce)'), true);
  assert.equal(settingsCssSource.includes('@media (prefers-reduced-motion: reduce)'), true);
});
