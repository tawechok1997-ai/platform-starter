import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/admin-accounts/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  'AdminDrawer',
  'try {',
  'finally {',
  "Array.isArray(accessPayload.adminUsers)",
  "Array.isArray(payload.sessions)",
  'if (securityBusyId || busyId) return',
  'if (!pendingAction || busyId) return',
  'reason.length < 5',
  'const pageBusy = loading || Boolean(busyId) || Boolean(securityBusyId)',
  'disabled={pageBusy}',
  'busy={Boolean(busyId)}',
  'onClose={() => { if (!busyId) setSelected(null); }}',
  'onCancel={() => { if (!busyId) setPendingAction(null); }}',
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Admin Accounts safety contract fragment: ${fragment}`);
}

assert.equal(source.includes('data?.message'), false, 'Admin Accounts must not render raw backend messages');
assert.equal(source.includes('payload?.message'), false, 'Admin Accounts must not render raw backend payload messages');
assert.equal(source.includes('window.confirm'), false, 'Admin Accounts must use the shared confirmation dialog');
assert.equal(source.includes('window.prompt'), false, 'Admin Accounts must not use browser prompts');

const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 3, `Expected at least 3 finally blocks, found ${finallyCount}`);

console.log('Admin Accounts safety contract passed');
