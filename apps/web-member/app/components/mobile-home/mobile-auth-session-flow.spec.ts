import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const loginPage = readFileSync(new URL('../../(auth)/login/page.tsx', import.meta.url), 'utf8');
const sessionProvider = readFileSync(new URL('../../member-session-provider.tsx', import.meta.url), 'utf8');

test('embedded login validates stored tokens before announcing authentication success', () => {
  assert.match(loginPage, /memberApiFetch\('\/member\/auth\/profile'/);
  assert.match(loginPage, /if \(response\.ok\)/);
  assert.match(loginPage, /member-auth-ready/);
  assert.doesNotMatch(
    loginPage,
    /if \(hasMemberSessionTokens\(\)\) \{\s*if \(isEmbedded\)[\s\S]*member-auth-success/,
  );
});

test('member session verification reads the shared storage abstraction', () => {
  assert.match(sessionProvider, /if \(!hasMemberSessionTokens\(\)\)/);
  assert.doesNotMatch(sessionProvider, /window\.localStorage\.getItem\('member_access_token'\)/);
});
