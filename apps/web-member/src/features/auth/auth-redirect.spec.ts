import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMemberLoginDestination } from './auth-redirect';

test('login destination preserves an internal path, query, and hash', () => {
  assert.equal(
    resolveMemberLoginDestination('?next=%2Fwithdraw%3Fstep%3Dconfirm%23review'),
    '/withdraw?step=confirm#review',
  );
});

test('login destination falls back to home for unsafe or recursive targets', () => {
  const unsafeTargets = [
    '?next=https%3A%2F%2Fevil.example',
    '?next=%2F%2Fevil.example',
    '?next=%2F%5Cevil.example',
    '?next=%2Flogin%3Fnext%3D%252Fwithdraw',
    '?next=%2Fregister',
    '?next=withdraw',
    '',
  ];

  for (const search of unsafeTargets) assert.equal(resolveMemberLoginDestination(search), '/');
});
