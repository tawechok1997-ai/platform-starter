import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAdminDataViewStorageKey,
  emptyEnvelope,
  normalizeColumnPreferences,
  parseAdminDataViewEnvelope,
  removeAdminSavedView,
  serializeAdminDataViewEnvelope,
  upsertAdminSavedView,
  visibleColumnIds,
} from './data-view-preferences';

const query = {
  page: 1,
  pageSize: 20,
  search: '',
  sort: { columnId: 'createdAt', direction: 'desc' as const },
  filters: { status: 'OPEN' },
};

test('column preferences preserve known order, required columns, and new columns', () => {
  const preferences = normalizeColumnPreferences(
    ['id', 'status', 'amount', 'createdAt'],
    [
      { columnId: 'amount', visible: false, order: 0 },
      { columnId: 'id', visible: false, order: 1 },
      { columnId: 'removed', visible: true, order: 2 },
    ],
    ['id'],
  );

  assert.deepEqual(preferences, [
    { columnId: 'amount', visible: false, order: 0 },
    { columnId: 'id', visible: true, order: 1 },
    { columnId: 'status', visible: true, order: 2 },
    { columnId: 'createdAt', visible: true, order: 3 },
  ]);
  assert.deepEqual(visibleColumnIds(preferences), ['id', 'status', 'createdAt']);
});

test('saved views are upserted deterministically and capped', () => {
  const first = upsertAdminSavedView(emptyEnvelope(), {
    id: 'open-items',
    name: 'Open items',
    query,
    columns: [],
    updatedAt: '2026-08-03T00:00:00.000Z',
  });
  const second = upsertAdminSavedView(first, {
    id: 'recent',
    name: 'Recent',
    query: { ...query, filters: {} },
    columns: [],
    updatedAt: '2026-08-03T01:00:00.000Z',
  }, 2);

  assert.equal(second.activeViewId, 'recent');
  assert.deepEqual(second.views.map((view) => view.id), ['recent', 'open-items']);
  assert.equal(removeAdminSavedView(second, 'recent').activeViewId, null);
});

test('storage envelope rejects unknown versions and malformed JSON', () => {
  assert.deepEqual(parseAdminDataViewEnvelope('{broken'), emptyEnvelope());
  assert.deepEqual(parseAdminDataViewEnvelope(JSON.stringify({ version: 2, views: [] })), emptyEnvelope());
});

test('storage envelope round-trips only validated views', () => {
  const envelope = upsertAdminSavedView(emptyEnvelope(), {
    id: ' finance ',
    name: ' Finance queue ',
    query,
    columns: [{ columnId: 'status', visible: true, order: 0 }],
    updatedAt: '2026-08-03T01:00:00+00:00',
  });
  const restored = parseAdminDataViewEnvelope(serializeAdminDataViewEnvelope(envelope));

  assert.equal(restored.views[0]?.id, 'finance');
  assert.equal(restored.views[0]?.name, 'Finance queue');
  assert.equal(restored.views[0]?.updatedAt, '2026-08-03T01:00:00.000Z');
});

test('storage key is versioned and user scoped', () => {
  assert.equal(buildAdminDataViewStorageKey('user/1', 'withdraw queue'), 'admin_data_views_v1:user_1:withdraw_queue');
});
