import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/access/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  "const load = useCallback(async () => {",
  "const pageBusy = loading || Boolean(busyKey)",
  "function isAccessResponse(value: unknown): value is AccessResponse",
  "function isDelegation(value: unknown): value is Delegation",
  "function isAdminUser(value: unknown): value is AdminUser",
  "function isRole(value: unknown): value is Role",
  "function isPermission(value: unknown): value is Permission",
  "if (pageBusy || !canDelegate) return",
  "target.id === currentAdminId",
  "permissionCodes.length === 0 || permissionCodes.length > 40",
  "hours < 1 || hours > 168",
  "setPendingAction({ type: 'assign-role'",
  "setPendingAction({ type: 'remove-role'",
  "setPendingAction({ type: 'revoke-delegation'",
  "<AdminConfirmDialog",
  "onCancel={() => { if (!busyKey) setPendingAction(null); }}",
  "onConfirm={() => void executeAction()}",
  "disabled={pageBusy}",
  "setBusyKey('delegation:create')",
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Access Control safety contract fragment: ${fragment}`);
}

assert.equal(source.includes('Promise.all'), false, 'Access Control loading must not fail all requests through Promise.all');
assert.equal(source.includes('window.confirm'), false, 'Access Control must use the shared confirmation dialog');
assert.equal(source.includes('window.prompt'), false, 'Access Control must collect reasons in controlled fields');
assert.equal(source.includes('payload?.message'), false, 'Access Control must not render raw backend messages');
assert.equal(source.includes('data?.message'), false, 'Access Control must not render raw backend messages');

const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 3, `Expected at least 3 finally blocks, found ${finallyCount}`);

console.log('Access Control safety contract passed');
