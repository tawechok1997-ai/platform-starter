import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('admin account details load security and effective access together', () => {
  assert.match(source, /Promise\.all\(\[/);
  assert.match(source, /\/security`/);
  assert.match(source, /\/effective-access`/);
  assert.match(source, /isSecurityOverview/);
  assert.match(source, /isEffectiveAccess/);
});

test('admin account directory exposes primary role and all assigned roles', () => {
  assert.match(source, /role\.code === user\.position/);
  assert.match(source, /PRIMARY/);
  assert.match(source, /จำนวน Role/);
  assert.match(source, /user\.roles\.map/);
});

test('admin account drawer shows team scope approval limits and deny-first access', () => {
  assert.match(source, /Effective access/);
  assert.match(source, /effective\.teams/);
  assert.match(source, /effective\.deniedPermissions/);
  assert.match(source, /approvalLimits/);
  assert.match(source, /Scope \/ Approval limits/);
});

test('admin account lifecycle includes disabled state', () => {
  assert.match(source, /'DISABLED'/);
  assert.match(source, /ปิดใช้งาน/);
});
