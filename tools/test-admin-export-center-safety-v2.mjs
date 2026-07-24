import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/exports/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  "type ExportStatus = 'COMPLETED' | 'FAILED'",
  'type PreparedExport',
  'new URLSearchParams()',
  "params.set('from', range.from)",
  "params.set('to', range.to)",
  'if (rangeInvalid)',
  'const failedJob: ExportJob',
  "status: 'FAILED'",
  'const completedJob: ExportJob',
  "status: 'COMPLETED'",
  'setPrepared({ source, path, text, rows })',
  'AdminConfirmDialog',
  'source = sources.find((item) => job.path.startsWith(item.path))',
  'localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, MAX_HISTORY)))',
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Export Center safety contract fragment: ${fragment}`);
}

assert.equal(source.includes("status: 'RUNNING'"), false, 'Export Center must not persist stale RUNNING jobs');
assert.equal(source.includes('text, rows }, ...current'), false, 'CSV content must not be stored in export history');
assert.equal(source.includes('data?.message'), false, 'Export Center must not render raw backend messages');
assert.equal(source.includes('window.confirm'), false, 'Export Center must use the shared confirmation dialog');

console.log('Export Center safety contract passed');
