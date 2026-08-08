import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repositoryRoot = path.resolve(process.cwd(), '../..');
const read = (relativePath: string) => readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

const workflow = read('.github/workflows/admin-pr3-staging-acceptance.yml');
const seed = read('prisma/seed-admin-pr3-personas.ts');
const config = read('playwright.admin-pr3.config.ts');
const acceptance = read('tests/admin-pr3-staging/admin-pr3-staging-acceptance.spec.ts');
const profile = read('apps/api/src/modules/admin-auth/admin-profile-query.service.ts');
const profileTest = read('apps/api/src/modules/admin-auth/admin-profile-query.service.spec.ts');
const documentation = read('docs/admin-pr3-staging-acceptance.md');

test('PR-3 acceptance runs on pull requests against disposable staging only', () => {
  assert.match(workflow, /name: Admin PR-3 Staging Acceptance/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /group: admin-pr3-staging-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/);
  assert.match(workflow, /cancel-in-progress: true/);
  assert.match(workflow, /timeout-minutes: 120/);
  assert.match(workflow, /image: postgres:16/);
  assert.match(workflow, /PR3_ALLOW_DISPOSABLE_SEED: 'true'/);
  assert.match(workflow, /NODE_ENV: test/);
  assert.match(workflow, /Verify staging health and commit identity/);
  assert.match(workflow, /playwright test -c playwright\.admin-pr3\.config\.ts/);
  assert.equal(workflow.includes('platformweb-admin-production'), false);
  assert.equal(workflow.includes('railway.app'), false);
});

test('PR-3 persona seed is fail-closed and never writes credentials to evidence', () => {
  assert.match(seed, /PR3_ALLOW_DISPOSABLE_SEED/);
  assert.match(seed, /PR-3 persona seed is forbidden in production/);
  assert.match(seed, /disposable local database/);
  assert.match(seed, /'finance'/);
  assert.match(seed, /'deposit-withdrawal'/);
  assert.match(seed, /'marketing'/);
  assert.match(seed, /'manager'/);
  assert.match(seed, /'system-admin'/);
  assert.match(seed, /'multi-role'/);
  assert.match(seed, /'explicit-deny'/);
  assert.match(seed, /permission_code, effect/);
  assert.match(seed, /'\*', 'DENY'/);
  assert.equal(/return\s*\{[\s\S]*password[,:]/.test(seed), false);
});

test('PR-3 browser acceptance uses the canonical 225-case matrix and real authentication', () => {
  const sessionTokenKey = ['admin', 'access', 'token'].join('_');
  assert.match(acceptance, /buildP8Tier0Matrix/);
  assert.match(acceptance, /page\.goto\(new URL\('\/login'/);
  assert.equal(acceptance.includes(`sessionStorage.getItem('${sessionTokenKey}')`), true);
  assert.match(acceptance, /\/api\/admin\/auth\/me/);
  assert.match(acceptance, /canAccessPath/);
  assert.match(acceptance, /persona === 'explicit-deny'/);
  assert.match(acceptance, /profile\.permissions\)\.toEqual\(\[\]\)/);
  assert.match(acceptance, /dashboard-widget-layout-v1/);
  assert.match(acceptance, /baseline\.value \?\? \{\}/);
  assert.match(acceptance, /new AxeBuilder/);
  assert.match(acceptance, /violation\.impact === 'serious'/);
  assert.match(acceptance, /domContentLoadedMs/);
  assert.match(acceptance, /totalTransferBytes/);
  assert.match(acceptance, /logout\(context, token\)/);
  assert.match(acceptance, /verifyReversibleMutation[\s\S]*finally \{[\s\S]*data: \{ value: baseline\.value \?\? \{\} \}/);
  assert.equal(acceptance.includes("waitForLoadState('networkidle'"), false);
  assert.equal(acceptance.includes("window.localStorage.setItem('admin_session_hint', '1')"), false);
});

test('PR-3 runs five browser and viewport acceptance projects without credential-bearing traces', () => {
  for (const project of [
    'chromium-desktop',
    'chromium-tablet',
    'chromium-mobile',
    'firefox-desktop',
    'webkit-desktop',
  ]) {
    assert.match(config, new RegExp(`name: '${project}'`));
  }
  assert.match(config, /timeout: 30 \* 60_000/);
  assert.match(config, /workers: 1/);
  assert.match(config, /trace: 'off'/);
  assert.match(config, /video: 'off'/);
  assert.equal(config.includes("['html'"), false);
});

test('PR-3 runtime evidence is redacted before artifact upload', () => {
  assert.match(workflow, /Collect redacted runtime logs/);
  assert.match(workflow, /REDACTED_SECRET/);
  assert.match(workflow, /REDACTED_TOKEN/);
  assert.match(workflow, /REDACTED_JWT/);
  assert.match(workflow, /Runtime log artifacts are redacted before upload/);
  assert.equal(workflow.includes('cp /tmp/admin-pr3-api.log'), false);
  assert.equal(workflow.includes('cp /tmp/admin-pr3-web.log'), false);
});

test('Admin profile response preserves guard-resolved DENY permissions', () => {
  assert.match(profile, /sessionPermissions === undefined \? rolePermissions : sessionPermissions/);
  assert.match(profile, /explicitly supplied empty array is authoritative/);
  assert.match(profileTest, /wildcard DENY/);
  assert.match(profileTest, /expect\(result\.permissions\)\.toEqual\(\[\]\)/);
});

test('PR-3 documentation keeps mutation, production, and CI evidence boundaries explicit', () => {
  assert.match(documentation, /Mutation ทำเฉพาะ Disposable Staging/);
  assert.match(documentation, /Workflow ไม่ใช้ Railway หรือ Production URL/);
  assert.match(documentation, /Evidence manifest ไม่บันทึก Password, JWT หรือ Secret/);
  assert.match(documentation, /รวมทั้งหมด 225 cases/);
  assert.match(documentation, /สร้าง Head ใหม่ที่มีเนื้อหาจริง/);
  assert.match(documentation, /ห้ามอ้างผล `queued`, `pending`, `cancelled`/);
  assert.match(documentation, /Workflow ชุดใหม่จะจบสถานะ `success`/);
});
