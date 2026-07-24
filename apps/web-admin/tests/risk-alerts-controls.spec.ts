import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/risk-alerts/page.tsx'), 'utf8');

test('throttles repeated risk scans', () => {
  assert.equal(source.includes('scanning || cooldownRemaining > 0'), true);
  assert.equal(source.includes('setCooldownRemaining(45)'), true);
  assert.equal(source.includes('ตรวจใหม่ได้ใน'), true);
});

test('requires a reason and confirmation before bulk dismiss', () => {
  assert.equal(source.includes('dismissReason.trim().length < 5'), true);
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes("setDismissConfirmOpen(true)"), true);
  assert.equal(source.includes("busy={dismissing}"), true);
});

test('supports risk filters and explicit paging', () => {
  for (const key of ['status', 'severity', 'type', 'memberId', 'provider', 'createdFrom', 'createdTo']) {
    assert.equal(source.includes(`query.set('${key}'`), true, key);
  }
  assert.equal(source.includes("query.set('page'"), true);
  assert.equal(source.includes("query.set('take'"), true);
});
