import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/deployment-verification.yml', import.meta.url), 'utf8');

test('runs after a successful main Build or by explicit dispatch', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows: \[Build\]/);
  assert.match(workflow, /workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /workflow_run\.head_branch == 'main'/);
});

test('checks all three public service targets without storing public URLs as secrets', () => {
  for (const name of ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL', 'P6_APPROVED_COMMIT_SHA']) {
    assert.match(workflow, new RegExp(name));
  }
  assert.match(workflow, /vars\.P6_API_URL/);
  assert.match(workflow, /vars\.P6_ADMIN_URL/);
  assert.match(workflow, /vars\.P6_MEMBER_URL/);
  assert.equal(workflow.includes('secrets.P6_API_URL'), false);
  assert.equal(workflow.includes('secrets.P6_ADMIN_URL'), false);
  assert.equal(workflow.includes('secrets.P6_MEMBER_URL'), false);
});

test('uses a secret only for the protected admin token and variables for prepared request ids', () => {
  const secretReferences = workflow.match(/secrets\.P6_[A-Z0-9_]+/g) ?? [];
  assert.deepEqual(secretReferences, ['secrets.P6_ADMIN_ACCESS_TOKEN']);
  assert.match(workflow, /vars\.P6_DEPOSIT_REQUEST_ID/);
  assert.match(workflow, /vars\.P6_WITHDRAWAL_REQUEST_ID/);
  assert.equal(workflow.includes('secrets.P6_DEPOSIT_REQUEST_ID'), false);
  assert.equal(workflow.includes('secrets.P6_WITHDRAWAL_REQUEST_ID'), false);
});

test('polls connectivity and deployment identity instead of using a one-shot probe', () => {
  assert.match(workflow, /attempts=30/);
  assert.match(workflow, /interval=20/);
  assert.match(workflow, /check-p6-connectivity\.mjs --json/);
  assert.match(workflow, /check-p6-deployment-identity\.mjs --json/);
  assert.match(workflow, /sleep "\$interval"/);
});

test('runs strict private evidence verification only when protected inputs exist', () => {
  assert.match(workflow, /check-private-finance-storage\.mjs --json --strict/);
  assert.match(workflow, /P6_ADMIN_ACCESS_TOKEN P6_DEPOSIT_REQUEST_ID P6_WITHDRAWAL_REQUEST_ID/);
  assert.match(workflow, /SKIPPED because the protected token or prepared request IDs are not configured/);
  assert.match(workflow, /::error title=Private finance evidence verification failed/);
  assert.match(workflow, /private-storage\.json/);
});

test('reports failures to GitHub and retains machine-readable evidence', () => {
  assert.match(workflow, /::error title=Deployment verification failed/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /deployment-verification-reports\/\*\.json/);
  assert.match(workflow, /retention-days: 7/);
});

test('uses the exact verified commit for checkout and identity comparison', () => {
  const headShaReferences = workflow.match(/github\.event\.workflow_run\.head_sha \|\| github\.sha/g) ?? [];
  assert.ok(headShaReferences.length >= 2);
  assert.match(workflow, /P6_APPROVED_COMMIT_SHA:/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.workflow_run\.head_sha \|\| github\.sha \}\}/);
});
