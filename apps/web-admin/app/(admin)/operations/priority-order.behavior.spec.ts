import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const operationsSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../dashboard/page.tsx', import.meta.url), 'utf8');

test('operations keeps urgent queues ordered and filterable', () => {
  assert.match(operationsSource, /type PriorityFilter = 'all' \| 'critical' \| 'member'/);
  assert.match(operationsSource, /priorityFilter/);
  assert.match(operationsSource, /\.sort\(\(a, b\) => \(b\.count > 0 \? b\.priority : 0\) - \(a\.count > 0 \? a\.priority : 0\)\)/);
  assert.match(operationsSource, /failedTransfers > 0/);
  assert.match(operationsSource, /mismatchSnapshots > 0/);
  assert.match(operationsSource, /openRiskAlerts > 0/);
});

test('dashboard keeps system, urgent, KPI, risk, finance, activity order', () => {
  const system = dashboardSource.indexOf('admin-command-status');
  const urgent = dashboardSource.indexOf('admin-command-priority');
  const kpi = dashboardSource.indexOf('admin-kpi-groups');
  const risk = dashboardSource.indexOf('title={t.riskPressure}');
  const finance = dashboardSource.indexOf('title={t.financeComparison}');
  const activity = dashboardSource.indexOf('admin-dashboard__sections');

  assert.ok(system >= 0 && urgent > system && kpi > urgent && risk > kpi && finance > risk && activity > finance);
});
