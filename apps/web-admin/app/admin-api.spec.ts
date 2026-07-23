import assert from 'node:assert/strict';
import test from 'node:test';
import { adminMutationSignature, createAdminIdempotencyKey } from './admin-api';

test('mutation signature is stable for the same method, path, and body', () => {
  const first = adminMutationSignature('/admin/topups/item/confirm-credit', { method: 'POST', body: JSON.stringify({ adminNote: 'checked' }) });
  const second = adminMutationSignature('/admin/topups/item/confirm-credit', { method: 'post', body: JSON.stringify({ adminNote: 'checked' }) });
  assert.equal(first, second);
});

test('mutation signature changes when the body changes', () => {
  const first = adminMutationSignature('/admin/topups/item/reject', { method: 'POST', body: JSON.stringify({ adminNote: 'reason one' }) });
  const second = adminMutationSignature('/admin/topups/item/reject', { method: 'POST', body: JSON.stringify({ adminNote: 'reason two' }) });
  assert.notEqual(first, second);
});

test('mutation signature does not expose the raw request body', () => {
  const secret = '123456';
  const signature = adminMutationSignature('/admin/withdrawals/batch/workflow', { method: 'POST', body: JSON.stringify({ stepUpCode: secret }) });
  assert.equal(signature.includes(secret), false);
  assert.equal(signature.includes('stepUpCode'), false);
});

test('idempotency keys use the admin namespace', () => {
  const key = createAdminIdempotencyKey();
  assert.match(key, /^admin-[a-z0-9-]+$/i);
});
