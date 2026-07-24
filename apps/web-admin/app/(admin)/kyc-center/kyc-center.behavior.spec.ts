import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.resolve(process.cwd(), 'app/(admin)/kyc-center/kyc-center-client.tsx'), 'utf8');

test('uses the shared accessible drawer for KYC details', () => {
  assert.equal(source.includes('AdminDrawer'), true);
  assert.equal(source.includes('kycDrawerLayerStyle'), false);
  assert.equal(source.includes('role="presentation"'), false);
});

test('guards KYC async operations with safe state cleanup', () => {
  assert.equal(source.includes('finally {\n      setAccountLoading(false);'), true);
  assert.equal(source.includes('finally {\n      setKycLoading(false);'), true);
  assert.equal(source.includes("finally {\n      setOpeningKycId('');"), true);
  assert.equal(source.match(/finally \{/g)?.length ?? 0 >= 5, true);
});

test('does not surface raw backend messages and disables busy controls', () => {
  assert.equal(source.includes('data.message'), false);
  assert.equal(source.includes('const pageBusy ='), true);
  assert.equal(source.includes('disabled={pageBusy}'), true);
  assert.equal(source.includes('busy={Boolean(selectedKyc && busyId === selectedKyc.item.id)}'), true);
});
