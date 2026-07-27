import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const operationsEntrySource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const operationsSource = readFileSync(new URL('./operations-redesigned.tsx', import.meta.url), 'utf8');
const dashboardEntrySource = readFileSync(new URL('../dashboard/page.tsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../dashboard/dashboard-redesigned.tsx', import.meta.url), 'utf8');

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
