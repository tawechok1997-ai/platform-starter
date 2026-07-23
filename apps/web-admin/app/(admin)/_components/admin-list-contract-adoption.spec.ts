import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const webhookSource = readFileSync(new URL('../webhook-logs/page.tsx', import.meta.url), 'utf8');
const ledgerSource = readFileSync(new URL('../wallet-ledgers/page.tsx', import.meta.url), 'utf8');

for (const [route, source] of [['webhook-logs', webhookSource], ['wallet-ledgers', ledgerSource]] as const) {
  test(`${route} uses server list state`, () => {
    assert.equal(source.includes('useAdminListContract'), true);
    assert.equal(source.includes('buildAdminListQuery'), true);
    assert.equal(source.includes('normalizeAdminListPayload'), true);
    assert.equal(source.includes('page: list.page'), true);
    assert.equal(source.includes('take: list.pageSize'), true);
    assert.equal(source.includes('AdminPagination'), true);
    assert.equal(source.includes('paginateAdminItems'), false);
  });
}

test('wallet ledger export names the loaded page', () => {
  assert.equal(ledgerSource.includes('wallet-ledgers-page-'), true);
  assert.equal(ledgerSource.includes('payload.items.map'), true);
});

test('webhook viewer keeps payload redaction', () => {
  assert.equal(webhookSource.includes('redactAdminPayload'), true);
  assert.equal(webhookSource.includes('AdminPayloadViewer'), true);
});
