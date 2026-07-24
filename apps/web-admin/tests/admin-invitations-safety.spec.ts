import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/admin-invitations/page.tsx'), 'utf8');
const panelSource = readFileSync(path.join(process.cwd(), 'app/(admin)/access/invite-admin-panel.tsx'), 'utf8');

test('loads roles and invitations independently', () => {
  assert.equal(source.includes('let rolesOk = false'), true);
  assert.equal(source.includes('let invitationsOk = false'), true);
  assert.equal(source.includes('Promise.all'), false);
});

test('validates invitation payloads before rendering', () => {
  assert.equal(source.includes('function isRole'), true);
  assert.equal(source.includes('function isInvitation'), true);
  assert.equal(source.includes('payload.items.filter(isRole)'), true);
  assert.equal(source.includes('payload.items.filter(isInvitation)'), true);
});

test('keeps one-time invitation tokens on screen briefly', () => {
  assert.equal(source.includes('const INVITATION_LINK_TTL_MS = 60_000'), true);
  assert.equal(source.includes("setLatestLink('')"), true);
  assert.equal(source.includes('ลิงก์จะแสดง 60 วินาที'), true);
});

test('guards invitation mutations with shared confirmation and busy state', () => {
  assert.equal(source.includes('AdminConfirmDialog'), true);
  assert.equal(source.includes('if (!pendingAction || pageBusy) return'), true);
  assert.equal(source.includes('if (!busyKey) setPendingAction(null)'), true);
  assert.equal(source.includes('encodeURIComponent(item.adminUserId)'), true);
});

test('rejects malformed reissue tokens', () => {
  assert.equal(source.includes("typeof payload.token !== 'string'"), true);
  assert.equal(source.includes('payload.token.trim().length < 32'), true);
});

test('accepts asynchronous invitation refresh callbacks with result payloads', () => {
  assert.equal(panelSource.includes('onCreated: () => unknown | Promise<unknown>'), true);
  assert.equal(panelSource.includes('await Promise.resolve(onCreated())'), true);
});

test('validates invitation creation input and response', () => {
  assert.equal(panelSource.includes('EMAIL_PATTERN.test(normalizedEmail)'), true);
  assert.equal(panelSource.includes('selectableRoles.some((role) => role.id === roleId)'), true);
  assert.equal(panelSource.includes('expiresInHours < 1 || expiresInHours > 720'), true);
  assert.equal(panelSource.includes('function isInvitationResult'), true);
  assert.equal(panelSource.includes('value.token.trim().length >= 32'), true);
  assert.equal(panelSource.includes('value.tokenVisibleOnce === true'), true);
});

test('does not expose raw invitation backend messages', () => {
  assert.equal(panelSource.includes('payload?.message'), false);
  assert.equal(panelSource.includes('สร้างคำเชิญไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองใหม่'), true);
});

test('clears invitation creation token from the screen', () => {
  assert.equal(panelSource.includes('const TOKEN_DISPLAY_TTL_MS = 60_000'), true);
  assert.equal(panelSource.includes('setResult(null)'), true);
  assert.equal(panelSource.includes('ลิงก์จะแสดง 60 วินาที'), true);
});
