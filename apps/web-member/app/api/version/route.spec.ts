import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const route = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');

test('member version endpoint prefers the Railway deployment SHA over generic fallback SHA', () => {
  assert.match(
    route,
    /process\.env\.RAILWAY_GIT_COMMIT_SHA\s*\?\?\s*process\.env\.GIT_COMMIT_SHA\s*\?\?\s*'unknown'/,
  );
  assert.doesNotMatch(
    route,
    /process\.env\.GIT_COMMIT_SHA\s*\?\?\s*process\.env\.RAILWAY_GIT_COMMIT_SHA/,
  );
});
