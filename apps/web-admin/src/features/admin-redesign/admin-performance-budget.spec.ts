import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

type PerformanceBudget = {
  routeJavaScript: {
    initialKilobytesGzip: number;
    largestAsyncChunkKilobytesGzip: number;
    routeGrowthPercent: number;
  };
  layoutStability: { cumulativeLayoutShift: number };
  responsiveness: {
    interactionToNextPaintMilliseconds: number;
    longTaskMilliseconds: number;
  };
  longDataViews: {
    rowsWithoutVirtualization: number;
    firstRenderMilliseconds: number;
    filterOrSortMilliseconds: number;
  };
  measurement: {
    productionBuildRequired: boolean;
    authenticatedRoutesRequired: boolean;
    mobileAndDesktopRequired: boolean;
    browserEvidenceRequired: boolean;
  };
};

const budget = JSON.parse(
  readFileSync(resolve(process.cwd(), 'performance-budget.json'), 'utf8'),
) as PerformanceBudget;

test('Admin route JavaScript budgets remain bounded', () => {
  assert.ok(budget.routeJavaScript.initialKilobytesGzip > 0);
  assert.ok(budget.routeJavaScript.initialKilobytesGzip <= 250);
  assert.ok(budget.routeJavaScript.largestAsyncChunkKilobytesGzip <= 180);
  assert.ok(budget.routeJavaScript.routeGrowthPercent <= 10);
});

test('Admin user-experience budgets use recognized good thresholds', () => {
  assert.ok(budget.layoutStability.cumulativeLayoutShift <= 0.1);
  assert.ok(budget.responsiveness.interactionToNextPaintMilliseconds <= 200);
  assert.ok(budget.responsiveness.longTaskMilliseconds <= 50);
});

test('long Admin data views have explicit render and interaction limits', () => {
  assert.ok(budget.longDataViews.rowsWithoutVirtualization <= 200);
  assert.ok(budget.longDataViews.firstRenderMilliseconds <= 500);
  assert.ok(budget.longDataViews.filterOrSortMilliseconds <= 200);
});

test('performance acceptance requires production authenticated browser evidence', () => {
  assert.deepEqual(budget.measurement, {
    productionBuildRequired: true,
    authenticatedRoutesRequired: true,
    mobileAndDesktopRequired: true,
    browserEvidenceRequired: true,
  });
});
