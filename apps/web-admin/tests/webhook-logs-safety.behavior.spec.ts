import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/webhook-logs/page.tsx'), 'utf8');

test('loads webhook logs with safe cleanup', () => {
  assert.equal(source.includes('if (loading) return'), true);
  assert.equal(source.includes('finally'), true);
  assert.equal(source.includes("setMessage('โหลด Webhook ไม่สำเร็จ กรุณาลองใหม่')"), true);
  assert.equal(source.includes('data?.message'), false);
});

test('locks filtering and payload inspection while loading', () => {
  assert.equal((source.match(/disabled={loading}/g) ?? []).length >= 5, true);
  assert.equal(source.includes('redactAdminPayload'), true);
  assert.equal(source.includes('<AdminPayloadViewer'), true);
});