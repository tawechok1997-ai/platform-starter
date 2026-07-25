import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/admin-authenticated-ui-smoke.yml', import.meta.url), 'utf8');
const config = readFileSync(new URL('../playwright.authenticated-visual.config.ts', import.meta.url), 'utf8');
const spec = readFileSync(new URL('../tests/authenticated-visual/seeded-authenticated-visual.spec.ts', import.meta.url), 'utf8');

test('Admin UI smoke remains manually dispatched and read-only', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.equal(workflow.includes('push:'), false);
  assert.equal(workflow.includes('pull_request:'), false);
  assert.equal(workflow.includes('curl '), false);
  assert.equal(workflow.includes('method: POST'), false);
});

test('validates HTTPS, host allow-list and real credentials', () => {
  assert.match(workflow, /must use HTTPS except for localhost/);
  assert.match(workflow, /PROD_SMOKE_ALLOWED_HOSTS/);
  assert.match(workflow, /Seeded Admin identity is required/);
  assert.match(workflow, /Seeded Admin password is missing or malformed/);
  assert.match(workflow, /REQUIRE_ADMIN_AUTHENTICATED_SMOKE: 'true'/);
});

test('runs the Admin test at explicit desktop and mobile viewports', () => {
  assert.match(workflow, /--grep "admin authenticated home"/);
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
  assert.match(spec, /Authenticated Admin routes/);
  assert.match(spec, /must not overflow horizontally/);
  assert.match(spec, /cards must stay inside the viewport/);
  assert.match(spec, /--admin-modern-brand/);
});

test('retains responsive evidence without recording credentials', () => {
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /retention-days: 14/);
  assert.match(workflow, /Credentials are never written to artifacts/);
  assert.equal(workflow.includes('echo "$SEED_ADMIN_PASSWORD"'), false);
});
