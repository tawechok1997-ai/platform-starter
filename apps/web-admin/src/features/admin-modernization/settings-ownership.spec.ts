import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADMIN_SETTINGS_ROUTE_REGISTRY,
  buildAdminSettingsRedirect,
  resolveAdminSettingsOwner,
  validateAdminSettingsOwnership,
  validateSensitiveAdminSettingsChange,
} from './settings-ownership';

test('P6 keeps exactly two settings write owners', () => {
  assert.deepEqual(
    [...new Set(ADMIN_SETTINGS_ROUTE_REGISTRY.map((definition) => definition.owner))].sort(),
    ['/settings', '/system-settings'],
  );
  assert.deepEqual(validateAdminSettingsOwnership(), []);
});

test('member-facing and provider-facing settings resolve to separate owners', () => {
  assert.equal(resolveAdminSettingsOwner('/settings/branding'), '/settings');
  assert.equal(resolveAdminSettingsOwner('/provider-credentials'), '/system-settings');
  assert.equal(resolveAdminSettingsOwner('/unknown'), null);
});

test('legacy redirects preserve incoming query and hash without replacing owner parameters', () => {
  assert.equal(
    buildAdminSettingsRedirect('/settings/branding/history', '?page=2&panel=ignored', '#entry-10'),
    '/settings?section=experience&panel=branding-history&page=2#entry-10',
  );
  assert.equal(
    buildAdminSettingsRedirect('/game-api-settings', 'provider=PG'),
    '/system-settings?section=providers&panel=legacy-api&provider=PG',
  );
});

test('sensitive changes require permission confirmation reason and audit metadata', () => {
  assert.deepEqual(validateSensitiveAdminSettingsChange({
    route: '/settings/maintenance',
    permission: 'settings.maintenance.update',
    confirmed: true,
    reason: 'Planned maintenance',
    auditAction: 'SETTINGS_MAINTENANCE_UPDATE',
  }), []);
  assert.deepEqual(validateSensitiveAdminSettingsChange({
    route: '/settings/maintenance',
    permission: 'settings.maintenance.view',
    confirmed: false,
    reason: 'short',
    auditAction: '',
  }), [
    'Missing permission: settings.maintenance.update',
    'Confirmation is required',
    'Reason must contain at least 8 characters',
    'Audit action is required',
  ]);
});

test('normal settings do not require sensitive mutation ceremony', () => {
  assert.deepEqual(validateSensitiveAdminSettingsChange({
    route: '/settings/contact',
    permission: '',
    confirmed: false,
    reason: '',
    auditAction: '',
  }), []);
});
