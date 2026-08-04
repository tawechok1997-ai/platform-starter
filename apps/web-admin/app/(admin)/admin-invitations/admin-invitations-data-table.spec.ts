import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('access invitations use the shared responsive data table', () => {
  assert.match(source, /AdminDataTable/);
  assert.match(source, /AdminDataColumn<Invitation>/);
  assert.match(source, /rows=\{visibleItems\}/);
  assert.match(source, /totalItems=\{normalizedItems\.length\}/);
  assert.equal(source.includes('AdminSectionRow'), false);
});

test('invitation table keeps permission-gated revoke and reissue actions', () => {
  assert.match(source, /AdminPermissionGate anyOf=\{ADMIN_ACTION_PERMISSIONS\.adminInvitationManage\}/);
  assert.match(source, /type: 'reissue'/);
  assert.match(source, /type: 'revoke'/);
  assert.match(source, /INVITATION_LINK_TTL_MS = 60_000/);
});

test('P7 removes hardcoded page layout styles from invitation workspace', () => {
  assert.equal(source.includes('style={noticeStyle}'), false);
  assert.equal(source.includes('const linkStyle'), false);
  assert.match(source, /admin-invitations\.module\.css/);
});
