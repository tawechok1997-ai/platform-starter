import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  canAccessPath,
  navGroups,
  requiredPermissionsForPath,
} from './admin-nav';

const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');

test('system settings is discoverable from the administration navigation group', () => {
  const administration = navGroups.find((group) => group.id === 'administration');
  assert.ok(administration);

  const systemSettings = administration.items.find((item) => item.href === '/system-settings');
  assert.ok(systemSettings);
  assert.equal(systemSettings.title, 'การตั้งค่าระบบ');
  assert.equal(systemSettings.titleEn, 'System settings');
  assert.deepEqual(systemSettings.permissions, [
    'provider.view',
    'provider.update',
    'game.providers.view',
    'game.providers.manage',
    'settings.features.view',
  ]);
});

test('system settings permission guard is registered and fails closed', () => {
  assert.deepEqual(requiredPermissionsForPath('/system-settings'), [
    'provider.view',
    'provider.update',
    'game.providers.view',
    'game.providers.manage',
    'settings.features.view',
  ]);
  assert.equal(canAccessPath('/system-settings', ['provider.view']), true);
  assert.equal(canAccessPath('/system-settings/providers', ['game.providers.view']), true);
  assert.equal(canAccessPath('/system-settings', ['users.view']), false);
});

test('activity settings uses the specific feature permission instead of the parent settings permissions', () => {
  assert.deepEqual(requiredPermissionsForPath('/settings/activities'), ['settings.features.view']);
  assert.deepEqual(requiredPermissionsForPath('/settings/activities/daily-mission'), ['settings.features.view']);
  assert.equal(canAccessPath('/settings/activities', ['settings.features.view']), true);
  assert.equal(canAccessPath('/settings/activities', ['settings.website.view']), false);
});

test('unregistered P8 routes remain denied even for wildcard admins', () => {
  assert.deepEqual(requiredPermissionsForPath('/p8-unregistered-route'), ['__admin.route.unregistered__']);
  assert.equal(canAccessPath('/p8-unregistered-route', ['admin.view']), false);
  assert.equal(canAccessPath('/p8-unregistered-route', ['*']), false);
});

test('protected layout delegates route authorization to the canonical fail-closed owner', () => {
  assert.match(layoutSource, /import \{[^}]*canAccessPath[^}]*\} from '\.\/admin-nav';/s);
  assert.match(layoutSource, /const canViewRoute = canAccessPath\(pathname, permissions\);/);
  assert.doesNotMatch(layoutSource, /permissions\.includes\('\*'\) \|\| required\.some/);
  assert.doesNotMatch(layoutSource, /requiredPermissionsForPath\(pathname\)/);
});
