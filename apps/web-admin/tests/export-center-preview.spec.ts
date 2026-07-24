import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/exports/page.tsx'), 'utf8');

test('applies a shared CSV and date-range export contract', () => {
  assert.equal(source.includes("fileType: 'CSV'"), true);
  assert.equal(source.includes("params.set('from'"), true);
  assert.equal(source.includes("params.set('to'"), true);
  assert.equal(source.includes('วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด'), true);
});

test('previews row count before the browser download starts', () => {
  assert.equal(source.includes('type PreparedExport'), true);
  assert.equal(source.includes('setPrepared({ source, path, text, rows })'), true);
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes('จำนวนแถว:'), true);
  assert.equal(source.indexOf('setPrepared({ source, path, text, rows })') < source.indexOf('anchor.click()'), true);
});

test('keeps export payloads out of persisted history', () => {
  assert.equal(source.includes('localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs'), true);
  assert.equal(source.includes('text: string; rows: number'), true);
  assert.equal(source.includes('ไม่เก็บเนื้อหาไฟล์หรือ token'), true);
});
