import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const source = readFileSync(resolve(process.cwd(), 'app/(admin)/game-transfers/page.tsx'), 'utf8');

test('failed transfer retry uses the canonical real-mutation endpoint', () => {
  assert.match(source, /`\/admin\/game-transfers\/\$\{item\.id\}\/retry`/);
  assert.doesNotMatch(source, /retry-dry-run/);
  assert.match(source, /JSON\.stringify\(body\)/);
  assert.match(source, /\{ reason \}/);
});

test('real retry is described as a real wallet/provider mutation', () => {
  assert.match(source, /Retry รายการเงินจริง/);
  assert.match(source, /Real mutation/);
  assert.match(source, /Debit\/Credit Wallet จริง/);
  assert.match(source, /reason\.length < 8/);
});
