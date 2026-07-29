import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('./access-overview.module.css', import.meta.url), 'utf8');

test('access overview loads independent resources together and preserves stale data', () => {
  assert.match(pageSource, /Promise\.all\(\[/);
  assert.match(pageSource, /fetchAdminPayload\('\/admin\/access\/overview'\)/);
  assert.match(pageSource, /fetchAdminPayload\('\/admin\/auth\/me'\)/);
  assert.match(pageSource, /fetchAdminPayload\('\/admin\/access\/delegations'\)/);
  assert.match(pageSource, /ข้อมูลเดิมยังแสดงอยู่/);
  assert.doesNotMatch(pageSource, /setData\(null\)/);
});

test('access overview uses explicit feedback tones and a retryable loading state', () => {
  assert.match(pageSource, /type NoticeState = \{ text: string; tone:/);
  assert.match(pageSource, /AdminSkeleton/);
  assert.match(pageSource, /notice\.retry/);
  assert.match(pageSource, /tone: 'success'/);
  assert.match(pageSource, /tone: 'warning'/);
  assert.match(pageSource, /tone: 'danger'/);
  assert.doesNotMatch(pageSource, /message\.includes\(/);
});

test('access overview uses concise Thai labels and paginates permissions', () => {
  assert.match(pageSource, /title="ควบคุมสิทธิ์ผู้ดูแล"/);
  assert.match(pageSource, /title="สิทธิ์ชั่วคราว"/);
  assert.match(pageSource, /title="รายการสิทธิ์"/);
  assert.match(pageSource, /AdminFilterBar/);
  assert.match(pageSource, /AdminPagination/);
  assert.match(pageSource, /ล้างตัวกรอง/);
  assert.doesNotMatch(pageSource, /title="Access Control"|title="Roles"|title="Admin users"|title="Delegated Access"|title="Permissions"/);
});

test('access overview moves repeated responsive layout into a CSS module', () => {
  assert.match(pageSource, /access-overview\.module\.css/);
  assert.match(pageSource, /className=\{styles\.assignPanel\}/);
  assert.match(pageSource, /className=\{styles\.delegationForm\}/);
  assert.match(stylesSource, /@media \(max-width: 720px\)/);
  assert.match(stylesSource, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.doesNotMatch(pageSource, /const assignPanelStyle|const delegationFormStyle|const rolePillStyle/);
});
