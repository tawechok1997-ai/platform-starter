import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const rolesSource = readFileSync(path.join(process.cwd(), 'app/(admin)/admin-roles/page.tsx'), 'utf8');
const securitySource = readFileSync(path.join(process.cwd(), 'src/features/auth/admin-security-page.tsx'), 'utf8');

test('admin roles supports search, accordion expansion, and permission preview', () => {
  assert.equal(rolesSource.includes("const [query, setQuery]"), true);
  assert.equal(rolesSource.includes('normalizedQuery'), true);
  assert.equal(rolesSource.includes("const [expandedRoleId, setExpandedRoleId]"), true);
  assert.equal(rolesSource.includes("expanded ? 'ย่อ' : 'ดู Permission'"), true);
  assert.equal(rolesSource.includes("const [previewPermission, setPreviewPermission]"), true);
  assert.equal(rolesSource.includes('<AdminDrawer'), true);
  assert.equal(rolesSource.includes('หน้านี้เป็น read-only preview'), true);
});

test('admin security uses shared confirmations and safe errors for sensitive actions', () => {
  assert.equal(securitySource.includes('<AdminConfirmDialog'), true);
  assert.equal(securitySource.includes('window.confirm'), false);
  assert.equal(securitySource.includes('window.prompt'), false);
  assert.equal(securitySource.includes('SAFE_ERRORS'), true);
  assert.equal(securitySource.includes('safeError(data'), true);
  assert.equal((securitySource.match(/finally/g) ?? []).length >= 6, true);
  assert.equal(securitySource.includes('if (!action || loading) return'), true);
});

test('admin security protects session and 2FA actions from duplicate submission', () => {
  assert.equal(securitySource.includes("kind: 'disable-2fa'"), true);
  assert.equal(securitySource.includes("kind: 'regenerate-codes'"), true);
  assert.equal(securitySource.includes("kind: 'logout-others'"), true);
  assert.equal(securitySource.includes("kind: 'logout-all'"), true);
  assert.equal(securitySource.includes("kind: 'revoke-session'"), true);
  assert.equal(securitySource.includes('busy={loading}'), true);
});
