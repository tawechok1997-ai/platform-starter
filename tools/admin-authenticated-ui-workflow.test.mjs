import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/admin-authenticated-ui-smoke.yml', import.meta.url), 'utf8');
const config = readFileSync(new URL('../playwright.authenticated-visual.config.ts', import.meta.url), 'utf8');
const spec = readFileSync(new URL('../tests/authenticated-visual/admin-authenticated-workspace.spec.ts', import.meta.url), 'utf8');

test('Admin UI smoke remains manually dispatched and browser mutations stay read-only', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.equal(workflow.includes('push:'), false);
  assert.equal(workflow.includes('pull_request:'), false);
  assert.equal(workflow.includes('curl '), false);
  assert.equal(workflow.includes('method: POST'), false);
  assert.match(spec, /Authenticated Admin workspace smoke must remain read-only/);
  assert.match(spec, /\['GET', 'HEAD', 'OPTIONS'\]/);
});

test('validates HTTPS, host allow-list, credentials and expected deployment commit', () => {
  assert.match(workflow, /\$\{name\} must use HTTPS except for localhost/);
  assert.match(workflow, /\['ADMIN_WEB_URL', process\.env\.ADMIN_WEB_URL\]/);
  assert.match(workflow, /\['API_PUBLIC_URL', process\.env\.API_PUBLIC_URL\]/);
  assert.match(workflow, /PROD_SMOKE_ALLOWED_HOSTS/);
  assert.match(workflow, /EXPECTED_DEPLOY_COMMIT is missing or malformed/);
  assert.match(workflow, /Seeded Admin identity is required/);
  assert.match(workflow, /Seeded Admin password is missing or malformed/);
  assert.match(workflow, /REQUIRE_ADMIN_AUTHENTICATED_SMOKE: 'true'/);
});

test('verifies Production health and commit identity before browser smoke', () => {
  assert.match(workflow, /Verify Production health and commit identity/);
  assert.match(workflow, /read\('\/health'\)/);
  assert.match(workflow, /read\('\/version'\)/);
  assert.match(workflow, /Production commit \$\{deployed\} does not match expected \$\{expected\}/);
  assert.match(workflow, /inputs\.expected_commit \|\| github\.sha/);
});

test('runs the dedicated Admin workspace test at explicit desktop and mobile viewports', () => {
  assert.match(workflow, /--grep "admin authenticated workspace smoke"/);
  assert.match(config, /name: 'desktop-chromium'/);
  assert.match(config, /viewport: \{ width: 1440, height: 1000 \}/);
  assert.match(config, /name: 'mobile-chromium'/);
  assert.match(config, /devices\['Pixel 7'\]/);
});

test('checks the shared shell, command palette, responsive navigation and route overflow', () => {
  assert.match(spec, /\.admin-shell/);
  assert.match(spec, /\.admin-command-dialog/);
  assert.match(spec, /\.admin-menu-button/);
  assert.match(spec, /\.admin-collapse-button/);
  assert.match(spec, /\.admin-mobile-drawer-controller/);
  assert.match(spec, /must not overflow horizontally/);
  assert.match(spec, /surfaces must stay inside the viewport/);
  assert.match(spec, /accessibleRoutes\.length\)\.toBeLessThanOrEqual\(11\)/);
  assert.match(spec, /test\.afterEach/);
  assert.match(spec, /api\/admin\/auth\/logout/);
  assert.match(spec, /Admin smoke logout cleanup failed/);
  assert.match(spec, /--admin-modern-brand/);
});

test('retains responsive evidence without recording credentials', () => {
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /retention-days: 14/);
  assert.match(workflow, /Credentials are never written to artifacts/);
  assert.equal(workflow.includes('echo "$SEED_ADMIN_PASSWORD"'), false);
  assert.match(spec, /admin-authenticated-workspace-audit\.json/);
});
