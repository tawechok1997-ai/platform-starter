import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const technicalDetailsSource = readFileSync(new URL('./admin-technical-details.tsx', import.meta.url), 'utf8');
const technicalDetailsCss = readFileSync(new URL('./admin-technical-details.module.css', import.meta.url), 'utf8');
const webhookSource = readFileSync(new URL('../webhook-logs/page.tsx', import.meta.url), 'utf8');
const invitationSource = readFileSync(new URL('../admin-invitations/page.tsx', import.meta.url), 'utf8');

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

test('admin invitations load independent resources together and preserve success feedback', () => {
  assert.match(invitationSource, /Promise\.all\(\[/);
  assert.match(invitationSource, /noticeRef\.current\?\.tone !== 'success'/);
  assert.match(invitationSource, /tone: 'success'/);
  assert.match(invitationSource, /href="\/admin-roles"/);
  assert.match(invitationSource, /AdminSkeleton/);
});
