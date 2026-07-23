import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const transferListSource = readFileSync(new URL('../game-transfers/page.tsx', import.meta.url), 'utf8');
const transferDetailSource = readFileSync(new URL('../game-transfers/[id]/page.tsx', import.meta.url), 'utf8');
const webhookSource = readFileSync(new URL('../webhook-logs/page.tsx', import.meta.url), 'utf8');

test('game transfer technical payloads use the shared redaction boundary', () => {
  assert.match(transferListSource, /stringifyAdminPayload/);
  assert.match(transferDetailSource, /stringifyAdminPayload/);
  assert.doesNotMatch(transferListSource, /JSON\.stringify\(\{\s*requestPayload:/);
  assert.doesNotMatch(transferDetailSource, /JSON\.stringify\(payload\s*\?\?/);
});

test('webhook technical payloads are redacted before the shared payload viewer', () => {
  assert.match(webhookSource, /redactAdminPayload/);
  assert.match(webhookSource, /AdminPayloadViewer\s+payload=\{redactAdminPayload\(/);
});

test('technical payload routes do not render raw provider payloads directly', () => {
  for (const source of [transferListSource, transferDetailSource, webhookSource]) {
    assert.doesNotMatch(source, /<pre[^>]*>\{JSON\.stringify\(/);
    assert.doesNotMatch(source, /AdminPayloadViewer\s+payload=\{\{\s*rawPayload:/);
  }
});
