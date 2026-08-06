import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workspace = readFileSync(new URL('./admin-widget-workspace.tsx', import.meta.url), 'utf8');
const finance = readFileSync(new URL('./admin-dashboard-finance-trends.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('./use-admin-widget-layout.ts', import.meta.url), 'utf8');
const workflow = readFileSync(new URL('../../../../../.github/workflows/admin-authenticated-ui-smoke.yml', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../../../../prisma/migrations/20260805040000_add_admin_ui_preferences/migration.sql', import.meta.url), 'utf8');
const bootstrap = readFileSync(new URL('../../../../../tools/prepare-production-database.mjs', import.meta.url), 'utf8');

test('cash-flow widget uses the real historical runtime owner', () => {
  assert.match(workspace, /AdminDashboardFinanceTrends/);
  assert.match(workspace, /definition\.id === 'finance\.cash-flow'/);
  assert.match(finance, /\/admin\/dashboard\/finance-trends\?from=/);
  assert.match(finance, /const primaryPromise = loadTrendRange/);
  assert.match(finance, /const comparisonPromise = compareRange/);
  assert.match(finance, /Promise\.all\(\[primaryPromise, comparisonPromise\]\)/);
  assert.match(finance, /comparisonUnavailable/);
  assert.match(finance, /normalizeFinanceTrendResponse/);
  assert.match(finance, /aggregateTrendPoints/);
  assert.match(finance, /createAdminChartCsvBlob/);
  assert.match(finance, /createAdminChartPngBlob/);
  assert.match(finance, /comparisonDelta/);
});

test('widget layouts remain local-first and synchronize to the authenticated account', () => {
  assert.match(layout, /DASHBOARD_LAYOUT_PREFERENCE_KEY = 'dashboard-widget-layout-v1'/);
  assert.match(layout, /`\/admin\/preferences\/\$\{DASHBOARD_LAYOUT_PREFERENCE_KEY\}`/);
  assert.match(layout, /method: 'PATCH'/);
  assert.match(layout, /SAVE_DEBOUNCE_MS = 600/);
  assert.match(layout, /window\.localStorage/);
  assert.match(layout, /window\.addEventListener\('focus'/);
  assert.match(layout, /syncState/);
  assert.match(workspace, /data-layout-sync-state/);
  assert.match(workspace, /aria-live="polite"/);
});

test('UI preference migration is bounded and bootstrap-safe', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS admin_ui_preferences/);
  assert.match(migration, /PRIMARY KEY \(admin_user_id, preference_key\)/);
  assert.match(migration, /octet_length\(value::text\) <= 50000/);
  assert.match(bootstrap, /BOOTSTRAP_SAFE_MIGRATIONS/);
  assert.match(bootstrap, /20260805040000_add_admin_ui_preferences/);
  assert.match(bootstrap, /applyBootstrapSafeMigrations/);
});

test('Production smoke verifies health and deployed commit before authentication', () => {
  assert.match(workflow, /Verify Production health and commit identity/);
  assert.match(workflow, /read\('\/health'\)/);
  assert.match(workflow, /read\('\/version'\)/);
  assert.match(workflow, /EXPECTED_DEPLOY_COMMIT/);
  assert.match(workflow, /does not match expected/);
});