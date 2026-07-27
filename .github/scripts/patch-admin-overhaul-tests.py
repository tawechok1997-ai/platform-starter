from pathlib import Path

root = Path(__file__).resolve().parents[2]

priority_path = root / "apps/web-admin/app/(admin)/operations/priority-order.behavior.spec.ts"
priority_path.write_text(
    """import assert from 'node:assert/strict';
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
""",
    encoding="utf-8",
)

release_path = root / "apps/web-admin/app/admin-release-readiness.spec.ts"
release = release_path.read_text(encoding="utf-8")
release = release.replace(
    "const adoptionImport = \"import './admin-modernization-adoption.css'\";",
    "const adoptionImport = \"import './admin-modernization-adoption.css'\";\nconst uxImport = \"import './admin-ux-overrides.css'\";",
)
old = """  const adoptionIndex = layout.indexOf(adoptionImport);

  assert.ok(controlsIndex >= 0);
  assert.ok(shellIndex > controlsIndex);
  assert.ok(profileIndex > shellIndex);
  assert.ok(adoptionIndex > profileIndex);
  assert.equal(layout.slice(adoptionIndex + adoptionImport.length).includes(\"import './admin-\"), false);"""
new = """  const adoptionIndex = layout.indexOf(adoptionImport);
  const uxIndex = layout.indexOf(uxImport);

  assert.ok(controlsIndex >= 0);
  assert.ok(shellIndex > controlsIndex);
  assert.ok(profileIndex > shellIndex);
  assert.ok(adoptionIndex > profileIndex);
  assert.ok(uxIndex > adoptionIndex);
  assert.equal(layout.slice(uxIndex + uxImport.length).includes(\"import './admin-\"), false);"""
if old not in release:
    raise SystemExit("Release readiness import-order assertion was not found")
release_path.write_text(release.replace(old, new, 1), encoding="utf-8")
