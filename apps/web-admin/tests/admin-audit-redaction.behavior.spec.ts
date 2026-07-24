import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/audit/page.tsx'), 'utf8');

test('redacts audit before and after payloads through the shared boundary', () => {
  assert.equal(source.includes("import { stringifyAdminPayload }"), true);
  assert.equal(source.includes('stringifyAdminPayload(value)'), true);
  assert.equal(source.includes('JSON.stringify(value, null, 2)'), false);
});

test('keeps backend errors private and clears loading state', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('payload?.message'), false);
  assert.equal(source.includes('finally'), true);
  assert.equal(source.includes("setMessage('โหลด audit logs ไม่สำเร็จ กรุณาลองใหม่')"), true);
});

test('blocks filter controls while the audit request is running', () => {
  assert.equal(source.includes('disabled={loading} value={draft.search}'), true);
  assert.equal(source.includes('if (loading) return'), true);
});
