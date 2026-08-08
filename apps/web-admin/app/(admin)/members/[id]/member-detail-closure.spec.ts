import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const source = readFileSync(resolve(process.cwd(), 'app/(admin)/members/[id]/page.tsx'), 'utf8');

test('member detail mirrors effective RBAC before status actions', () => {
  assert.match(source, /adminApiFetch\('\/admin\/auth\/me'\)/);
  assert.match(source, /permissions\.includes\('users\.suspend'\)/);
  assert.match(source, /disabled=!canManageStatus|disabled=\{!canManageStatus/);
});

test('member detail renders real session login risk and masked-bank evidence', () => {
  assert.match(source, /Member sessions/);
  assert.match(source, /Login history/);
  assert.match(source, /data\.riskAlerts/);
  assert.match(source, /accountNumberMasked/);
});

test('KYC stays delegated to its canonical owner and VIP is not fabricated', () => {
  assert.match(source, /href="\/kyc-center"/);
  assert.match(source, /persistent VIP owner/);
  assert.doesNotMatch(source, /adminApiFetch\(`\/admin\/kyc\/cases\/\$\{[^}]+\}\/review`/);
});
