import assert from 'node:assert/strict';
import test from 'node:test';

import {
  nextAdminSort,
  parseAdminTableQuery,
  serializeAdminTableQuery,
  updateAdminTableQuery,
} from './data-query-state';

test('table query parser keeps only allowed page, sort, and filter values', () => {
  const params = new URLSearchParams({
    page: '3',
    take: '50',
    q: '  pending   member  ',
    sort: 'createdAt',
    direction: 'desc',
    'filter.status': 'PENDING',
    'filter.unsafe': 'ignored',
  });
  const state = parseAdminTableQuery(params, {
    allowedPageSizes: [20, 50, 100],
    allowedSortColumns: ['createdAt'],
    allowedFilterKeys: ['status'],
  });

  assert.deepEqual(state, {
    page: 3,
    pageSize: 50,
    search: 'pending member',
    sort: { columnId: 'createdAt', direction: 'desc' },
    filters: { status: 'PENDING' },
  });
});

test('invalid values fall back without leaking unknown query state', () => {
  const state = parseAdminTableQuery(new URLSearchParams({
    page: '-2',
    take: '999',
    sort: 'secret',
    direction: 'up',
  }), {
    page: 2,
    pageSize: 20,
    allowedPageSizes: [20, 50],
    allowedSortColumns: ['createdAt'],
  });

  assert.equal(state.page, 2);
  assert.equal(state.pageSize, 20);
  assert.equal(state.sort, null);
});

test('query serialization is deterministic and uses API-compatible take parameter', () => {
  const params = serializeAdminTableQuery({
    page: 4,
    pageSize: 50,
    search: 'alice',
    sort: { columnId: 'createdAt', direction: 'asc' },
    filters: { type: 'ADMIN', status: 'ACTIVE' },
  });

  assert.equal(params.toString(), 'page=4&take=50&q=alice&sort=createdAt&direction=asc&filter.status=ACTIVE&filter.type=ADMIN');
});

test('search, sort, filter, and page-size changes reset the page', () => {
  const base = parseAdminTableQuery(new URLSearchParams({ page: '8', take: '20' }));
  assert.equal(updateAdminTableQuery(base, { search: 'new' }).page, 1);
  assert.equal(updateAdminTableQuery(base, { pageSize: 50 }).page, 1);
  assert.equal(updateAdminTableQuery(base, { filters: { status: 'OPEN' } }).page, 1);
  assert.equal(updateAdminTableQuery(base, { page: 3 }).page, 3);
});

test('sort interaction cycles ascending, descending, and off', () => {
  const ascending = nextAdminSort(null, 'createdAt');
  const descending = nextAdminSort(ascending, 'createdAt');
  const cleared = nextAdminSort(descending, 'createdAt');

  assert.deepEqual(ascending, { columnId: 'createdAt', direction: 'asc' });
  assert.deepEqual(descending, { columnId: 'createdAt', direction: 'desc' });
  assert.equal(cleared, null);
  assert.deepEqual(nextAdminSort(descending, 'amount'), { columnId: 'amount', direction: 'asc' });
});
