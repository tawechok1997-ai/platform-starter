import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../apps/web-admin/app/(admin)/risk-alerts/page.tsx', import.meta.url), 'utf8');

const requiredFragments = [
  'function isRiskAlert(value: unknown): value is RiskAlert',
  'function isAutoCloseSuggestion(value: unknown): value is AutoCloseSuggestion',
  "const [busyKey, setBusyKey] = useState('')",
  'const pageBusy = loading || Boolean(busyKey)',
  'useEffect(() => { void load(page); }, [page, status, severity, type, provider])',
  "if (pageBusy || cooldownRemaining > 0) return",
  "if (!selectedIds.length || pageBusy) return",
  "createdFrom && createdTo && createdFrom > createdTo",
  "setBusyKey('bulk-dismiss')",
  "busy={busyKey === 'bulk-dismiss'}",
  'onCancel={() => { if (!pageBusy) setDismissConfirmOpen(false); }}',
  'disabled={pageBusy || page <= 1}',
  "disabled={pageBusy || item.status === 'REVIEWING'}",
];

for (const fragment of requiredFragments) {
  assert.ok(source.includes(fragment), `Missing Risk Alerts list safety contract fragment: ${fragment}`);
}

assert.equal(source.includes('data?.message'), false, 'Risk Alerts list must not render raw backend messages');
assert.equal(source.includes('window.setTimeout(() => void load(1), 0)'), false, 'Risk Alerts list must not schedule duplicate filter reloads');

const finallyCount = (source.match(/finally\s*\{/g) ?? []).length;
assert.ok(finallyCount >= 5, `Expected at least 5 finally blocks, found ${finallyCount}`);

const loadEffectCount = (source.match(/useEffect\(\(\) => \{ void load\(page\); \}, \[page, status, severity, type, provider\]\)/g) ?? []).length;
assert.equal(loadEffectCount, 1, `Expected one consolidated Risk Alerts load effect, found ${loadEffectCount}`);

console.log('Risk Alerts list safety contract passed');
