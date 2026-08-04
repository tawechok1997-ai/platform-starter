import assert from 'node:assert/strict';
import test from 'node:test';

import { adminNextPath, sessionDecision } from './admin-session-policy';

test('public and skip-auth requests never enter the refresh or login flow', () => {
  assert.equal(sessionDecision({ status: 401, skipAuth: true, pathname: '/login' }), 'continue');
  assert.equal(sessionDecision({ status: 403, skipAuth: true, pathname: '/accept-invitation' }), 'continue');
});

test('an expired authenticated session refreshes once and then fails closed to login', () => {
  assert.equal(sessionDecision({ status: 401, pathname: '/system-settings' }), 'refresh');
  assert.equal(sessionDecision({ status: 401, pathname: '/system-settings', hasRetried: true }), 'login');
});

test('ordinary permission denial keeps the authenticated session alive', () => {
  assert.equal(sessionDecision({ status: 403, responseCode: 'FORBIDDEN', pathname: '/admin-roles' }), 'continue');
  assert.equal(sessionDecision({ status: 403, responseCode: null, pathname: '/withdrawals' }), 'continue');
});

test('2FA-required responses enter setup once without creating a redirect loop', () => {
  assert.equal(sessionDecision({
    status: 403,
    responseCode: 'ADMIN_2FA_REQUIRED',
    pathname: '/provider-credentials',
  }), 'setup-2fa');
  assert.equal(sessionDecision({
    status: 403,
    responseCode: 'ADMIN_2FA_REQUIRED',
    pathname: '/security/2fa',
  }), 'continue');
});

test('next paths preserve query state and remain safely encoded', () => {
  assert.equal(
    adminNextPath('/settings/activities', '?tab=daily&return=/dashboard'),
    encodeURIComponent('/settings/activities?tab=daily&return=/dashboard'),
  );
});
