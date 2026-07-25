import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/member-authenticated-production-smoke.yml', import.meta.url), 'utf8');

test('requires explicit workflow dispatch instead of running against production on pull requests', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.equal(/^\s*pull_request:/m.test(workflow), false);
  assert.match(workflow, /cancel-in-progress: true/);
});

test('keeps public target URLs separate from authentication secrets', () => {
  assert.match(workflow, /vars\.P6_MEMBER_URL/);
  assert.match(workflow, /vars\.P6_API_URL/);
  assert.match(workflow, /PROD_MEMBER_TOKEN: \$\{\{ secrets\.PROD_MEMBER_TOKEN \}\}/);
  assert.equal(workflow.includes('PROD_MEMBER_TOKEN: ${{ vars.'), false);
});

test('validates HTTPS targets and optional exact host allow-list', () => {
  assert.match(workflow, /must use HTTPS except for localhost/);
  assert.match(workflow, /must not embed credentials/);
  assert.match(workflow, /must not include a fragment/);
  assert.match(workflow, /PROD_SMOKE_ALLOWED_HOSTS/);
  assert.match(workflow, /host is not allow-listed/);
});

test('requires a real token or seeded credentials without printing their values', () => {
  assert.match(workflow, /token\.length < 24/);
  assert.match(workflow, /Member token or seeded credentials are required/);
  assert.match(workflow, /REQUIRE_MEMBER_AUTHENTICATED_SMOKE: 'true'/);
  assert.equal(workflow.includes('console.log(token)'), false);
  assert.equal(workflow.includes('echo "$PROD_MEMBER_TOKEN"'), false);
});

test('locks the production member smoke to read-only behavior', () => {
  assert.match(workflow, /PROD_SMOKE_MODE: read-only/);
  assert.match(workflow, /Authenticated Member Home smoke must remain read-only/);
  assert.match(workflow, /--grep "member authenticated home"/);
  assert.equal(workflow.includes('I_ACKNOWLEDGE_PRODUCTION_MUTATIONS'), false);
});

test('retains evidence and states that skipped tests are not success', () => {
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /test-results\/authenticated-visual\/\*\*/);
  assert.match(workflow, /playwright-report\/authenticated-visual\/\*\*/);
  assert.match(workflow, /never treats skipped tests as success/);
  assert.match(workflow, /retention-days: 14/);
});
