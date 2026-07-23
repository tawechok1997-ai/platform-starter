import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const webhookSource = readFileSync(new URL('../webhook-logs/page.tsx', import.meta.url), 'utf8');
const ledgerSource = readFileSync(new URL('../wallet-ledgers/page.tsx', import.meta.url), 'utf8');

for (const [route, source] of [['webhook-logs', webhookSource], ['wallet-ledgers', ledgerSource]] as const) {
  test(`${route} adopts the shared list and pagination contract`, () => {
    assert.match(source, /useAdminListContract/);
    assert.match(source, /paginateAdminItems/);
    assert.match(source, /AdminPagination/);
    assert.match(source, /resetPage/);
  });
}

test('wallet ledger export remains scoped to the full filtered result instead of one page', () => {
  assert.match(ledgerSource, /\.\.\.visibleItems\.map/);
  assert.doesNotMatch(ledgerSource, /\.\.\.page\.items\.map\(\(item\) => \[item\.id/);
});
