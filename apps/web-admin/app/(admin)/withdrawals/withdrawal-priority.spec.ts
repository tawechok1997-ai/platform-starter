import assert from 'node:assert/strict';
import test from 'node:test';
import {
  sortWithdrawalsByPriority,
  withdrawalAgeMinutes,
  withdrawalPriorityScore,
  withdrawalSlaTone,
} from './withdrawal-priority';

const NOW = new Date('2026-07-24T00:00:00.000Z').getTime();

test('prioritizes proof verification before payment and review queues', () => {
  const items = [
    { id: 'review', status: 'PENDING_REVIEW' as const, createdAt: '2026-07-23T23:50:00.000Z' },
    { id: 'payment', status: 'APPROVED_FOR_PAYMENT' as const, createdAt: '2026-07-23T23:50:00.000Z' },
    { id: 'proof', status: 'PAYMENT_PROOF_UPLOADED' as const, createdAt: '2026-07-23T23:50:00.000Z' },
  ];
  assert.deepEqual(sortWithdrawalsByPriority(items, NOW).map((item) => item.id), ['proof', 'payment', 'review']);
});

test('raises overdue and unclaimed work inside the same workflow state', () => {
  const freshClaimed = { id: 'fresh', status: 'PENDING_REVIEW' as const, createdAt: '2026-07-23T23:50:00.000Z', claimedBy: 'admin' };
  const overdueUnclaimed = { id: 'overdue', status: 'PENDING_REVIEW' as const, createdAt: '2026-07-23T22:30:00.000Z', claimedBy: null };
  assert.ok(withdrawalPriorityScore(overdueUnclaimed, NOW) > withdrawalPriorityScore(freshClaimed, NOW));
});

test('exposes stable SLA ages and tones', () => {
  assert.equal(withdrawalAgeMinutes('2026-07-23T23:30:00.000Z', NOW), 30);
  assert.equal(withdrawalSlaTone(29), 'neutral');
  assert.equal(withdrawalSlaTone(30), 'warning');
  assert.equal(withdrawalSlaTone(60), 'danger');
});
