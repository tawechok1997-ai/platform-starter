import assert from 'node:assert/strict';
import test from 'node:test';
import { safeAdminCaughtError, safeAdminErrorMessage } from './admin-safe-error';

test('keeps a short business-safe message', () => {
  assert.equal(
    safeAdminErrorMessage({ message: 'รายการนี้ถูกตรวจสอบโดยผู้ดูแลคนอื่นแล้ว' }, 'fallback'),
    'รายการนี้ถูกตรวจสอบโดยผู้ดูแลคนอื่นแล้ว',
  );
});

test('maps known codes before backend messages', () => {
  assert.equal(
    safeAdminErrorMessage(
      { code: 'FORBIDDEN', message: 'Prisma stack should never be shown' },
      'fallback',
      { locale: 'en', status: 403 },
    ),
    'You do not have permission to perform this action.',
  );
});

test('replaces technical server messages with status copy', () => {
  assert.equal(
    safeAdminErrorMessage(
      { message: 'PrismaClientKnownRequestError at /app/node_modules/client.ts:42' },
      'fallback',
      { locale: 'th', status: 500 },
    ),
    'ระบบขัดข้องชั่วคราว กรุณาลองใหม่',
  );
});

test('rejects credential and token details', () => {
  assert.equal(
    safeAdminErrorMessage(
      { message: 'Bearer access_token abc123 is invalid' },
      'ทำรายการไม่สำเร็จ',
      { locale: 'th' },
    ),
    'ทำรายการไม่สำเร็จ',
  );
});

test('joins safe validation message arrays', () => {
  assert.equal(
    safeAdminErrorMessage({ message: ['กรอกชื่อสมาชิก', 'จำนวนเงินต้องมากกว่า 0'] }, 'fallback'),
    'กรอกชื่อสมาชิก • จำนวนเงินต้องมากกว่า 0',
  );
});

test('rejects oversized messages', () => {
  assert.equal(
    safeAdminErrorMessage({ message: 'x'.repeat(241) }, 'fallback'),
    'fallback',
  );
});

test('caught errors always use local fallback copy', () => {
  assert.equal(safeAdminCaughtError('เชื่อมต่อระบบไม่สำเร็จ'), 'เชื่อมต่อระบบไม่สำเร็จ');
});
