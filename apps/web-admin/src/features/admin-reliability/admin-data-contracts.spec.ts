import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeFinanceTrendResponse,
  normalizeReconciliationPayload,
  safeMoneyValue,
} from './admin-data-contracts';

test('finance contract accepts the current API payload', () => {
  const result = normalizeFinanceTrendResponse({
    range: { days: 2, from: '2026-08-01T00:00:00.000Z', to: '2026-08-02T23:59:59.999Z' },
    totals: {
      topUpAmount: '150', topUpCount: 2, withdrawalAmount: '40', withdrawalCount: 1, netFlow: '110',
    },
    daily: [
      { date: '2026-08-01', topUpAmount: '100', topUpCount: 1, withdrawalAmount: '40', withdrawalCount: 1, netFlow: '60' },
      { date: '2026-08-02', topUpAmount: '50', topUpCount: 1, withdrawalAmount: '0', withdrawalCount: 0, netFlow: '50' },
    ],
    generatedAt: '2026-08-03T00:00:00.000Z',
  });

  assert.equal(result.data?.totals.netFlow, '110');
  assert.equal(result.data?.daily.length, 2);
  assert.equal(result.partial, false);
});

test('finance contract preserves valid rows when optional fields are incomplete', () => {
  const result = normalizeFinanceTrendResponse({
    items: [
      { day: '2026-08-01', depositAmount: 100, depositCount: '2', withdrawalAmount: '25', withdrawalCount: 1 },
      { day: 'bad-date', depositAmount: 500 },
    ],
  }, { start: '2026-08-01', end: '2026-08-01' });

  assert.equal(result.data?.daily.length, 1);
  assert.equal(result.data?.totals.topUpAmount, '100');
  assert.equal(result.data?.totals.withdrawalAmount, '25');
  assert.equal(result.data?.totals.netFlow, '75');
  assert.equal(result.partial, true);
  assert.ok(result.issues.includes('totals_computed'));
  assert.ok(result.issues.includes('daily_1_date_invalid'));
});

test('finance contract rejects a payload without an object or usable range', () => {
  assert.equal(normalizeFinanceTrendResponse(null).data, null);
  assert.equal(normalizeFinanceTrendResponse({ daily: [] }).data, null);
});

test('reconciliation contract normalizes missing values and recomputes summary', () => {
  const result = normalizeReconciliationPayload({
    items: [
      {
        id: 'snapshot-1', status: 'MATCHED', systemBalance: '100', providerBalance: 100,
        checkedAt: '2026-08-01T00:00:00.000Z', provider: { name: 'Demo' },
      },
      {
        id: 'snapshot-2', status: 'unexpected', systemBalance: null, providerBalance: '25',
        checkedAt: 'invalid', user: { username: 'member' },
      },
      { status: 'MISMATCH' },
    ],
  });

  assert.equal(result.data?.items.length, 2);
  assert.equal(result.data?.items[0]?.difference, '0');
  assert.equal(result.data?.items[1]?.systemBalance, '0');
  assert.equal(result.data?.items[1]?.difference, '-25');
  assert.equal(result.data?.items[1]?.status, 'UNKNOWN');
  assert.deepEqual(result.data?.summary, { total: 2, matched: 1, mismatch: 0, unknown: 1 });
  assert.equal(result.partial, true);
  assert.ok(result.issues.includes('item_2_id_missing'));
});

test('money normalization never returns undefined, null, or NaN text', () => {
  assert.equal(safeMoneyValue(undefined), '0');
  assert.equal(safeMoneyValue(null), '0');
  assert.equal(safeMoneyValue(Number.NaN), '0');
  assert.equal(safeMoneyValue('1,250.50'), '1250.50');
});
