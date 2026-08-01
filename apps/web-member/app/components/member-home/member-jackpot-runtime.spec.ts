import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeMemberJackpotValue,
  MEMBER_JACKPOT_BASE_VALUE,
  MEMBER_JACKPOT_EPOCH_MS,
  MEMBER_JACKPOT_TICK_MS,
  resolveMemberJackpotLabel,
} from './member-jackpot-runtime';

test('shared jackpot uses one deterministic value for every viewport', () => {
  assert.equal(computeMemberJackpotValue(MEMBER_JACKPOT_EPOCH_MS), MEMBER_JACKPOT_BASE_VALUE);
  assert.equal(computeMemberJackpotValue(MEMBER_JACKPOT_EPOCH_MS + MEMBER_JACKPOT_TICK_MS), MEMBER_JACKPOT_BASE_VALUE + 4);
  assert.equal(computeMemberJackpotValue(MEMBER_JACKPOT_EPOCH_MS + (7 * MEMBER_JACKPOT_TICK_MS)), MEMBER_JACKPOT_BASE_VALUE + 28);
});

test('shared jackpot keeps running across time gaps instead of resetting on mount', () => {
  const firstVisit = MEMBER_JACKPOT_EPOCH_MS + (12 * MEMBER_JACKPOT_TICK_MS);
  const laterVisit = firstVisit + (25 * MEMBER_JACKPOT_TICK_MS);
  assert.ok(computeMemberJackpotValue(laterVisit) > computeMemberJackpotValue(firstVisit));
  assert.equal(resolveMemberJackpotLabel('', laterVisit), computeMemberJackpotValue(laterVisit).toLocaleString('en-US'));
});

test('an explicit CMS jackpot amount overrides the simulator', () => {
  assert.equal(resolveMemberJackpotLabel('฿ 1,234,567.89', MEMBER_JACKPOT_EPOCH_MS), '฿ 1,234,567.89');
  assert.equal(resolveMemberJackpotLabel('not configured', MEMBER_JACKPOT_EPOCH_MS), MEMBER_JACKPOT_BASE_VALUE.toLocaleString('en-US'));
});
