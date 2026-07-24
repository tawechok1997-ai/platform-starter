import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/bulk-queue-operations/page.tsx'), 'utf8');

test('bulk queue keeps backend messages private', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('payload?.message'), false);
  assert.equal(source.includes('safeQueueMessage'), true);
  assert.equal(source.includes("throw new Error('โหลดคิวไม่สำเร็จ')"), true);
  assert.equal(source.includes("throw new Error('ทำรายการไม่สำเร็จ')"), true);
});

test('bulk queue clears loading and protects controls', () => {
  assert.equal(source.includes('finally'), true);
  assert.equal(source.includes('setLoading(false)'), true);
  assert.equal(source.includes('disabled={!ready || loading}'), true);
  assert.equal(source.includes('disabled={loading}'), true);
});
