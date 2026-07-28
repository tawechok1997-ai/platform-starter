import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/admin-invitations/page.tsx'), 'utf8');

test('normalizes invitation lifecycle states before rendering', () => {
  assert.equal(source.includes('normalizeInvitationStatus(item)'), true);
  assert.equal(source.includes("raw === 'ACCEPTED'"), true);
  assert.equal(source.includes("raw === 'CANCELLED'"), true);
  assert.equal(source.includes("raw === 'CANCELED'"), true);
  assert.equal(source.includes("return 'EXPIRED'"), true);
});

test('uses shared confirmation for revoke and reissue actions', () => {
  assert.equal(source.includes('AdminConfirmDialog'), true);
  assert.equal(source.includes("type: 'reissue'"), true);
  assert.equal(source.includes("type: 'revoke'"), true);
  assert.equal(source.includes('busy={Boolean(busyKey)}'), true);
});

test('keeps token one-time handling and async cleanup safe', () => {
  assert.equal(source.includes("typeof payload.token !== 'string'"), true);
  assert.equal(source.includes('payload.token.trim().length < 32'), true);
  assert.equal(source.includes('INVITATION_LINK_TTL_MS = 60_000'), true);
  assert.match(source, /ลิงก์และรหัสเชิญจะแสดงเพียง 60 วินาที/);
  assert.equal(source.includes('finally'), true);
  assert.equal(source.includes("setBusyKey('')"), true);
});
