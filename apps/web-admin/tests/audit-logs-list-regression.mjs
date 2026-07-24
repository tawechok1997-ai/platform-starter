import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../app/(admin)/audit-logs/page.tsx', import.meta.url), 'utf8');

assert.match(source, /type AuditFilters/);
assert.match(source, /search: string/);
assert.match(source, /module: string/);
assert.match(source, /action: string/);
assert.match(source, /admin: string/);
assert.match(source, /targetId: string/);
assert.match(source, /from: string/);
assert.match(source, /to: string/);
assert.match(source, /URLSearchParams/);
assert.match(source, /AdminPagination/);
assert.match(source, /AdminPayloadViewer/);
assert.match(source, /targetHref/);
assert.match(source, /oldData/);
assert.match(source, /newData/);
assert.match(source, /applyFilters/);
assert.match(source, /clearFilters/);
assert.match(source, /disabled=\{loading\}/);

console.log('audit log list regression contract passed');
