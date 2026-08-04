import assert from 'node:assert/strict';
import test from 'node:test';

import {
  diffAdminValues,
  hasAdminValueChanges,
  normalizeAdminFieldErrors,
  redactAdminDiff,
} from './form-state';

test('field errors normalize array and object API payloads', () => {
  assert.deepEqual(normalizeAdminFieldErrors({ email: 'Invalid', roles: ['Required', 'Too many'] }), [
    { field: 'email', message: 'Invalid' },
    { field: 'roles', message: 'Required' },
    { field: 'roles', message: 'Too many' },
  ]);
  assert.deepEqual(normalizeAdminFieldErrors([{ field: 'reason', message: 'Required' }, null]), [
    { field: 'reason', message: 'Required' },
  ]);
});

test('nested before-after diff is stable and path based', () => {
  const diffs = diffAdminValues(
    { profile: { name: 'A', active: true }, roles: ['finance'] },
    { profile: { name: 'B', active: true }, roles: ['finance', 'risk'] },
  );

  assert.deepEqual(diffs, [
    { path: 'profile.name', before: 'A', after: 'B' },
    { path: 'roles[1]', before: undefined, after: 'risk' },
  ]);
  assert.equal(hasAdminValueChanges({ a: 1 }, { a: 1 }), false);
  assert.equal(hasAdminValueChanges({ a: 1 }, { a: 2 }), true);
});

test('sensitive values are redacted before audit preview rendering', () => {
  const diffs = diffAdminValues({ apiKey: 'old', enabled: false }, { apiKey: 'new', enabled: true });
  assert.deepEqual(redactAdminDiff(diffs, ['apiKey']), [
    { path: 'apiKey', before: '[REDACTED]', after: '[REDACTED]' },
    { path: 'enabled', before: false, after: true },
  ]);
});
