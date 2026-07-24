import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/risk-alerts/[id]/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  'function isRiskAlert',
  'function isAdminOption',
  "const [busyKey, setBusyKey] = useState('')",
  'const pageBusy = loading || Boolean(busyKey)',
  'if (!id || pageBusy) return',
  "setBusyKey(`status:${nextStatus}`)",
  "setBusyKey('assignment')",
  "setBusyKey('note')",
  'finally {',
  'disabled={pageBusy}',
  "disabled={pageBusy || item.status === 'REVIEWING'}",
  "disabled={pageBusy || item.status === 'RESOLVED'}",
  "disabled={pageBusy || item.status === 'DISMISSED'}",
  'disabled={pageBusy || !note.trim()}',
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Risk Alert Detail safety contract fragment: ${fragment}`);
}

assert.equal(source.includes('data?.message'), false, 'Risk Alert Detail must not render raw backend messages');
assert.equal(source.includes('payload?.message'), false, 'Risk Alert Detail must not render raw backend payload messages');
assert.equal(source.includes('setSaving('), false, 'Risk Alert Detail must use the shared busy key instead of ambiguous saving state');

const tryCount = (source.match(/try\s*\{/g) ?? []).length;
const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(tryCount >= 5, `Expected at least 5 try blocks, found ${tryCount}`);
assert.ok(finallyCount >= 4, `Expected at least 4 finally blocks, found ${finallyCount}`);

console.log('Risk Alert Detail safety contract passed');
