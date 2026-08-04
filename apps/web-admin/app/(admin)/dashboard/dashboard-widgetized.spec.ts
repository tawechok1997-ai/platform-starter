import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./dashboard-widgetized.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./dashboard-widgetized.module.css', import.meta.url), 'utf8');
const workspace = readFileSync(new URL('../../../src/features/admin-modernization/admin-widget-workspace.tsx', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../../../src/features/admin-modernization/admin-dashboard-widget-registry.ts', import.meta.url), 'utf8');

test('dashboard route adopts the shared P4 widget owner', () => {
  assert.match(page, /dashboard-widgetized/);
  assert.match(source, /AdminWidgetWorkspace/);
  assert.match(source, /ADMIN_DASHBOARD_WIDGET_DEFINITIONS/);
  assert.match(source, /createAdminWidgetRegistry/);
});

test('dashboard adapters preserve API, permission, and per-user layout contracts', () => {
  assert.match(source, /\/admin\/finance\/summary/);
  assert.match(source, /\/admin\/risk-alerts\?status=OPEN/);
  assert.match(source, /\/admin\/auth\/me/);
  assert.match(source, /adminUserId/);
  assert.match(source, /visibleTo\(data\.permissions\)/);
  assert.match(source, /buildAccess\(data\.permissions\)/);
  assert.match(source, /access\.topUps/);
  assert.match(source, /access\.withdrawals/);
  assert.match(source, /access\.risk/);
  assert.match(source, /access\.wallet/);
  assert.match(source, /held\.has\('\*'\)/);
});

test('P4 follows the P3 workspace event without adding another workspace owner', () => {
  assert.match(workspace, /admin:workspace-change/);
  assert.match(workspace, /dataset\.adminWorkspace/);
  assert.match(workspace, /canShowAdminWidgetInWorkspace/);
  assert.match(workspace, /data-admin-widget-workspace/);
  assert.match(registry, /workspaceIds/);
  assert.doesNotMatch(workspace, /admin_workspace_selection_v1/);
});

test('dashboard widgets expose range, comparison, state, drill-down, and exports', () => {
  assert.match(source, /initialPreset="today"/);
  assert.match(source, /previous-period/);
  assert.match(source, /resolveState/);
  assert.match(source, /onDrillDown/);
  assert.match(source, /buildAdminChartCsv/);
  assert.match(source, /createAdminChartPngBlob/);
  assert.match(source, /partialMessage/);
});

test('dashboard widget adapters keep Thai English and responsive accessibility support', () => {
  assert.match(source, /แดชบอร์ดแบบปรับแต่งได้/);
  assert.match(source, /Customizable operations dashboard/);
  assert.match(source, /ariaLabel/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /@media \(max-width: 520px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /data-admin-contrast='high'/);
});
