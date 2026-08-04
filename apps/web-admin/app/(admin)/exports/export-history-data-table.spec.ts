import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('finance export history uses the shared responsive data table', () => {
  assert.match(source, /AdminDataTable/);
  assert.match(source, /AdminDataColumn<ExportJob>/);
  assert.match(source, /rows=\{visibleJobs\}/);
  assert.match(source, /totalItems=\{jobs\.length\}/);
  assert.equal(source.includes('<table className="admin-data-table">'), false);
  assert.equal(source.includes('AdminPagination'), false);
});

test('export metadata remains local and download confirmation remains explicit', () => {
  assert.match(source, /admin_export_history_v1/);
  assert.match(source, /AdminConfirmDialog/);
  assert.match(source, /metadata ของงาน ไม่เก็บเนื้อหาไฟล์หรือ token/);
});
