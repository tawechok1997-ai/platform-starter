import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const workflow = read('.github/workflows/windows-one-click-smoke.yml');
const integration = read('tools/windows-one-click-integration-smoke.ps1');
const launchService = read('tools/windows-one-click-smoke-launch-service.ps1');
const service = read('tools/windows-one-click-smoke-service.mjs');
const start = read('scripts/windows/start.ps1');
const stop = read('scripts/windows/stop.ps1');


test('Windows workflow owns the native lifecycle integration smoke', () => {
  assert.match(workflow, /tools\/windows-one-click-integration-contract\.test\.mjs/);
  assert.match(workflow, /tools\/windows-one-click-smoke-launch-service\.ps1/);
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


test('PowerShell 5.1 process record parsing flattens nested JSON arrays safely', () => {
  for (const owner of [start, stop]) {
    assert.match(owner, /function Read-ProcessRecords/);
    assert.match(owner, /if \(\$item -is \[System\.Array\]\)/);
    assert.match(owner, /\[void\]\$records\.Add\(\$nested\)/);
    assert.match(owner, /\[int\]::TryParse\(\[string\]\$pidValues\[0\]/);
  }
});


test('smoke service launcher detaches Node from the owner console and waits for its exit', () => {
  assert.match(launchService, /Start-Process -FilePath \$NodePath/);
  assert.match(launchService, /-WindowStyle Hidden/);
  assert.match(launchService, /Wait-Process -Id \$serviceProcess\.Id/);
  assert.match(launchService, /Stop-Process -Id \$serviceProcess\.Id -Force/);
});


test('smoke services bind only to loopback and expose deterministic health responses', () => {
  assert.match(service, /createServer/);
  assert.match(service, /server\.listen\(port, '127\.0\.0\.1'/);
  assert.match(service, /ok: true/);
  assert.match(service, /cache-control/);
});


test('Windows workflow executes and validates the redacted verifier report', () => {
  assert.match(workflow, /Run verifier evidence smoke/);
  assert.match(workflow, /scripts\\windows\\verify\.ps1/);
  assert.match(workflow, /windows-clean-machine-verification\.json/);
  assert.match(workflow, /ConvertFrom-Json/);
  assert.match(workflow, /schemaVersion/);
  assert.match(workflow, /summary\.total/);
  assert.match(workflow, /ci-smoke-secret-/);
  assert.match(workflow, /Verifier evidence leaked an environment secret value/);
});
