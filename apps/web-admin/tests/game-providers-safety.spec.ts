import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'src/features/finance/game-providers-page.tsx'), 'utf8');

test('uses the shared drawer for provider details', () => {
  assert.equal(source.includes('AdminDrawer'), true);
  assert.equal(source.includes('open={Boolean(detail)}'), true);
  assert.equal(source.includes('busy={locked}'), true);
});

test('guards provider mutations with shared busy state and finally cleanup', () => {
  assert.equal(source.includes("type BusyAction = 'list' | 'detail' | 'provider' | 'status' | 'sync' | 'health' | 'endpoint' | 'credential' | null"), true);
  assert.equal((source.match(/finally \{/g) ?? []).length >= 7, true);
  assert.equal(source.includes('if (!pendingAction || locked) return'), true);
  assert.equal(source.includes('disabled={locked}'), true);
});

test('does not surface backend error messages directly', () => {
  assert.equal(source.includes('data?.message'), false);
  assert.equal(source.includes('errorMessage'), false);
});
