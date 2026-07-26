import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./data-table.tsx', import.meta.url), 'utf8');

test('pagination and page-size controls stay disabled while table data is loading', () => {
  assert.equal(source.includes('disabled={loading || currentPage <= 1}'), true);
  assert.equal(source.includes('disabled={loading || currentPage >= pageCount}'), true);
  assert.equal(source.includes('disabled={loading}\n            aria-current='), true);
  assert.equal(source.includes('<select value={pageSize} disabled={loading}'), true);
});
