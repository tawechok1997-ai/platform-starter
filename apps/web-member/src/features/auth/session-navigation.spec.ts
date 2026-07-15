import assert from 'node:assert/strict';
import test from 'node:test';
import { isPublicMemberRoute } from '../../../app/member-routes';
import { buildMemberLoginHrefFromExpiredSession, buildMemberSessionExpiredHref } from './session-navigation';

test('session expiry preserves the current internal destination', () => {
  assert.equal(
    buildMemberSessionExpiredHref('/withdraw', '?step=confirm', '#review'),
    '/session-expired?next=%2Fwithdraw%3Fstep%3Dconfirm%23review',
  );
});

test('session expiry avoids redirect loops and unsafe destinations', () => {
  assert.equal(buildMemberSessionExpiredHref('/session-expired', '?next=%2Fwithdraw'), '/session-expired');
  assert.equal(buildMemberSessionExpiredHref('//evil.example', '', ''), '/session-expired');
  assert.equal(buildMemberSessionExpiredHref('/login', '?next=%2Fwithdraw'), '/session-expired');
});

test('session-expired login action restores only a safe destination', () => {
  assert.equal(
    buildMemberLoginHrefFromExpiredSession('?next=%2Fprofile%2Fsecurity'),
    '/login?next=%2Fprofile%2Fsecurity',
  );
  assert.equal(buildMemberLoginHrefFromExpiredSession('?next=https%3A%2F%2Fevil.example'), '/login');
});

test('public recovery and status routes remain outside the member auth guard', () => {
  for (const route of ['/login', '/register', '/contact', '/guide', '/legal', '/maintenance', '/session-expired']) {
    assert.equal(isPublicMemberRoute(route), true, route);
  }
  assert.equal(isPublicMemberRoute('/withdraw'), false);
});
