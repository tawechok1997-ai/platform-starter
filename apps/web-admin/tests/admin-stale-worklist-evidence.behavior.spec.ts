import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const bankAccounts = read('app/(admin)/bank-accounts/page.tsx');
const kycCenter = read('app/(admin)/kyc-center/kyc-center-client.tsx');
const walletAnalytics = read('app/(admin)/wallet-analytics/page.tsx');

test('bank accounts use locale copy and clear every async busy state', () => {
  assert.equal(bankAccounts.includes('useAdminLocale'), true);
  assert.equal(bankAccounts.includes('copyByLocale'), true);
  assert.equal(bankAccounts.includes('const queueBusy ='), true);
  assert.equal((bankAccounts.match(/finally/g) ?? []).length >= 4, true);
  assert.equal(bankAccounts.includes('data?.message'), false);
});

test('kyc center uses the shared drawer and guarded review workflows', () => {
  assert.equal(kycCenter.includes('AdminDrawer'), true);
  assert.equal(kycCenter.includes('<AdminDrawer'), true);
  assert.equal(kycCenter.includes('const pageBusy ='), true);
  assert.equal(kycCenter.includes('if (!pendingKycReview || busyId) return'), true);
  assert.equal(kycCenter.includes('if (!pendingReview || busyId) return'), true);
  assert.equal((kycCenter.match(/finally/g) ?? []).length >= 5, true);
});

test('wallet analytics covers range selection, chart, empty state, legend and tooltips', () => {
  assert.equal(walletAnalytics.includes('[7,14,30,90]'), true);
  assert.equal(walletAnalytics.includes('admin-wallet-analytics__chart'), true);
  assert.equal(walletAnalytics.includes('admin-wallet-analytics__bar-item'), true);
  assert.equal(walletAnalytics.includes('ยังไม่มีข้อมูล Wallet Analytics'), true);
  assert.equal(walletAnalytics.includes('admin-wallet-analytics__legend'), true);
  assert.equal(walletAnalytics.includes('title={tooltip}'), true);
  assert.equal(walletAnalytics.includes('aria-label={tooltip}'), true);
});
