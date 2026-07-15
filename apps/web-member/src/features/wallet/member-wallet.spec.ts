import assert from 'node:assert/strict';
import test from 'node:test';
import { formatMemberWalletBalance, normalizeMemberWallet } from './member-wallet';

test('wallet normalization supports direct and wrapped API payloads', () => {
  const expected = { currency: 'THB', balance: '1290.5', availableBalance: '1250.5', lockedBalance: '40', status: 'ACTIVE' };
  assert.deepEqual(normalizeMemberWallet(expected), expected);
  assert.deepEqual(normalizeMemberWallet({ wallet: expected }), expected);
});

test('wallet normalization rejects incomplete or non-numeric balances', () => {
  assert.equal(normalizeMemberWallet(null), null);
  assert.equal(normalizeMemberWallet({ currency: 'THB', balance: '100', availableBalance: 'invalid', lockedBalance: '0' }), null);
  assert.equal(normalizeMemberWallet({ currency: 'THB', balance: '100', availableBalance: '100' }), null);
});

test('wallet formatter returns a stable Thai currency label', () => {
  const wallet = normalizeMemberWallet({ currency: 'thb', balance: '1250.5', availableBalance: '1250.5', lockedBalance: '0', status: 'ACTIVE' });
  assert.equal(formatMemberWalletBalance(wallet), 'THB 1,250.50');
  assert.equal(formatMemberWalletBalance(null), '—');
});
