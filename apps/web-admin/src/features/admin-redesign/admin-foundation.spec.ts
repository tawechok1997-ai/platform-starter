import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccessNavItem, requiredPermissionsForPath } from '../../../app/(admin)/admin-nav';
import { adminNextPath, sessionDecision } from '../../../app/admin-session-policy';
import { hasAnyPermission, maskAccount, maskEmail, maskPhone } from '../../../app/(admin)/_components/member-mask';
import { adminProfileErrorMessage, adminProfileUpdatePayload, normalizeAdminProfileForm } from './admin-profile-form';

test('navigation only exposes protected items to matching permissions', () => {
  const item = { title: 'สมาชิก', href: '/members', permissions: ['users.view'] } as const;
  assert.equal(canAccessNavItem(item, []), false);
  assert.equal(canAccessNavItem(item, ['users.view']), true);
  assert.equal(canAccessNavItem(item, ['*']), true);
});

test('route permission matching prefers the most specific route', () => {
  assert.deepEqual(requiredPermissionsForPath('/member-insights'), ['users.view']);
  assert.deepEqual(requiredPermissionsForPath('/provider-health'), ['game.providers.view', 'provider.view']);
  assert.deepEqual(requiredPermissionsForPath('/exports'), ['reports.export', 'reports.view']);
});

test('session policy handles refresh, forbidden responses and 2FA without login loops', () => {
  assert.equal(sessionDecision({ status: 401, pathname: '/dashboard' }), 'refresh');
  assert.equal(sessionDecision({ status: 401, pathname: '/dashboard', hasRetried: true }), 'login');
  assert.equal(sessionDecision({ status: 403, pathname: '/dashboard', responseCode: 'ADMIN_2FA_REQUIRED' }), 'setup-2fa');
  assert.equal(sessionDecision({ status: 403, pathname: '/dashboard', responseCode: 'FORBIDDEN' }), 'continue');
  assert.equal(sessionDecision({ status: 403, pathname: '/dashboard' }), 'continue');
  assert.equal(sessionDecision({ status: 200, pathname: '/dashboard' }), 'continue');
  assert.equal(sessionDecision({ status: 401, pathname: '/login', skipAuth: true }), 'continue');
});

test('next path preserves pathname and query safely', () => {
  assert.equal(adminNextPath('/members', '?page=2&status=ACTIVE'), '%2Fmembers%3Fpage%3D2%26status%3DACTIVE');
});

test('field masking preserves only the minimum useful suffix', () => {
  assert.equal(maskPhone('081-234-5678', false), 'xxx-xxx-5678');
  assert.equal(maskPhone('081-234-5678', true), '081-234-5678');
  assert.equal(maskEmail('member@example.com', false), 'me***@example.com');
  assert.equal(maskEmail('member@example.com', true), 'member@example.com');
  assert.equal(maskAccount('1234567890', false), '••••••7890');
  assert.equal(maskAccount('1234567890', true), '1234567890');
});

test('permission helper supports explicit permission and super admin', () => {
  assert.equal(hasAnyPermission(['wallet.view'], ['wallet.view']), true);
  assert.equal(hasAnyPermission(['users.view'], ['wallet.view']), false);
  assert.equal(hasAnyPermission(['*'], ['wallet.view']), true);
});

test('profile update normalizes missing API values and trims the submitted payload', () => {
  const normalized = normalizeAdminProfileForm({
    displayName: ' Admin ',
    firstName: null,
    department: 42,
    avatarUrl: ' https://example.com/avatar.png ',
  });

  assert.deepEqual(normalized, {
    displayName: ' Admin ',
    firstName: '',
    lastName: '',
    position: '',
    department: '',
    avatarUrl: ' https://example.com/avatar.png ',
  });

  assert.deepEqual(adminProfileUpdatePayload(normalized), {
    displayName: 'Admin',
    firstName: '',
    lastName: '',
    position: '',
    department: '',
    avatarUrl: 'https://example.com/avatar.png',
  });
});

test('profile API error parser only accepts non-empty string messages', () => {
  assert.equal(adminProfileErrorMessage({ message: 'Profile rejected' }, 'fallback'), 'Profile rejected');
  assert.equal(adminProfileErrorMessage({ message: 42 }, 'fallback'), 'fallback');
  assert.equal(adminProfileErrorMessage(null, 'fallback'), 'fallback');
});
