import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

const shared = source('./settings-section-page.tsx');
const hook = source('./use-admin-settings-form.ts');
const workspace = source('./page.tsx');
const maintenance = source('./maintenance/maintenance-settings-client.tsx');
const icons = source('./icons/icon-settings-config.ts');

const genericRoutes = [
  './website/page.tsx',
  './branding/page.tsx',
  './icons/page.tsx',
  './theme/page.tsx',
  './seo/page.tsx',
  './contact/page.tsx',
  './scripts/page.tsx',
  './features/page.tsx',
  './legal/page.tsx',
];

test('shared settings system gates reads and writes by permission', () => {
  assert.match(shared, /useAdminPermissions/);
  assert.match(shared, /settings\.\$\{group\}/);
  assert.match(shared, /canView/);
  assert.match(shared, /canUpdate/);
  assert.match(shared, /enabled:\s*canLoad/);
  assert.match(shared, /canSave:\s*canUpdate/);
  assert.match(shared, /fail-closed/);
  assert.match(hook, /enabled\?: boolean/);
  assert.match(hook, /canSave\?: boolean/);
  assert.match(hook, /บัญชีนี้ไม่มีสิทธิ์บันทึก/);
});

test('shared settings system exposes professional form states', () => {
  assert.match(shared, /AdminSaveStateBadge/);
  assert.match(shared, /AdminUnsavedChangesNotice/);
  assert.match(shared, /AdminSkeleton/);
  assert.match(shared, /โหลดข้อมูลไม่สำเร็จ/);
  assert.match(shared, /ยังไม่มีฟิลด์สำหรับกลุ่มนี้/);
  assert.match(shared, /AdminConfirmDialog/);
  assert.match(shared, /validateFields/);
  assert.match(shared, /sectionNav/);
  assert.match(shared, /ประวัติการเปลี่ยนแปลง/);
  assert.match(hook, /lastSavedAt/);
});

test('shared settings keeps strict response and component contracts', () => {
  assert.match(shared, /error: string \| undefined/);
  assert.match(shared, /tone=\{risk === 'critical' \? 'danger' : 'primary'\}/);
  assert.doesNotMatch(shared, /tone=\{risk === 'critical' \? 'danger' : 'warning'\}/);
  assert.match(hook, /type SaveResult = \{[\s\S]*message\?: string;/);
  assert.match(hook, /typeof payload\.message === 'string'/);
});

test('every standard settings route uses the shared system', () => {
  for (const route of genericRoutes) {
    assert.match(source(route), /SettingsSectionPage/, `${route} must use SettingsSectionPage`);
  }
});

test('sensitive settings require confirmation and tailored previews', () => {
  assert.match(source('./scripts/page.tsx'), /risk="critical"/);
  assert.match(source('./scripts/page.tsx'), /preview="scripts"/);
  assert.match(source('./features/page.tsx'), /risk="sensitive"/);
  assert.match(source('./features/page.tsx'), /preview="features"/);
  assert.match(source('./legal/page.tsx'), /risk="sensitive"/);
  assert.match(source('./seo/page.tsx'), /preview="seo"/);
  assert.match(source('./contact/page.tsx'), /preview="contact"/);
  assert.match(source('./theme/page.tsx'), /preview="theme"/);
});

test('icon settings use real uploadable assets with stable defaults', () => {
  assert.match(icons, /asset:\s*true/);
  assert.match(icons, /defaultValue:/);
  assert.match(icons, /เมนูหลักและทางลัด/);
  assert.match(icons, /หมวดเกม/);
});

test('settings workspace includes all requested destinations and hides inaccessible pages', () => {
  for (const route of ['/settings/website', '/settings/contact', '/settings/seo', '/settings/legal', '/settings/branding', '/settings/icons', '/settings/theme', '/content-center', '/promotion-center', '/settings/maintenance', '/settings/features', '/settings/scripts']) {
    assert.equal(workspace.includes(route), true, `${route} must be listed`);
  }
  assert.match(workspace, /useAdminPermissions/);
  assert.match(workspace, /permissionBase/);
  assert.match(workspace, /allowedItems/);
});

test('maintenance preserves operational validation and permission-aware actions', () => {
  assert.match(maintenance, /useAdminPermissions/);
  assert.match(maintenance, /settings\.maintenance\.view/);
  assert.match(maintenance, /settings\.maintenance\.update/);
  assert.match(maintenance, /AdminSaveStateBadge/);
  assert.match(maintenance, /AdminUnsavedChangesNotice/);
  assert.match(maintenance, /เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น/);
  assert.match(maintenance, /AdminConfirmDialog/);
});
