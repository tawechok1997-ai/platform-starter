import { expect, test } from '@playwright/test';

const apiUrl = (process.env.FINANCE_E2E_API_URL || process.env.API_URL || '').replace(/\/$/, '');
const memberToken = process.env.FINANCE_E2E_MEMBER_TOKEN;
const adminToken = process.env.FINANCE_E2E_ADMIN_TOKEN;
const receivingBankAccountId = process.env.FINANCE_E2E_RECEIVING_ACCOUNT_ID;
const withdrawalAccountName = process.env.FINANCE_E2E_ACCOUNT_NAME || 'Finance E2E User';
const withdrawalAccountNumber = process.env.FINANCE_E2E_ACCOUNT_NUMBER;
const withdrawalBankName = process.env.FINANCE_E2E_BANK_NAME || 'Test Bank';
const enabled = process.env.FINANCE_E2E_ENABLED === 'true';
const onePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test.describe('staged finance end-to-end flow', () => {
  test.skip(!enabled, 'Set FINANCE_E2E_ENABLED=true only for an isolated staging environment');
  test.skip(!apiUrl || !memberToken || !adminToken || !receivingBankAccountId || !withdrawalAccountNumber, 'Finance E2E credentials/configuration are not present');
  test.describe.configure({ mode: 'serial' });

  test('deposit credit then withdrawal payout preserves terminal states', async ({ request }) => {
    const requestId = `finance-e2e-${Date.now()}`;
    const memberHeaders = { Authorization: `Bearer ${memberToken}`, 'content-type': 'application/json' };
    const adminHeaders = { Authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' };
    const call = async (method: string, path: string, headers: Record<string, string>, data?: unknown) => {
      const response = await request.fetch(`${apiUrl}${path}`, { method, headers, data });
      expect(response.status(), `${method} ${path}`).toBeLessThan(300);
      return response.json();
    };

    const deposit = await call('POST', '/member/topups', memberHeaders, {
      amount: 100,
      method: 'bank_transfer',
      referenceCode: requestId,
      note: JSON.stringify({ receivingBankAccountId }),
    });
    expect(deposit.id).toBeTruthy();

    const evidence = await call('POST', `/member/topups/${deposit.id}/slip-evidence`, memberHeaders, {
      slipImageData: onePixelPng,
      slipImageName: 'finance-e2e.png',
      transactionRef: requestId,
      detectedAmount: '100',
    });
    expect(evidence.duplicate).not.toBe(true);
    await call('POST', `/admin/topups/${deposit.id}/claim`, adminHeaders, {});
    await call('POST', `/admin/topups/${deposit.id}/approve-slip`, adminHeaders, { adminNote: 'staged E2E' });
    await call('POST', `/admin/topups/${deposit.id}/confirm-credit`, adminHeaders, { adminNote: 'staged E2E' });
    const completedDeposit = await call('GET', `/admin/topups/${deposit.id}`, adminHeaders);
    expect(completedDeposit.status).toBe('COMPLETED');

    const withdrawal = await call('POST', '/member/withdrawals', memberHeaders, {
      amount: 50,
      method: 'bank_transfer',
      accountName: withdrawalAccountName,
      accountNumber: withdrawalAccountNumber,
      bankName: withdrawalBankName,
    });
    expect(withdrawal.id).toBeTruthy();
    await call('POST', `/admin/withdrawals/${withdrawal.id}/claim`, adminHeaders, {});
    await call('POST', `/admin/withdrawals/${withdrawal.id}/approve-for-payment`, adminHeaders, { note: 'staged E2E' });
    await call('POST', `/admin/withdrawals/${withdrawal.id}/payment-proof`, adminHeaders, {
      slipImageData: onePixelPng,
      slipImageName: 'finance-e2e-payout.png',
      transactionRef: `${requestId}-payout`,
    });
    await call('POST', `/admin/withdrawals/${withdrawal.id}/verify-payment`, adminHeaders, { note: 'staged E2E' });
    const completedWithdrawal = await call('GET', `/admin/withdrawals/${withdrawal.id}`, adminHeaders);
    expect(completedWithdrawal.status).toBe('COMPLETED');

    const wallet = await call('GET', '/member/wallet', memberHeaders);
    expect(wallet.wallet ?? wallet).toBeTruthy();
    const ledger = await call('GET', '/member/wallet/ledger?limit=100', memberHeaders);
    expect((ledger.items ?? ledger).length).toBeGreaterThan(0);
  });
});
