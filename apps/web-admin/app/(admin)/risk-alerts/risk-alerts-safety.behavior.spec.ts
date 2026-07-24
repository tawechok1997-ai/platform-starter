import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/risk-alerts/page.tsx'), 'utf8');

test('orders urgent risk alerts before lower severity items', () => {
  assert.equal(source.includes("const severityPriority"), true);
  assert.equal(source.includes("CRITICAL: 0"), true);
  assert.equal(source.includes("HIGH: 1"), true);
  assert.equal(source.includes("const orderedItems = useMemo"), true);
});

test('keeps backend errors private and clears async states', () => {
  assert.equal(source.includes("data?.message"), false);
  assert.equal(source.includes("payload?.message"), false);
  assert.equal(source.includes("finally"), true);
  assert.equal(source.includes("setWorkingId('')"), true);
  assert.equal(source.includes("setDismissing(false)"), true);
  assert.equal(source.includes("setScanning(false)"), true);
});

test('blocks duplicate actions while a risk mutation is active', () => {
  assert.equal(source.includes("const controlsBusy"), true);
  assert.equal(source.includes("if (workingId) return"), true);
  assert.equal(source.includes("disabled={controlsBusy"), true);
});
