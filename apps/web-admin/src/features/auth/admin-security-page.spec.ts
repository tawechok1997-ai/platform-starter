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
});

test('admin security component keeps complete 2FA lifecycle', () => {
  assert.match(source, /\/admin\/auth\/2fa\/setup/);
  assert.match(source, /\/admin\/auth\/2fa\/enable/);
  assert.match(source, /\/admin\/auth\/2fa\/disable/);
  assert.match(source, /\/admin\/auth\/2fa\/recovery-codes\/regenerate/);
  assert.match(source, /QRCode\.toDataURL/);
});

test('owner recovery state is permission-safe and visible', () => {
  assert.match(source, /\/admin\/access\/owner-recovery-status/);
  assert.match(source, /res\.status === 403/);
  assert.match(source, /recoveryCodesRemaining/);
  assert.match(source, /protectedAdmins/);
});

test('destructive actions require explicit confirmation', () => {
  assert.match(source, /AdminConfirmDialog/);
  assert.match(source, /PendingAction/);
  assert.match(source, /setPendingAction/);
  assert.match(source, /confirmPendingAction/);
  assert.match(source, /disable-2fa/);
  assert.match(source, /regenerate-codes/);
  assert.match(source, /revoke-session/);
  assert.match(source, /logout-others/);
  assert.match(source, /logout-all/);
});
