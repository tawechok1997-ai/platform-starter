import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./dashboard-widgetized.tsx', import.meta.url), 'utf8');
const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./dashboard-widgetized.module.css', import.meta.url), 'utf8');

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
  assert.match(source, /permissions/);
  assert.match(source, /visibleTo\(data\.permissions\)/);
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
