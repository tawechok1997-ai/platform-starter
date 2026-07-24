import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/audit/page.tsx'), 'utf8');

test('keeps only the latest audit request result', () => {
  assert.equal(source.includes('const requestSequence = useRef(0)'), true);
  assert.equal(source.includes('const requestId = ++requestSequence.current'), true);
  assert.equal(source.includes('if (requestId !== requestSequence.current) return;'), true);
  assert.equal(source.includes('if (loading) return;'), false);
  assert.equal(source.includes('if (requestId === requestSequence.current) setLoading(false)'), true);
});

test('validates audit payloads before rendering', () => {
  assert.equal(source.includes('!isAuditResponse(payload)'), true);
  assert.equal(source.includes('function isAuditLog'), true);
  assert.equal(source.includes('value.items.every(isAuditLog)'), true);
  assert.equal(source.includes('nonNegativeInteger(payload.total'), true);
  assert.equal(source.includes('positiveInteger(payload.pageCount'), true);
  assert.equal(source.includes('data?.message'), false);
});

test('validates date filters and supports enter-to-search', () => {
  assert.equal(source.includes('draft.from && draft.to && draft.from > draft.to'), true);
  assert.equal(source.includes('<form onSubmit='), true);
  assert.equal(source.includes('type="submit"'), true);
  assert.equal(source.includes('ช่วงวันที่ไม่ถูกต้อง'), true);
});

test('keeps audit data redacted and long content scrollable', () => {
  assert.equal(source.includes('stringifyAdminPayload(value)'), true);
  assert.equal(source.includes('<details style={detailsStyle}>'), true);
  assert.equal(source.includes("overflowX: 'auto'"), true);
  assert.equal(source.includes('maxHeight: 360'), true);
});

test('covers operational target navigation', () => {
  for (const route of [
    '/topups?requestId=',
    '/withdrawals?requestId=',
    '/game-sessions?sessionId=',
    '/game-transfers?transferId=',
    '/webhook-logs?referenceId=',
    '/reconciliation-center?referenceId=',
    '/game-providers?providerId=',
    '/promotion-claims?claimId=',
    '/support-center?ticketId=',
    '/kyc-center?caseId=',
    '/risk-alerts/',
    '/members/',
    '/ledgers?referenceId=',
  ]) {
    assert.equal(source.includes(route), true, `${route} target mapping must remain available`);
  }
});

test('preserves empty and mobile-safe pagination states', () => {
  assert.equal(source.includes('ยังไม่มี audit log ตามเงื่อนไขนี้'), true);
  assert.equal(source.includes('disabled={loading || page <= 1}'), true);
  assert.equal(source.includes('disabled={loading || page >= pageCount}'), true);
  assert.equal(source.includes("gridTemplateColumns: 'minmax(88px, 1fr) auto minmax(88px, 1fr)'"), true);
  assert.equal(source.includes("overflowWrap: 'anywhere'"), true);
});