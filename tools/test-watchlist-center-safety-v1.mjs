import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/blacklist/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  "const WATCHLIST_TYPES = ['WATCHLIST_MATCH', 'BANK_CHANGE_WITHDRAWAL', 'DUPLICATE_DEPOSIT_SLIP', 'REPEATED_DUPLICATE_DEPOSIT_SLIP'] as const",
  'function isWatchlistAlert(value: unknown): value is WatchlistAlert',
  "const [busyKey, setBusyKey] = useState('')",
  'const pageBusy = loading || Boolean(busyKey)',
  'useEffect(() => { void load(); }, [status, severity])',
  "if (pageBusy) return",
  "setBusyKey(`review:${id}`)",
  "body: JSON.stringify({ status: 'REVIEWING' })",
  'disabled={pageBusy}',
  "disabled={pageBusy || item.status === 'REVIEWING' || item.status === 'RESOLVED' || item.status === 'DISMISSED'}",
  'href={`/members/${item.memberId}`}',
  'href={`/risk-alerts/${item.id}`}',
  "setMessage('โหลดคิวเฝ้าระวังไม่สำเร็จ กรุณาลองใหม่')",
  "setMessage('เริ่มตรวจสอบไม่สำเร็จ กรุณาลองใหม่')",
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Watchlist Center safety contract fragment: ${fragment}`);
}

assert.equal(source.includes('data?.message'), false, 'Watchlist Center must not render raw backend messages');
assert.equal(source.includes('Promise.all'), false, 'Watchlist Center refreshes must remain sequential');

const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 2, `Expected at least 2 finally blocks, found ${finallyCount}`);

console.log('Watchlist Center safety contract passed');
