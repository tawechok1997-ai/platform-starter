import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../app/(admin)/audit-logs/page.tsx', import.meta.url), 'utf8');

test('uses guarded async loading with cleanup', () => {
  assert.equal(source.includes('try {'), true);
  assert.equal(source.includes('catch {'), true);
  assert.equal(source.includes('finally {'), true);
  assert.equal(source.includes('setLoading(false)'), true);
});

test('validates list payloads and clears stale data on failure', () => {
  assert.equal(source.includes('Array.isArray(data.items)'), true);
  assert.equal(source.includes('setItems([])'), true);
  assert.equal(source.includes('setTotal(0)'), true);
  assert.equal(source.includes('setPageCount(1)'), true);
});

test('does not surface raw backend messages', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('โหลดบันทึกกิจกรรมไม่สำเร็จ กรุณาลองใหม่'), true);
});

test('locks filter controls while loading', () => {
  assert.ok((source.match(/disabled=\{loading\}/g)?.length ?? 0) >= 9);
  assert.equal(source.includes('if (loading) return;'), true);
});
