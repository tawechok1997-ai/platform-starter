import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyAdminSettingsMutationHeaders,
  resolveAdminSettingsMutationContext,
  validateAdminSettingsMutationRules,
} from './admin-settings-mutation-owner';

test('settings mutations resolve to exactly one of the two workspace owners', () => {
  assert.equal(resolveAdminSettingsMutationContext('/admin/settings/branding', '/settings/branding')?.owner, '/settings');
  assert.equal(resolveAdminSettingsMutationContext('/admin/provider-credentials/abc', '/provider-credentials')?.owner, '/system-settings');
  assert.equal(resolveAdminSettingsMutationContext('/admin/members/abc', '/members'), null);
  assert.deepEqual(validateAdminSettingsMutationRules(), []);
});

test('mutation metadata records owner, source route, domain and impact without overwriting explicit audit headers', () => {
  const headers = new Headers({ 'X-Admin-Settings-Owner': '/settings' });
  const context = applyAdminSettingsMutationHeaders(headers, '/admin/provider-credentials/provider-a', '/provider-credentials?tab=secret');
  assert.equal(context?.owner, '/system-settings');
  assert.equal(headers.get('X-Admin-Settings-Owner'), '/settings');
  assert.equal(headers.get('X-Admin-Settings-Source-Route'), '/provider-credentials');
  assert.equal(headers.get('X-Admin-Settings-Domain'), 'provider.credentials');
  assert.equal(headers.get('X-Admin-Settings-Impact'), 'sensitive');
});
