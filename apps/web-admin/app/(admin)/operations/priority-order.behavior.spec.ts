import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const operationsSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const dashboardEntrySource = readFileSync(new URL('../dashboard/page.tsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../dashboard/dashboard-redesigned.tsx', import.meta.url), 'utf8');

function sourceIndex(source: string, marker: string) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `expected dashboard source to include ${marker}`);
  return index;
}

test('operations keeps urgent queues ordered and filterable', () => {
  assert.match(operationsSource, /type PriorityFilter = 'all' \| 'critical' \| 'member'/);
  assert.match(operationsSource, /priorityFilter/);
  assert.match(operationsSource, /\.sort\(\(a, b\) => \(b\.count > 0 \? b\.priority : 0\) - \(a\.count > 0 \? a\.priority : 0\)\)/);
  assert.match(operationsSource, /failedTransfers > 0/);
  assert.match(operationsSource, /mismatchSnapshots > 0/);
  assert.match(operationsSource, /openRiskAlerts > 0/);
});

test('dashboard uses a task-first progressive hierarchy', () => {
  assert.match(dashboardEntrySource, /export \{ default \} from '\.\/dashboard-redesigned'/);

  const system = sourceIndex(dashboardSource, 'className={styles.statusBar}');
  const priorities = sourceIndex(dashboardSource, 'priorityItems.length > 0');
  const overview = sourceIndex(dashboardSource, 'title={t.overview}');
  const finance = sourceIndex(dashboardSource, 'dashboard.hasFinanceActivity');
  const queues = sourceIndex(dashboardSource, 'title={t.queues}');
  const activity = sourceIndex(dashboardSource, 'title={t.recentRisk}');

  assert.ok(system < priorities && priorities < overview && overview < finance && finance < queues && queues < activity);
  assert.match(dashboardSource, /dashboard\.pendingTotal > 0 && <Metric label=\{t\.pendingWork\}/);
  assert.match(dashboardSource, /dashboard\.pendingTotal > 0 && <Metric label=\{t\.oldestQueue\}/);
  assert.match(dashboardSource, /riskSummary\.openCount > 0 && <Metric label=\{t\.openRisks\}/);
  assert.match(dashboardSource, /actionCount > 0 && <strong>/);
  assert.match(dashboardSource, /dashboard\.pendingTopUps > 0/);
  assert.match(dashboardSource, /dashboard\.pendingWithdrawals > 0/);
  assert.match(dashboardSource, /riskItems\.length > 0/);
  assert.doesNotMatch(dashboardSource, /QuickCard|admin-dashboard__quick|styles\.allClear/);
});
