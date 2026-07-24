import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const featureUrl = new URL('./admin-security-page.tsx', import.meta.url);
const routeUrl = new URL('../../../app/(admin)/security/page.tsx', import.meta.url);
const source = fs.readFileSync(featureUrl, 'utf8');
const route = fs.readFileSync(routeUrl, 'utf8');

test('admin security route remains a thin component boundary', () => {
  assert.match(route, /admin-security-page/);
  assert.equal(route.includes('adminApiFetch('), false);
  assert.equal(route.includes('useState('), false);
});

test('admin security component keeps critical session controls', () => {
  assert.match(source, /\/admin\/auth\/sessions/);
  assert.match(source, /logout-others/);
  assert.match(source, /logout-all/);
  assert.match(source, /clearAdminSession\(\)/);
  assert.match(source, /window\.location\.replace\(['"]\/login['"]\)/);
  assert.match(source, /encodeURIComponent\(session\.id\)/);
});

test('admin security component keeps complete 2FA lifecycle', () => {
  assert.match(source, /\/admin\/auth\/2fa\/setup/);
  assert.match(source, /\/admin\/auth\/2fa\/enable/);
  assert.match(source, /\/admin\/auth\/2fa\/disable/);
  assert.match(source, /\/admin\/auth\/2fa\/recovery-codes\/regenerate/);
  assert.match(source, /QRCode\.toDataURL/);
  assert.match(source, /TOTP_PATTERN/);
  assert.match(source, /isValidSecurityCode/);
});

test('owner recovery state is permission-safe and validated', () => {
  assert.match(source, /\/admin\/access\/owner-recovery-status/);
  assert.match(source, /response\.status === 403/);
  assert.match(source, /recoveryCodesRemaining/);
  assert.match(source, /protectedAdmins/);
  assert.match(source, /isOwnerRecoveryStatus/);
});

test('loads security sections independently without Promise all failure coupling', () => {
  assert.match(source, /const status: LoadStatus/);
  assert.match(source, /await loadMe\(\)/);
  assert.match(source, /await loadSessions\(\)/);
  assert.match(source, /await loadOwnerRecoveryStatus\(\)/);
  assert.equal(source.includes('Promise.all'), false);
});

test('validates security payloads before rendering', () => {
  for (const validator of ['isAdminMe', 'isSetupResponse', 'isSessionItem', 'isOwnerRecoveryStatus', 'isRecoveryCodeResponse']) {
    assert.match(source, new RegExp(`function ${validator}`));
  }
  assert.match(source, /payload\.items\.filter\(isSessionItem\)/);
});

test('clears sensitive setup and recovery values after a bounded display window', () => {
  assert.match(source, /SENSITIVE_DISPLAY_TTL_MS = 5 \* 60_000/);
  assert.match(source, /setSetup\(null\)/);
  assert.match(source, /setRecoveryCodes\(\[\]\)/);
  assert.match(source, /ล้างข้อมูลตั้งค่า 2FA จากหน้าจอแล้ว/);
  assert.match(source, /ล้าง Recovery codes จากหน้าจอแล้ว/);
});

test('destructive actions require shared confirmation and cannot close while busy', () => {
  assert.match(source, /AdminConfirmDialog/);
  assert.match(source, /PendingAction/);
  assert.match(source, /confirmPendingAction/);
  assert.match(source, /disable-2fa/);
  assert.match(source, /regenerate-codes/);
  assert.match(source, /revoke-session/);
  assert.match(source, /logout-others/);
  assert.match(source, /logout-all/);
  assert.match(source, /if \(!pageBusy\) setPendingAction\(null\)/);
});
