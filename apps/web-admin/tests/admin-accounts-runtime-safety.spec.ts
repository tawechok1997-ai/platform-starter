import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/admin-accounts/page.tsx'), 'utf8');

test('uses the shared drawer for security details', () => {
  assert.equal(source.includes('AdminDrawer'), true);
  assert.equal(source.includes('drawerLayerStyle'), false);
  assert.equal(source.includes('drawerStyle'), false);
});

test('guards account and session mutations', () => {
  assert.equal(source.includes('if (!pendingAction || busyId) return;'), true);
  assert.equal(source.includes('if (busyId) return;'), true);
  assert.equal(source.includes('reason.length < 5'), true);
  assert.equal(source.includes('pageBusy'), true);
});

test('keeps busy dialogs and drawers locked', () => {
  assert.equal(source.includes('busy={Boolean(busyId)}'), true);
  assert.equal(source.includes('if (!busyId) setSelected(null)'), true);
  assert.equal(source.includes('if (!busyId) setPendingAction(null)'), true);
});

test('validates access payloads and hides backend messages', () => {
  assert.equal(source.includes('Array.isArray(accessPayload.adminUsers)'), true);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('finally'), true);
});
