import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  DEPOSIT_FORM_DEFAULTS,
  parseDepositAmount,
  resolveDepositError,
  serializeDepositCreateRequest,
  serializeDepositEvidenceRequest,
  validateDepositSelection,
} from './deposit-form';
import { financeInvalidationRules, financeQueryKeys } from './query-keys';

const account = {
  id: 'bank-1',
  bankName: 'Example Bank',
  accountName: 'Platform Member',
  accountNumber: '1234567890',
  promptPay: null,
  qrImageUrl: null,
  minAmount: '100',
  maxAmount: '5000',
};

test('deposit defaults and amount parsing remain stable', () => {
  assert.deepEqual(DEPOSIT_FORM_DEFAULTS, {
    amount: '500',
    method: 'bank_transfer',
    transactionRef: '',
    note: '',
  });
  assert.equal(parseDepositAmount(' 1,250.50 '), 1250.5);
});

test('deposit selection rejects invalid amount and unavailable methods', () => {
  assert.equal(
    validateDepositSelection({ ...DEPOSIT_FORM_DEFAULTS, amount: '0' }, ['bank_transfer']),
    'กรุณาใส่จำนวนเงินมากกว่า 0',
  );
  assert.equal(
    validateDepositSelection({ ...DEPOSIT_FORM_DEFAULTS, method: 'promptpay' }, ['bank_transfer']),
    'ยังไม่มีบัญชีธนาคารสำหรับยอดหรือช่องทางนี้',
  );
  assert.equal(validateDepositSelection(DEPOSIT_FORM_DEFAULTS, ['bank_transfer']), null);
});

test('deposit request serializers normalize references and preserve account evidence', () => {
  const values = { ...DEPOSIT_FORM_DEFAULTS, amount: '1,500', transactionRef: '  TX-42  ', note: 'member note' };
  const request = serializeDepositCreateRequest(values, account);
  assert.equal(request.amount, 1500);
  assert.equal(request.referenceCode, 'TX-42');
  assert.deepEqual(JSON.parse(request.note), {
    userNote: 'member note',
    paymentType: 'bank_transfer',
    receivingBankAccountId: 'bank-1',
    receivingBank: account,
  });

  const evidence = serializeDepositEvidenceRequest(values, 'data:image/jpeg;base64,abc', 'slip.jpg');
  assert.equal(evidence.transactionRef, 'TX-42');
  assert.equal(evidence.detectedAmount, '1500');
  assert.match(evidence.transferredAt, /^\d{4}-\d{2}-\d{2}T/);
});

test('error mapping uses API message only when it is a non-empty string', () => {
  assert.equal(resolveDepositError({ message: 'specific failure' }, 'fallback'), 'specific failure');
  assert.equal(resolveDepositError({ message: '   ' }, 'fallback'), 'fallback');
  assert.equal(resolveDepositError(null, 'fallback'), 'fallback');
});

test('finance query keys and invalidation rules are deterministic', () => {
  assert.deepEqual(financeQueryKeys.topUpList(), ['finance', 'topups', 'list', 'self']);
  assert.deepEqual(financeQueryKeys.topUpList('member-1'), ['finance', 'topups', 'list', 'member-1']);
  assert.deepEqual(financeQueryKeys.receivingAccount('promptpay', 500), [
    'finance',
    'receiving-accounts',
    'detail',
    'promptpay',
    500,
  ]);
  assert.deepEqual(financeInvalidationRules.afterDepositCreated, [
    ['finance', 'topups'],
    ['finance', 'topups', 'list', 'self'],
  ]);
});

test('extracted presentation components keep route orchestration out of views', () => {
  const depositView = fs.readFileSync(new URL('./deposit-view.tsx', import.meta.url), 'utf8');
  const withdrawalView = fs.readFileSync(new URL('./withdrawal-view.tsx', import.meta.url), 'utf8');
  for (const source of [depositView, withdrawalView]) {
    assert.equal(source.includes('memberApiFetch('), false);
    assert.equal(source.includes('useEffect('), false);
  }
  assert.match(depositView, /export function DepositView/);
  assert.match(withdrawalView, /export function WithdrawalView/);
});
