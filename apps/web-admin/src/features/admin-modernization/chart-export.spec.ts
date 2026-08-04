import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAdminChartCsv, createAdminChartCsvBlob, normalizeAdminExportFileName } from './chart-export';

const series = [
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdrawal', label: 'Withdrawals' },
];

const points = [
  { id: 'day-1', label: '1 Aug', values: { deposit: 1200.5, withdrawal: 800 } },
  { id: 'day-2', label: '2 Aug, adjusted', values: { deposit: 950, withdrawal: Number.NaN } },
];

test('chart CSV keeps stable columns and escapes labels', () => {
  assert.equal(buildAdminChartCsv(points, series), [
    'label,Deposits,Withdrawals',
    '1 Aug,1200.5,800',
    '"2 Aug, adjusted",950,0',
  ].join('\n'));
});

test('chart CSV blob includes the UTF-8 marker for spreadsheet compatibility', async () => {
  const blob = createAdminChartCsvBlob(points, series);
  assert.equal(blob.type, 'text/csv;charset=utf-8');
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.match(new TextDecoder('utf-8').decode(bytes), /^label,Deposits,Withdrawals/);
});

test('export file names are normalized and retain the requested extension', () => {
  assert.equal(normalizeAdminExportFileName(' Finance / Daily Flow ', 'csv'), 'finance-daily-flow.csv');
  assert.equal(normalizeAdminExportFileName('risk.png', 'png'), 'risk.png');
  assert.equal(normalizeAdminExportFileName('***', 'png'), 'admin-widget.png');
});
