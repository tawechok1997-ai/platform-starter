import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/aml/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  "'use client';",
  'function isAmlAlert(value: unknown): value is AmlAlert',
  "const AML_TYPES = ['RAPID_DEPOSIT_WITHDRAWAL', 'HIGH_WITHDRAWAL', 'REPEATED_TOPUPS', 'WALLET_LEDGER_MISMATCH'] as const",
  "const [busyKey, setBusyKey] = useState('')",
  'const pageBusy = loading || Boolean(busyKey)',
  'useEffect(() => { void load(); }, [status, severity])',
  'const nextItems = Array.isArray(data.items) ? data.items.filter(isAmlAlert) : []',
  'if (pageBusy) return',
  "setBusyKey(`review:${id}`)",
  "body: JSON.stringify({ status: 'REVIEWING' })",
  "disabled={pageBusy || item.status === 'REVIEWING' || item.status === 'RESOLVED' || item.status === 'DISMISSED'}",
  'const openCount = items.filter((item) => item.status === \'OPEN\' || item.status === \'REVIEWING\').length',
  'const urgentCount = items.filter((item) => item.severity === \'HIGH\' || item.severity === \'CRITICAL\').length',
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing AML safety contract fragment: ${fragment}`);
}

assert.equal(source.includes('data?.message'), false, 'AML Center must not render raw backend messages');
assert.equal(source.includes("href='/risk-alerts?type="), false, 'AML Center must not regress to a static link-only surface');

const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 2, `Expected at least 2 finally blocks, found ${finallyCount}`);

console.log('AML Center safety contract passed');
