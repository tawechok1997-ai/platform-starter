import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/ledgers/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  "import { useCallback, useEffect, useMemo, useRef, useState } from 'react'",
  'const requestSequence = useRef(0)',
  'const requestId = ++requestSequence.current',
  'if (requestId !== requestSequence.current) return',
  'if (requestId === requestSequence.current) setLoading(false)',
  'function parseLedgerPayload(value: unknown): LedgerPayload | null',
  'function parseLedgerItem(value: unknown): LedgerItem | null',
  'function parseFiniteDecimal(value: unknown, allowNegative = true)',
  'function normalizeFilters(value:',
  'function ledgerBalanceMatches(item: LedgerItem)',
  'const integrityMismatchCount = useMemo',
  'AdminNotice tone="warning"',
  'disabled={loading}',
  "setMessage('โหลดประวัติการเงินไม่สำเร็จ กรุณาลองใหม่')",
  'finally {',
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing wallet ledger safety fragment: ${fragment}`);
}

assert.equal(source.includes('data?.message'), false, 'Ledger history must not render raw backend messages');
assert.equal(source.includes('error.message'), false, 'Ledger history must not surface raw thrown errors');
assert.equal(source.includes('Promise.all'), false, 'Ledger history must keep loading isolated and deterministic');
assert.equal(source.includes('window.confirm'), false, 'Ledger history must not use browser confirmation dialogs');
assert.equal(source.includes('window.prompt'), false, 'Ledger history must not use browser prompt dialogs');
assert.ok((source.match(/requestId !== requestSequence\.current/g) ?? []).length >= 2, 'Ledger history must guard stale success and failure responses');
assert.ok((source.match(/finally\s*\{/g) ?? []).length >= 1, 'Ledger history must release loading state in finally');

console.log('Wallet ledger history safety contract passed');
