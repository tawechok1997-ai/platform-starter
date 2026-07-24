import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/wallet-ledgers/[id]/page.tsx'), 'utf8');

test('uses typed ledger contracts', () => {
  assert.equal(source.includes('type LedgerItem ='), true);
  assert.equal(source.includes('type RiskAlert ='), true);
  assert.equal(source.includes('item?: any'), false);
  assert.equal(source.includes('(alert: any)'), false);
  assert.equal(source.includes('(log: any)'), false);
});

test('handles loading safely', () => {
  assert.equal(source.includes('if (loading) return'), true);
  assert.equal(source.includes("setMessage('โหลดรายการเดินเงินไม่สำเร็จ กรุณาลองใหม่')"), true);
  assert.equal(source.includes('finally {\n      setLoading(false);'), true);
  assert.equal(source.includes('data?.message'), false);
});

test('redacts related payloads and metadata', () => {
  assert.equal(source.includes('stringifyAdminPayload(payload)'), true);
  assert.equal(source.includes('JSON.stringify(payload'), false);
});

test('uses Thai interface copy consistently', () => {
  assert.equal(source.includes('Wallet Ledger Detail'), false);
  assert.equal(source.includes("title=\"รายละเอียดรายการเดินเงิน\""), true);
  assert.equal(source.includes("'Loading...'"), false);
});