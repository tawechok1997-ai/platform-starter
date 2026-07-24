import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/admin-accounts/page.tsx'), 'utf8');

test('uses the shared accessible drawer for admin security details', () => {
  assert.equal(source.includes('AdminDrawer'), true);
  assert.equal(source.includes('<AdminDrawer'), true);
  assert.equal(source.includes('drawerLayerStyle'), false);
  assert.equal(source.includes('drawerStyle'), false);
});

test('guards security actions and confirmation while busy', () => {
  assert.equal(source.includes('const pageBusy'), true);
  assert.equal(source.includes('if (securityBusyId || busyId) return'), true);
  assert.equal(source.includes('if (!pendingAction || busyId) return'), true);
  assert.equal(source.includes('busy={Boolean(busyId)}'), true);
});

test('uses safe fixed user-facing errors', () => {
  assert.equal(source.includes('payload?.message'), false);
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('finally'), true);
});
