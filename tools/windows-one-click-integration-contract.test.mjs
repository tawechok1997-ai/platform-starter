import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const workflow = read('.github/workflows/windows-one-click-smoke.yml');
const integration = read('tools/windows-one-click-integration-smoke.ps1');
const service = read('tools/windows-one-click-smoke-service.mjs');


test('Windows workflow owns the native lifecycle integration smoke', () => {
  assert.match(workflow, /tools\/windows-one-click-integration-contract\.test\.mjs/);
  assert.match(workflow, /tools\\windows-one-click-integration-smoke\.ps1/);
  assert.match(workflow, /Run native launcher lifecycle integration smoke/);
  assert.match(workflow, /timeout-minutes: 20/);
});


test('integration smoke executes the maintained start and stop owners', () => {
  assert.match(integration, /scripts\\windows\\start\.ps1/);
  assert.match(integration, /scripts\\windows\\stop\.ps1/);
  assert.match(integration, /Invoke-OwnerScript -Path \$StartScript -Arguments @\('-NoBrowser'\)/);
  assert.match(integration, /Invoke-OwnerScript -Path \$StopScript/);
  assert.match(integration, /Read-ProcessRecords/);
});


test('integration smoke covers reuse recovery stop and stale PID safety', () => {
  assert.match(integration, /idempotent start to verify healthy process reuse/);
  assert.match(integration, /Stop-ListenerOnPort -Port 3000/);
  assert.match(integration, /terminal was not replaced after one service became unhealthy/);
  assert.match(integration, /Process record remained after a successful stop/);
  assert.match(integration, /startedAt = \$selfProcess\.StartTime\.AddMinutes\(-10\)/);
  assert.match(integration, /Stop owner terminated the smoke runner from a stale PID record/);
});


test('smoke services bind only to loopback and expose deterministic health responses', () => {
  assert.match(service, /createServer/);
  assert.match(service, /server\.listen\(port, '127\.0\.0\.1'/);
  assert.match(service, /ok: true/);
  assert.match(service, /cache-control/);
});
