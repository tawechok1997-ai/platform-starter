import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.join(process.cwd(), 'app/(admin)/provider-wallet-snapshots/[id]/page.tsx'), 'utf8');

test('uses shared confirmation instead of native prompts', () => {
  assert.equal(source.includes('<AdminConfirmDialog'), true);
  assert.equal(source.includes('window.prompt'), false);
  assert.equal(source.includes("reviewNote.trim()"), true);
  assert.equal(source.includes('note.length < 5'), true);
});

test('redacts payloads and uses fixed safe errors', () => {
  assert.equal(source.includes('stringifyAdminPayload'), true);
  assert.equal(source.includes('JSON.stringify(payload'), false);
  assert.equal(source.includes('data?.message'), false);
});

test('guards and cleans up asynchronous work', () => {
  assert.equal(source.includes('if (!reviewRequest || loading) return'), true);
  assert.equal((source.match(/finally/g) ?? []).length >= 2, true);
  assert.equal(source.includes('busy={loading}'), true);
});