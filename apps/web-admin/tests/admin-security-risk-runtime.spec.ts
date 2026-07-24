import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const accounts = read('app/(admin)/admin-accounts/page.tsx');
const alerts = read('app/(admin)/risk-alerts/page.tsx');
const providerRisk = read('app/(admin)/provider-risk/page.tsx');

test('admin accounts uses shared drawer and guarded mutations', () => {
  assert.equal(accounts.includes('AdminDrawer'), true);
  assert.equal(accounts.includes('drawerLayerStyle'), false);
  assert.equal(accounts.includes("if (!pendingAction || busyId) return"), true);
  assert.equal(accounts.includes('finally {'), true);
  assert.equal(accounts.includes('data?.message'), false);
});

test('risk alerts cleans up every async control path', () => {
  assert.equal(alerts.includes('const [actionBusy, setActionBusy]'), true);
  assert.equal((alerts.match(/finally \{/g) ?? []).length >= 5, true);
  assert.equal(alerts.includes('data?.message'), false);
  assert.equal(alerts.includes('const pageBusy = loading || scanning || actionBusy || dismissing'), true);
  assert.equal(alerts.includes('if (!selectedIds.length || dismissing || actionBusy) return'), true);
});

test('provider risk uses confirmation and blocks unsafe repeat actions', () => {
  assert.equal(providerRisk.includes('AdminConfirmDialog'), true);
  assert.equal(providerRisk.includes('window.confirm'), false);
  assert.equal(providerRisk.includes('if (!providerId || !pendingGate || loading) return'), true);
  assert.equal((providerRisk.match(/finally \{/g) ?? []).length >= 3, true);
  assert.equal(providerRisk.includes('data?.message'), false);
});
