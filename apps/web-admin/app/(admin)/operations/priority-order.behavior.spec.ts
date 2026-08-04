import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const operationsEntrySource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const operationsSource = readFileSync(new URL('./operations-redesigned.tsx', import.meta.url), 'utf8');
const dashboardEntrySource = readFileSync(new URL('../dashboard/page.tsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../dashboard/dashboard-widgetized.tsx', import.meta.url), 'utf8');
const dashboardRegistrySource = readFileSync(
  new URL('../../../src/features/admin-modernization/admin-dashboard-widget-registry.ts', import.meta.url),
  'utf8',
);

function sourceIndex(source: string, marker: string) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `expected source to include ${marker}`);
  return index;
}

test('operations uses the redesigned task-first boundary', () => {
  assert.match(operationsEntrySource, /import OperationsRedesigned from '\.\/operations-redesigned'/);
  assert.match(operationsEntrySource, /export default OperationsRedesigned/);
  assert.match(operationsSource, /filter\(\(task\) => task\.count > 0\)/);
  assert.match(operationsSource, /sort\(\(a, b\) => b\.priority - a\.priority\)/);
  assert.match(operationsSource, /tasks\.length === 0/);
  assert.match(operationsSource, /className=\{styles\.allClear\}/);
  assert.match(operationsSource, /<details className=\{styles\.tools\}>/);
  assert.doesNotMatch(operationsSource, /RecentCard|recentTransfers|recentAlerts|recentLedger/);
});

test('dashboard puts priority work and analytical widgets before recent activity', () => {
  assert.match(dashboardEntrySource, /export \{ default \} from '\.\/dashboard-widgetized'/);
  assert.match(dashboardSource, /AdminWidgetWorkspace/);
  assert.match(dashboardSource, /AdminChart/);
  assert.match(dashboardSource, /ADMIN_DASHBOARD_WIDGET_DEFINITIONS/);

  const priorities = sourceIndex(dashboardRegistrySource, "id: 'operations.priority-work'");
  const cashFlow = sourceIndex(dashboardRegistrySource, "id: 'finance.cash-flow'");
  const wallet = sourceIndex(dashboardRegistrySource, "id: 'wallet.balance-composition'");
  const risk = sourceIndex(dashboardRegistrySource, "id: 'risk.open-severity'");
  const queues = sourceIndex(dashboardRegistrySource, "id: 'finance.pending-queues'");
  const recent = sourceIndex(dashboardRegistrySource, "id: 'activity.recent'");

  assert.ok(
    priorities < cashFlow &&
      cashFlow < wallet &&
      wallet < risk &&
      risk < queues &&
      queues < recent,
  );
  assert.match(dashboardRegistrySource, /chartKind: 'bar'/);
  assert.match(dashboardRegistrySource, /chartKind: 'donut'/);
  assert.match(dashboardRegistrySource, /requiredPermissions/);
  assert.match(dashboardRegistrySource, /workspaceIds/);
});
