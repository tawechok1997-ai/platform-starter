import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const verification = read('.github/workflows/member-production-verification.yml');
const inspection = read('.github/workflows/railway-web-member-inspect.yml');
const recovery = read('.github/workflows/railway-web-member-recovery.yml');
const docs = read('docs/member-production-verification.md');

test('production verification parses the explicit version commit field', () => {
  assert.match(verification, /jq -r 'if type == "object" and \(\.commit \| type\) == "string" then \.commit else "" end'/);
  assert.match(verification, /deployedCommit/);
  assert.doesNotMatch(verification, /grep -Fqi "\$EXPECTED_SHA" artifacts\/member-production-verification\/version\.json/);
});

test('workflow-only pull requests can adopt recovery tooling without weakening Member code gates', () => {
  assert.match(verification, /member_code_changed/);
  assert.match(verification, /continue-on-error: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  assert.match(verification, /this PR changes only verification\/recovery tooling/);
  assert.match(verification, /Member Production verification is required for this event/);
});

test('manual verification inputs are constrained before use', () => {
  assert.match(verification, /exactly 12 or 40 hexadecimal characters/);
  assert.match(verification, /must be a single HTTPS URL without whitespace/);
  assert.match(verification, /jq -n/);
});

test('Railway CLI execution uses a fixed reviewed version', () => {
  assert.match(inspection, /container: ghcr\.io\/railwayapp\/cli:4\.65\.0/);
  assert.match(recovery, /container: ghcr\.io\/railwayapp\/cli:4\.65\.0/);
  assert.doesNotMatch(inspection, /railwayapp\/cli:latest/);
  assert.doesNotMatch(recovery, /railwayapp\/cli:latest/);
});

test('recovery deploys the checked-out main commit and does not race two deployments', () => {
  assert.match(recovery, /source_sha="\$\(git rev-parse HEAD\)"/);
  assert.match(recovery, /SOURCE_SHA=\$source_sha/);
  assert.match(recovery, /Recover Web Member from GitHub main \$\{SOURCE_SHA\}/);

  const redeployStep = recovery.match(/- name: Redeploy latest Railway deployment([\s\S]*?)- name: Upload checked-out main/)?.[1] ?? '';
  assert.match(redeployStep, /inputs\.action == 'redeploy-latest'/);
  assert.doesNotMatch(redeployStep, /full-recovery/);

  const uploadStep = recovery.match(/- name: Upload checked-out main([\s\S]*?)- name: Generate Railway-provided domain/)?.[1] ?? '';
  assert.match(uploadStep, /inputs\.action == 'deploy-main' \|\| inputs\.action == 'full-recovery'/);
});

test('read-only inspection is allowed without confirmation but mutations are guarded', () => {
  assert.match(recovery, /\$RECOVERY_ACTION" != "inspect"/);
  assert.match(recovery, /\$CONFIRM_MUTATION" != "true"/);
  assert.match(recovery, /requires confirm=true/);
});

test('Railway secrets are scoped to the authentication step', () => {
  assert.match(inspection, /- name: Select Railway authentication token[\s\S]*?env:[\s\S]*?PROJECT_TOKEN: \$\{\{ secrets\.RAILWAY_PROJECT_TOKEN \}\}/);
  assert.match(recovery, /- name: Select Railway authentication token[\s\S]*?env:[\s\S]*?PROJECT_TOKEN: \$\{\{ secrets\.RAILWAY_PROJECT_TOKEN \}\}/);
});

test('documentation explains the bootstrap merge and post-merge recovery order', () => {
  assert.match(docs, /merge the workflow-only tooling PR/i);
  assert.match(docs, /run the recovery workflow from `main`/i);
  assert.match(docs, /full-recovery/i);
});
