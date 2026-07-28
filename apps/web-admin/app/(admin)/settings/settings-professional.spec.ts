import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sharedPage = readFileSync(new URL('./settings-section-page.tsx', import.meta.url), 'utf8');
const websitePage = readFileSync(new URL('./website/page.tsx', import.meta.url), 'utf8');
const maintenancePage = readFileSync(new URL('./maintenance/maintenance-settings-client.tsx', import.meta.url), 'utf8');
const professionalCss = readFileSync(new URL('./settings-professional.module.css', import.meta.url), 'utf8');
const workspaceCss = readFileSync(new URL('./settings-workspace.module.css', import.meta.url), 'utf8');

const sharedSettingsPages = [
  'branding',
  'icons',
  'theme',
  'seo',
  'contact',
  'scripts',
  'features',
  'legal',
];

test('shared settings page uses one professional editor and sticky preview system', () => {
  assert.match(sharedPage, /className=\{styles\.layout\}/);
  assert.match(sharedPage, /className=\{styles\.fieldGrid\}/);
  assert.match(sharedPage, /className=\{styles\.previewPanel\}/);
  assert.match(sharedPage, /className=\{styles\.actionBar\}/);
  assert.match(sharedPage, /บันทึกการตั้งค่า/);
  assert.match(sharedPage, /ยกเลิกการแก้ไข/);
});

test('all generic settings destinations use SettingsSectionPage', () => {
  for (const route of sharedSettingsPages) {
    const source = readFileSync(new URL(`./${route}/page.tsx`, import.meta.url), 'utf8');
    assert.match(source, /SettingsSectionPage/, `${route} should use the shared professional settings page`);
  }
});

test('website settings delegates grouped sections and sensitive confirmation to the shared system', () => {
  assert.match(websitePage, /SettingsSectionPage/);
  assert.match(websitePage, /group=["']website["']/);
  assert.match(websitePage, /section:\s*["']ข้อมูลเว็บไซต์["']/);
  assert.match(websitePage, /section:\s*["']สถานะระบบ["']/);
  assert.match(websitePage, /section:\s*["']ข้อความหน้าแรก["']/);
  assert.match(websitePage, /section:\s*["']Login และ Register["']/);
  assert.match(websitePage, /risk=["']sensitive["']/);
  assert.match(sharedPage, /className=\{styles\.previewPanel\}/);
  assert.match(sharedPage, /className=\{styles\.actionBar\}/);
});

test('maintenance keeps confirmation safety inside the professional settings layout', () => {
  assert.match(maintenancePage, /className=\{settingsStyles\.layout\}/);
  assert.match(maintenancePage, /className=\{settingsStyles\.previewPanel\}/);
  assert.match(maintenancePage, /className=\{settingsStyles\.actionBar\}/);
  assert.match(maintenancePage, /AdminConfirmDialog/);
  assert.match(maintenancePage, /affectedServices/);
  assert.match(maintenancePage, /ตรวจและบันทึก/);
});

test('settings CSS protects spacing responsive layout and accessible controls', () => {
  assert.match(professionalCss, /grid-template-columns: minmax\(0, 1\.55fr\) minmax\(300px, \.75fr\)/);
  assert.match(professionalCss, /position: sticky;[\s\S]*bottom: 0/);
  assert.match(professionalCss, /\.switchInput:checked/);
  assert.match(professionalCss, /@media \(max-width: 720px\)/);
  assert.match(professionalCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(workspaceCss, /grid-template-columns: repeat\(auto-fit, minmax\(min\(300px, 100%\), 1fr\)\)/);
  assert.match(workspaceCss, /data-impact='sensitive'/);
});
