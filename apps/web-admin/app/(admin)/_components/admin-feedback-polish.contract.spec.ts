import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const technicalDetailsSource = readFileSync(new URL('./admin-technical-details.tsx', import.meta.url), 'utf8');
const technicalDetailsCss = readFileSync(new URL('./admin-technical-details.module.css', import.meta.url), 'utf8');
const webhookSource = readFileSync(new URL('../webhook-logs/page.tsx', import.meta.url), 'utf8');
const invitationSource = readFileSync(new URL('../admin-invitations/page.tsx', import.meta.url), 'utf8');
const invitationPanelSource = readFileSync(new URL('../access/invite-admin-panel.tsx', import.meta.url), 'utf8');

test('shared technical details keep accessible state and reduced-motion support', () => {
  assert.match(technicalDetailsSource, /aria-expanded=\{open\}/);
  assert.match(technicalDetailsSource, /aria-controls=\{contentId\}/);
  assert.match(technicalDetailsSource, /role="region"/);
  assert.match(technicalDetailsCss, /grid-template-rows: 0fr/);
  assert.match(technicalDetailsCss, /prefers-reduced-motion: reduce/);
});

test('webhook logs use shared expandable details and operational quick filters', () => {
  assert.match(webhookSource, /AdminTechnicalDetails/);
  assert.match(webhookSource, /FAILED.*มีปัญหา/s);
  assert.match(webhookSource, /DUPLICATE.*รายการซ้ำ/s);
  assert.match(webhookSource, /RECEIVED.*รอดำเนินการ/s);
  assert.match(webhookSource, /ข้อมูลเดิมยังแสดงอยู่/);
  assert.doesNotMatch(webhookSource, /setPayload\(emptyPayload\)/);
  assert.match(webhookSource, /payload\.total > 0 && <AdminPagination/);
});

test('admin invitations load independent resources and keep action refresh outcomes accurate', () => {
  assert.match(invitationSource, /Promise\.all\(\[/);
  assert.match(invitationSource, /noticeRef\.current\?\.tone !== 'success'/);
  assert.match(invitationSource, /load\(false\)/);
  assert.match(invitationSource, /handleCreated\(\): Promise<boolean>/);
  assert.match(invitationSource, /refreshNotice\('ยกเลิกคำเชิญแล้ว/);
  assert.match(invitationSource, /แต่รีเฟรชข้อมูลไม่ครบ/);
  assert.match(invitationSource, /href="\/admin-roles"/);
  assert.match(invitationSource, /AdminSkeleton/);
});

test('admin invitation form owns creation feedback without breaking existing callers', () => {
  assert.match(invitationPanelSource, />บทบาท\s*</);
  assert.match(invitationPanelSource, /เลือกบทบาท/);
  assert.match(invitationPanelSource, /onCreated: \(\) => unknown \| Promise<unknown>/);
  assert.match(invitationPanelSource, /refreshResult !== false/);
  assert.match(invitationPanelSource, /ลิงก์และรหัสเชิญจะแสดงเพียง 60 วินาที/);
  assert.match(invitationPanelSource, /สร้างคำเชิญแล้ว แต่รีเฟรชข้อมูลไม่ครบ/);
  assert.match(invitationPanelSource, /tone: 'success'/);
  assert.match(invitationPanelSource, /tone: 'warning'/);
  assert.match(invitationPanelSource, /tone: 'danger'/);
  assert.doesNotMatch(invitationPanelSource, />Role\s*</);
  assert.doesNotMatch(invitationPanelSource, /เลือก Role|ไม่มี Role|Token จะแสดง/);
});
