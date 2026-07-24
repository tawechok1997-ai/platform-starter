import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/(admin)/wallet-ledgers/page.tsx', import.meta.url), 'utf8');

assert.match(source, /buildAdminListQuery/);
assert.match(source, /normalizeAdminListPayload/);
assert.match(source, /useAdminListContract/);
assert.match(source, /try\s*\{/);
assert.match(source, /catch\s*\{/);
assert.match(source, /finally\s*\{/);
assert.match(source, /setPayload\(\{ items: \[\], total: 0/);
assert.match(source, /direction:/);
assert.match(source, /type:/);
assert.match(source, /dateFrom/);
assert.match(source, /dateTo/);
assert.match(source, /search: query\.trim\(\)/);
assert.match(source, /AdminPagination/);
assert.match(source, /exportCsv/);
assert.doesNotMatch(source, /data\?\.message/);

console.log('wallet ledger list regression contract passed');
