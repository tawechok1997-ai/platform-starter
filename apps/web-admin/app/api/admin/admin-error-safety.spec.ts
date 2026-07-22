import assert from 'node:assert/strict';
import test from 'node:test';
import { safeAdminError, safeLogicalAdminError } from './admin-error-safety';

test('sanitizes non-success responses without exposing the upstream message', () => {
  assert.deepEqual(safeAdminError(500, JSON.stringify({ code: 'UPSTREAM_FAILURE', message: 'database host and stack trace' })), {
    code: 'UPSTREAM_FAILURE',
    message: 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง',
  });
});

test('sanitizes logical failures returned with HTTP 200', () => {
  assert.deepEqual(JSON.parse(safeLogicalAdminError(JSON.stringify({ ok: false, code: 'PROVIDER_FAILURE', message: 'provider secret leaked' }))), {
    ok: false,
    code: 'PROVIDER_FAILURE',
    message: 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่',
  });
});

test('preserves a success failure marker while sanitizing its message', () => {
  assert.deepEqual(JSON.parse(safeLogicalAdminError(JSON.stringify({ success: false, message: 'provider secret leaked' }))), {
    success: false,
    message: 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่',
  });
});

test('preserves successful payloads', () => {
  const payload = JSON.stringify({ ok: true, message: 'saved', item: { id: '1' } });
  assert.equal(safeLogicalAdminError(payload), payload);
});
