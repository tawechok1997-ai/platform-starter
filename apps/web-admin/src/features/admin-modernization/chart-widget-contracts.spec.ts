import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAccessAdminWidget,
  createAdminWidgetRegistry,
  getAdminWidgetLayoutStorageKey,
  moveAdminWidget,
  normalizeAdminWidgetLayout,
  parseAdminWidgetLayout,
  resolveAdminCompareRange,
  resolveAdminDateRange,
  restoreDefaultAdminWidgetLayout,
  serializeAdminWidgetLayout,
  updateAdminWidgetLayoutItem,
  type AdminWidgetDefinition,
} from './chart-widget-contracts';

const definitions: AdminWidgetDefinition[] = [
  {
    id: 'finance.cash-flow',
    title: 'Cash flow',
    chartKind: 'bar',
    requiredPermissions: ['reports.view', 'wallet.view'],
    defaultLayout: { order: 1, columns: 2, rows: 1, pinned: false },
    allowFullscreen: true,
    allowDrillDown: true,
    exportFormats: ['csv', 'png'],
  },
  {
    id: 'risk.open-alerts',
    title: 'Open alerts',
    chartKind: 'donut',
    requiredPermissions: ['risk.view'],
    defaultLayout: { order: 0, columns: 1, rows: 1, pinned: true },
    exportFormats: ['csv'],
  },
  {
    id: 'system.health',
    title: 'System health',
    defaultLayout: { order: 2, columns: 1, rows: 1, pinned: false },
  },
];

const financeDefinition = definitions[0];
if (!financeDefinition) throw new Error('Finance widget definition fixture is missing');
const registry = createAdminWidgetRegistry(definitions);

test('widget registry rejects duplicate and malformed ids', () => {
  assert.throws(() => createAdminWidgetRegistry([financeDefinition, financeDefinition]), /Duplicate Admin widget id/);
  assert.throws(() => createAdminWidgetRegistry([{ ...financeDefinition, id: 'Finance Widget' }]), /Invalid Admin widget id/);
});

test('widget registry resolves permission-aware visibility', () => {
  assert.equal(canAccessAdminWidget(financeDefinition, ['wallet.view']), true);
  assert.equal(canAccessAdminWidget(financeDefinition, ['risk.view']), false);
  assert.deepEqual(registry.visibleTo(['risk.view']).map((item) => item.id), ['risk.open-alerts', 'system.health']);
  assert.equal(registry.visibleTo(['*']).length, definitions.length);
  assert.equal(registry.get('missing'), null);
});

test('default layout pins widgets first and preserves deterministic order', () => {
  assert.deepEqual(restoreDefaultAdminWidgetLayout(registry).map((item) => item.widgetId), [
    'risk.open-alerts',
    'finance.cash-flow',
    'system.health',
  ]);
});

test('saved layout ignores unknown duplicates and clamps unsafe spans', () => {
  const layout = normalizeAdminWidgetLayout(registry, [
    { widgetId: 'finance.cash-flow', order: 9, columns: 99, rows: -4, pinned: false, hidden: true },
    { widgetId: 'finance.cash-flow', order: 0, columns: 1, rows: 1, pinned: true },
    { widgetId: 'unknown.widget', order: 0, columns: 4, rows: 3 },
  ]);

  assert.equal(layout.length, definitions.length);
  assert.deepEqual(layout.map((item) => item.widgetId), ['risk.open-alerts', 'finance.cash-flow', 'system.health']);
  assert.deepEqual(layout.map((item) => item.order), [0, 1, 2]);
  assert.deepEqual(layout.find((item) => item.widgetId === 'finance.cash-flow'), {
    widgetId: 'finance.cash-flow',
    order: 1,
    columns: 4,
    rows: 1,
    pinned: false,
    hidden: true,
  });
});

test('drag resize pin and restore operations stay immutable', () => {
  const defaults = restoreDefaultAdminWidgetLayout(registry);
  const moved = moveAdminWidget(defaults, 'system.health', 0);
  assert.notEqual(moved, defaults);
  assert.deepEqual(moved.map((item) => item.widgetId), ['system.health', 'risk.open-alerts', 'finance.cash-flow']);
  assert.deepEqual(defaults.map((item) => item.widgetId), ['risk.open-alerts', 'finance.cash-flow', 'system.health']);

  const pinned = updateAdminWidgetLayoutItem(moved, 'finance.cash-flow', { pinned: true, columns: 3, rows: 2 });
  const firstPinned = pinned[0];
  assert.ok(firstPinned);
  assert.deepEqual(pinned.map((item) => item.widgetId), ['finance.cash-flow', 'risk.open-alerts', 'system.health']);
  assert.equal(firstPinned.columns, 3);
  assert.equal(firstPinned.rows, 2);
});

test('saved layout payload is versioned and isolated per administrator', () => {
  const layout = restoreDefaultAdminWidgetLayout(registry);
  const serialized = serializeAdminWidgetLayout('admin-1', layout, '2026-08-03T00:00:00.000Z');
  const parsed = parseAdminWidgetLayout(serialized, 'admin-1');
  assert.equal(parsed?.version, 1);
  assert.equal(parsed?.adminUserId, 'admin-1');
  assert.equal(parsed?.items.length, definitions.length);
  assert.equal(parseAdminWidgetLayout(serialized, 'admin-2'), null);
  assert.equal(parseAdminWidgetLayout('{broken', 'admin-1'), null);
  assert.equal(getAdminWidgetLayoutStorageKey(' admin/1 '), 'admin_widget_layout_v1:admin%2F1');
});

test('date presets and compare periods are deterministic', () => {
  const now = new Date('2026-08-03T19:30:00.000Z');
  assert.deepEqual(resolveAdminDateRange('today', { now }), { start: '2026-08-03', end: '2026-08-03' });
  assert.deepEqual(resolveAdminDateRange('7d', { now }), { start: '2026-07-28', end: '2026-08-03' });
  assert.deepEqual(resolveAdminDateRange('30d', { now }), { start: '2026-07-05', end: '2026-08-03' });
  assert.deepEqual(resolveAdminDateRange('custom', { customStart: '2026-07-01', customEnd: '2026-07-31' }), { start: '2026-07-01', end: '2026-07-31' });
  assert.throws(() => resolveAdminDateRange('custom', { customStart: '2026-08-03', customEnd: '2026-08-01' }), /Invalid custom/);

  assert.deepEqual(resolveAdminCompareRange({ start: '2026-07-28', end: '2026-08-03' }, 'previous-period'), {
    start: '2026-07-21',
    end: '2026-07-27',
  });
  assert.deepEqual(resolveAdminCompareRange({ start: '2026-07-28', end: '2026-08-03' }, 'previous-year'), {
    start: '2025-07-28',
    end: '2025-08-03',
  });
  assert.equal(resolveAdminCompareRange({ start: '2026-07-28', end: '2026-08-03' }, 'none'), null);
});
