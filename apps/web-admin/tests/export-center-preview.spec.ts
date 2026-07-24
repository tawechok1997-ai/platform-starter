import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/exports/page.tsx'), 'utf8');

test('previews rows before downloading', () => {
  assert.equal(source.includes('setPrepared({ source, path, text, rows })'), true);
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.indexOf('setPrepared({ source, path, text, rows })') < source.indexOf('anchor.click()'), true);
});

test('uses compatible date-range query handling', () => {
  assert.equal(source.includes("params.set('from'"), true);
  assert.equal(source.includes("params.set('to'"), true);
  assert.equal(source.includes('const query = params.toString()'), true);
  assert.equal(source.includes('params.size'), false);
});

test('persists metadata but not export payloads', () => {
  assert.equal(source.includes('JSON.stringify(jobs.slice(0, MAX_HISTORY))'), true);
  assert.equal(source.includes('ไม่เก็บเนื้อหาไฟล์หรือ token'), true);
});
