import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const footer = readFileSync(new URL('./member-footer.tsx', import.meta.url), 'utf8');
const memberApi = readFileSync(new URL('./member-api.ts', import.meta.url), 'utf8');

test('guest users do not render the Member footer before login', () => {
  assert.match(
    footer,
    /MEMBER_SESSION_CHANGED_EVENT, hasMemberSessionTokens/,
  );
  assert.match(
    footer,
    /const \[hasSession, setHasSession\] = useState<boolean \| null>\(null\)/,
  );
  assert.match(
    footer,
    /if \(viewport === null \|\| hasSession !== true\) return null;/,
  );
});

test('footer visibility follows login, logout and cross-tab session changes', () => {
  assert.match(
    footer,
    /window\.addEventListener\(MEMBER_SESSION_CHANGED_EVENT, syncSession\)/,
  );
  assert.match(
    footer,
    /window\.addEventListener\('storage', syncSession\)/,
  );
  assert.match(
    footer,
    /window\.removeEventListener\(MEMBER_SESSION_CHANGED_EVENT, syncSession\)/,
  );
  assert.match(
    memberApi,
    /export const MEMBER_SESSION_CHANGED_EVENT = 'platform:member-session-changed'/,
  );
  assert.match(memberApi, /export function hasMemberSessionTokens\(\)/);
});
