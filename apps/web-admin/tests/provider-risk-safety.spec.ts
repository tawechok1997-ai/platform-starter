import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/provider-risk/page.tsx'), 'utf8');

test('uses shared confirmation for provider gates', () => {
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes('window.confirm'), false);
  assert.equal(source.includes('pendingGate'), true);
});

test('guards async provider risk operations', () => {
  assert.equal(source.includes('if (loading) return;'), true);
  assert.equal((source.match(/finally/g) ?? []).length >= 4, true);
  assert.equal(source.includes('disabled={loading}'), true);
});

test('does not expose backend error messages', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่'), true);
});

test('validates provider risk payloads before use', () => {
  assert.equal(source.includes('Array.isArray(data?.items)'), true);
  assert.equal(source.includes('Array.isArray(data?.checks)'), true);
  assert.equal(source.includes("typeof data?.ok !== 'boolean'"), true);
});
