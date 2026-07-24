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

test('checks all three public service targets without embedding credentials', () => {
  for (const name of ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL', 'P6_APPROVED_COMMIT_SHA']) {
    assert.match(workflow, new RegExp(name));
  }
  assert.match(workflow, /vars\.P6_API_URL/);
  assert.match(workflow, /vars\.P6_ADMIN_URL/);
  assert.match(workflow, /vars\.P6_MEMBER_URL/);
  assert.equal(workflow.includes('secrets.P6_'), false);
});

test('polls connectivity and deployment identity instead of using a one-shot probe', () => {
  assert.match(workflow, /attempts=30/);
  assert.match(workflow, /interval=20/);
  assert.match(workflow, /check-p6-connectivity\.mjs --json/);
  assert.match(workflow, /check-p6-deployment-identity\.mjs --json/);
  assert.match(workflow, /sleep "\$interval"/);
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
