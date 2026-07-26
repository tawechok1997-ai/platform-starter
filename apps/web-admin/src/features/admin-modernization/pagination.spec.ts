import assert from 'node:assert/strict';
import test from 'node:test';

import { clampPage, getPageCount, getPaginationTokens, getVisibleItemRange } from './pagination';

test('page count and clamp stay safe for empty and invalid values', () => {
  assert.equal(getPageCount(0, 20), 1);
  assert.equal(getPageCount(101, 20), 6);
  assert.equal(getPageCount(10, 0), 1);
  assert.equal(clampPage(-4, 10), 1);
  assert.equal(clampPage(99, 10), 10);
});

test('visible item range reports compact human-readable boundaries', () => {
  assert.deepEqual(getVisibleItemRange(1, 20, 0), { from: 0, to: 0 });
  assert.deepEqual(getVisibleItemRange(1, 20, 53), { from: 1, to: 20 });
  assert.deepEqual(getVisibleItemRange(3, 20, 53), { from: 41, to: 53 });
});

test('pagination tokens keep first, last, current and nearby pages', () => {
  assert.deepEqual(getPaginationTokens({ page: 1, pageSize: 20, totalItems: 80 }), [1, 2, 3, 4]);
  assert.deepEqual(getPaginationTokens({ page: 10, pageSize: 10, totalItems: 200 }), [1, 'ellipsis-start', 9, 10, 11, 'ellipsis-end', 20]);
  assert.deepEqual(getPaginationTokens({ page: 20, pageSize: 10, totalItems: 200 }), [1, 'ellipsis-start', 19, 20]);
});
