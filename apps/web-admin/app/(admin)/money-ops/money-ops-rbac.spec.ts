import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { canAccessPath, requiredPermissionsForPath } from '../admin-nav';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('Money Ops route permission matches the API read contract', () => {
  assert.deepEqual(requiredPermissionsForPath('/money-ops'), ['game.providers.view']);
  assert.equal(canAccessPath('/money-ops', ['wallet.view']), false);
  assert.equal(canAccessPath('/money-ops', ['game.providers.view']), true);
});

test('Money Ops mutations are visible only with provider manage permission', () => {
  assert.match(source, /permissions\.includes\('game\.providers\.manage'\)/);
  assert.ok((source.match(/\{canManage && <AdminButton/g) ?? []).length >= 3);
  assert.match(source, /scanAlerts\(\)/);
  assert.match(source, /requestAlertAction\(alert, 'resolve'\)/);
  assert.match(source, /requestAlertAction\(alert, 'dismiss'\)/);
});

test('Money Ops uses production interaction and state contracts', () => {
  assert.match(source, /useAdminLocale/);
  assert.match(source, /AdminConfirmDialog/);
  assert.match(source, /AdminSkeleton/);
  assert.match(source, /AdminEmpty/);
  assert.match(source, /readOnlyDescription/);
  assert.match(source, /tone=\{pendingAction\?\.action === 'dismiss' \? 'danger' : 'success'\}/);
  assert.doesNotMatch(source, /window\.prompt/);
  assert.doesNotMatch(source, />\s*TODO\s*</);
});
