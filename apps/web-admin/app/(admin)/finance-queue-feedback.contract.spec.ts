import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const topUpsSource = readFileSync(new URL('./topups/page.tsx', import.meta.url), 'utf8');
const withdrawalsSource = readFileSync(new URL('./withdrawals/page.tsx', import.meta.url), 'utf8');
const queueSource = readFileSync(new URL('./_components/admin-finance-queue.tsx', import.meta.url), 'utf8');
const queueStyles = readFileSync(new URL('./_components/admin-finance-queue.module.css', import.meta.url), 'utf8');

for (const [name, source] of [['top-ups', topUpsSource], ['withdrawals', withdrawalsSource]] as const) {
  test(`${name} queue protects current data from stale and failed refreshes`, () => {
    assert.match(source, /useAdminFinanceQueueRequestGate/);
    assert.match(source, /const hasLoadedRef = useRef\(false\)/);
    assert.match(source, /requestGate\.isCurrent\(requestId\)/);
    assert.match(source, /refreshFailed: 'รีเฟรชไม่สำเร็จ ข้อมูลเดิมยังแสดงอยู่'/);
    assert.doesNotMatch(source, /setItems\(\[\]\)/);
  });

  test(`${name} queue preserves action feedback after the follow-up refresh`, () => {
    assert.match(source, /loadItems\(status, page, \{ announce: false, notifyFailure: false \}\)/);
    assert.match(source, /actionRefreshFailed/);
    assert.match(source, /refreshResult === 'failed' \? 'warning' : 'success'/);
    assert.match(source, /loading=\{loading && !hasLoadedRef\.current\}/);
  });
}

test('withdrawal proof upload reports success separately from refresh failure', () => {
  assert.match(withdrawalsSource, /proofRefreshFailed/);
  assert.match(withdrawalsSource, /refreshResult === 'failed' \? 'proofRefreshFailed' : 'proofUploaded'/);
});

test('finance evidence uses localized copy and CSS instead of inline presentation', () => {
  assert.match(queueSource, /openLabel: string/);
  assert.match(queueSource, /description: string/);
  assert.match(queueSource, /closeLabel: string/);
  assert.match(queueSource, /admin-finance-queue\.module\.css/);
  assert.doesNotMatch(queueSource, /style=\{\{/);
  assert.match(topUpsSource, /openLabel=\{copy\.evidenceOpen\}/);
  assert.match(withdrawalsSource, /openLabel=\{copy\.evidenceOpen\}/);
  assert.match(queueStyles, /\.evidenceTrigger/);
  assert.match(queueStyles, /\.evidenceCanvas/);
  assert.match(queueStyles, /@media \(max-width: 720px\)/);
});
