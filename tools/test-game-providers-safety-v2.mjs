import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/src/features/finance/game-providers-page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  'function isProviderDetail',
  'function isHealthResult',
  'function isSyncResult',
  "const [busyKey, setBusyKey] = useState('')",
  'const pageBusy = loading || Boolean(busyKey)',
  'if (pageBusy) return',
  'if (!pendingAction || pageBusy) return',
  "setBusyKey('provider')",
  'setBusyKey(`health:${providerId}`)',
  'setBusyKey(`endpoint:${providerId}`)',
  'setBusyKey(`credential:${providerId}`)',
  "setBusyKey('')",
  'finally {',
  'busy={Boolean(busyKey)}',
  'onCancel={() => { if (!busyKey) setPendingAction(null); }}',
  'disabled={pageBusy}',
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Game Providers safety fragment: ${fragment}`);
}

assert.equal(source.includes('Promise.all(['), false, 'Game Providers mutations must refresh sequentially');
assert.equal(source.includes('data?.message'), false, 'Game Providers must not render raw backend messages');
assert.equal(source.includes('payload?.message'), false, 'Game Providers must not render raw backend payload messages');
assert.equal(source.includes('window.confirm'), false, 'Game Providers must use the shared confirmation dialog');
assert.equal(source.includes('window.prompt'), false, 'Game Providers must not use browser prompts');

const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 7, `Expected at least 7 finally blocks, found ${finallyCount}`);

console.log('Game Providers safety contract passed');
