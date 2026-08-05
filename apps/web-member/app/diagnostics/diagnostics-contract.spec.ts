import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const diagnosticsPage = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const versionRoute = readFileSync(new URL('../api/version/route.ts', import.meta.url), 'utf8');
const memberRoutes = readFileSync(new URL('../member-routes.ts', import.meta.url), 'utf8');

test('diagnostics page and API expose the same build identity sources', () => {
  for (const source of [diagnosticsPage, versionRoute]) {
    assert.match(source, /process\.env\.APP_VERSION/);
    assert.match(source, /process\.env\.GIT_COMMIT_SHA/);
    assert.match(source, /process\.env\.RAILWAY_GIT_COMMIT_SHA/);
    assert.match(source, /process\.env\.BUILT_AT/);
  }

  assert.match(diagnosticsPage, /data-build-commit=\{diagnostics\.commit\}/);
  assert.match(diagnosticsPage, /data-build-time=\{diagnostics\.builtAt\}/);
  assert.match(versionRoute, /'cache-control': 'no-store, max-age=0'/);
});

test('diagnostics is publicly reachable without weakening private member routes', () => {
  assert.match(memberRoutes, /prefix: '\/diagnostics'[\s\S]*public: true/);
  assert.doesNotMatch(memberRoutes, /prefix: '\/deposit'[\s\S]*public: true/);
  assert.doesNotMatch(memberRoutes, /prefix: '\/withdraw'[\s\S]*public: true/);
});
