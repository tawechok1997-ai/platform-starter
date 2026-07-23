import { expect, test, type Locator } from '@playwright/test';

const memberBaseUrl = (process.env.MEMBER_BASE_URL || 'https://platformweb-member-production.up.railway.app').replace(/\/$/, '');

async function expectBrandLabelToFit(label: Locator) {
  await expect(label).toBeVisible();
  const metrics = await label.evaluate((element) => ({
    text: element.textContent?.trim() || '',
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(metrics.text.length).toBeGreaterThan(0);
  expect(metrics.scrollWidth, `Brand label is clipped: ${metrics.text}`).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('member_locale', 'th'));
});

test('deployed Login keeps Thai chrome pure and the mobile brand label visible', async ({ page }) => {
  const response = await page.goto(`${memberBaseUrl}/login`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => undefined);

  await expect(page.getByText('เข้าสู่ระบบสมาชิก', { exact: true })).toBeVisible();
  await expect(page.getByText('การเชื่อมต่อปลอดภัย', { exact: true })).toBeVisible();
  await expect(page.getByText('MEMBER ACCESS', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Secure connection', { exact: true })).toHaveCount(0);
  await expectBrandLabelToFit(page.locator('.public-auth-card__logo strong'));
});

test('deployed Register keeps Thai chrome pure and the mobile brand label visible', async ({ page }) => {
  const response = await page.goto(`${memberBaseUrl}/register`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => undefined);

  await expect(page.getByText('สร้างบัญชีสมาชิก', { exact: true })).toBeVisible();
  await expect(page.getByText('การสมัครที่ปลอดภัย', { exact: true })).toBeVisible();
  await expect(page.getByText('CREATE MEMBER ACCOUNT', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Secure registration', { exact: true })).toHaveCount(0);
  await expectBrandLabelToFit(page.locator('.public-auth-card__logo strong'));
});
