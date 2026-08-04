import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./admin-role-governance.module.css', import.meta.url), 'utf8');

test('role governance wires multi-role preview and synchronized role updates', () => {
  assert.match(source, /\/admin\/access\/role-preview/);
  assert.match(source, /\/admin\/access\/admin-users\/\$\{selectedAdmin\.id\}\/roles/);
  assert.match(source, /method: 'PATCH'/);
  assert.match(source, /primaryRoleId/);
  assert.match(source, /selectedRoleIds/);
  assert.match(source, /maximum of 8|สูงสุด 8|length >= 8/);
});

test('role governance blocks synchronized role updates when preview is denied or invalid', () => {
  assert.match(source, /async function previewRoles\(\): Promise<RolePreview \| null>/);
  assert.match(
    source,
    /const checkedPreview = rolePreview\?\.grantable \? rolePreview : await previewRoles\(\)/,
  );
  assert.match(source, /if \(!checkedPreview\?\.grantable\) return;/);
  assert.doesNotMatch(
    source,
    /if \(!rolePreview\?\.grantable\) await previewRoles\(\);\s*setBusy\('roles'\)/,
  );
});

test('role governance wires team hierarchy and direct reporting lines', () => {
  assert.match(source, /\/admin\/access\/teams/);
  assert.match(source, /\/members/);
  assert.match(source, /reporting-line/);
  assert.match(source, /parentTeamId/);
  assert.match(source, /managerAdminId/);
  assert.match(source, /isLead/);
});

test('role governance exposes deny-first overrides and effective access', () => {
  assert.match(source, /effective-access/);
  assert.match(source, /permission-overrides/);
  assert.match(source, /DENY always wins|DENY ชนะ/);
  assert.match(source, /deniedPermissions/);
  assert.match(source, /overrideEffect/);
});

test('role governance wires scope and approval limits with audited reasons', () => {
  assert.match(source, /access-profile/);
  assert.match(source, /scopeJson/);
  assert.match(source, /limitsJson/);
  assert.match(source, /profileReason/);
  assert.match(source, /parseJsonObject/);
});

test('role governance keeps responsive tablet mobile and reduced-motion layouts', () => {
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});
