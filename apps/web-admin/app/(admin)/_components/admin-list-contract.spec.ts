import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAdminListQuery, normalizeAdminListPayload, paginateAdminItems } from './admin-list-contract';

test('normalizes server list metadata with safe fallbacks', () => {
  assert.deepEqual(normalizeAdminListPayload<number>({ items: [1, 2], total: 12, page: 2, pageSize: 5 }), {
    items: [1, 2], total: 12, page: 2, pageSize: 5, totalPages: 3,
  });
  assert.deepEqual(normalizeAdminListPayload<number>({ items: [1, 2] }, 1, 25), {
    items: [1, 2], total: 2, page: 1, pageSize: 25, totalPages: 1,
  });
});

test('clamps client pagination when filters shrink the result set', () => {
  assert.deepEqual(paginateAdminItems([1, 2, 3], 4, 2), {
    items: [3], page: 2, pageSize: 2, total: 3, totalPages: 2,
  });
});

test('builds stable query strings without empty values', () => {
  assert.equal(
    buildAdminListQuery({ page: 2, pageSize: 25, query: 'provider tx', status: '', active: false }),
    '?page=2&pageSize=25&query=provider+tx',
  );
});
