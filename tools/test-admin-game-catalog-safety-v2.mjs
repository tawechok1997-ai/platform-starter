import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/games/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  'try {',
  'finally {',
  'setMediaSaving(true)',
  'setBulkBusy(true)',
  'if (loading) return',
  'if (saving) return',
  'if (mediaSaving) return',
  'if (busyId) return',
  'if (bulkBusy) return',
  "Array.isArray(gamesData?.items)",
  "Array.isArray(providersData?.items)",
  "setGames([])",
  "setProviders([])",
  "disabled={controlsBusy}",
  "disabled={mediaSaving || controlsBusy}",
  "onCancel={() => { if (!busyId) setPendingStatus(null); }}",
  "onCancel={() => { if (!bulkBusy) setPendingBulkStatus(null); }}",
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Game Catalog safety contract fragment: ${fragment}`);
}

assert.equal(source.includes('data?.message'), false, 'Game Catalog must not render raw backend messages');
assert.equal(source.includes('gamesData?.message'), false, 'Game Catalog must not render raw game-list backend messages');
assert.equal(source.includes('providersData?.message'), false, 'Game Catalog must not render raw provider-list backend messages');

const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 5, `Expected at least 5 finally blocks, found ${finallyCount}`);

console.log('Admin Game Catalog safety contract passed');
