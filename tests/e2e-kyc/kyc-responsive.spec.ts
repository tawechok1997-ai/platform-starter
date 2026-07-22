import { expect, test } from '@playwright/test';

const memberCase = {
  item: {
    id: '11111111-1111-4111-8111-111111111111',
    memberId: '22222222-2222-4222-8222-222222222222',
    status: 'DRAFT',
    riskLevel: 'NORMAL',
    version: 1,
    createdAt: '2026-07-14T01:00:00.000Z',
  },
  documents: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      caseId: '11111111-1111-4111-8111-111111111111',
      memberId: '22222222-2222-4222-8222-222222222222',
      documentType: 'SELFIE',
      status: 'UPLOADED',
      originalName: 'selfie.png',
      mimeType: 'image/png',
      sizeBytes: 102400,
      version: 1,
      createdAt: '2026-07-14T01:05:00.000Z',
    },
  ],
};

const adminList = {
  items: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      memberId: '22222222-2222-4222-8222-222222222222',
      status: 'SUBMITTED',
      riskLevel: 'ENHANCED',
      version: 2,
      createdAt: '2026-07-14T01:00:00.000Z',
      submittedAt: '2026-07-14T01:10:00.000Z',
      documentCount: 2,
      member: { username: 'kyc-test-member', phone: '0890000000', email: 'kyc@example.test' },
    },
  ],
  total: 1,
  page: 1,
  pageCount: 1,
};

const adminDetail = {
  item: adminList.items[0],
  documents: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      caseId: adminList.items[0].id,
      memberId: adminList.items[0].memberId,
      documentType: 'PASSPORT',
      status: 'UPLOADED',
      originalName: 'passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 512000,
      version: 1,
      createdAt: '2026-07-14T01:03:00.000Z',
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      caseId: adminList.items[0].id,
      memberId: adminList.items[0].memberId,
      documentType: 'SELFIE',
      status: 'ACCEPTED',
      originalName: 'selfie.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 256000,
      version: 2,
      reviewNote: 'ภาพชัดเจน',
      createdAt: '2026-07-14T01:04:00.000Z',
    },
  ],
};

test.describe('KYC responsive regression', () => {
  test('member KYC renders draft upload state without horizontal overflow', async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem('member_access_token', 'e2e-member-token'));
    await page.route('**/member/kyc', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(memberCase) });
        return;
      }
      await route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'Mutation disabled in visual regression' }) });
    });

    await page.goto('http://127.0.0.1:3101/kyc');
    await expect(page.getByRole('heading', { name: /ยืนยันตัวตน|KYC/i })).toBeVisible();
    await expect(page.getByText('selfie.png')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ส่งคำขอตรวจ' })).toBeDisabled();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);

    await testInfo.attach(`member-kyc-${testInfo.project.name}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  test('admin KYC renders queue and detail safely without mutations', async ({ page }, testInfo) => {
    await page.route('**/admin/auth/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/me')) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'admin-e2e', permissions: ['risk.view', 'risk.resolve'] }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'e2e-admin-token' }) });
    });
    await page.route('**/admin/kyc/cases**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (/\/cases\/[0-9a-f-]+$/i.test(path)) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminDetail) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminList) });
    });
    await page.route('**/admin/kyc/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (route.request().method() === 'GET' && /\/admin\/kyc\/cases(?:\/[^/]+)?$/.test(path)) {
        await route.fallback();
        return;
      }
      await route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ message: 'Mutation disabled in visual regression' }) });
    });

    await page.goto('http://127.0.0.1:3102/kyc');
    await expect(page.getByRole('heading', { name: /ตรวจสอบ KYC/i })).toBeVisible();
    await expect(page.getByText('kyc-test-member')).toBeVisible();
    await page.getByRole('button', { name: 'เปิดเคส' }).click();
    await expect(page.getByText('passport.pdf')).toBeVisible();
    await expect(page.getByText('selfie.jpg')).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);

    await testInfo.attach(`admin-kyc-${testInfo.project.name}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
