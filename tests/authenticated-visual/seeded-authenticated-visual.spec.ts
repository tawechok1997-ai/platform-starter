import { expect, test, type Page } from '@playwright/test';

const memberUrl = process.env.MEMBER_WEB_URL;
const adminUrl = process.env.ADMIN_WEB_URL;
const memberIdentity = process.env.SEED_MEMBER_USERNAME ?? process.env.SEED_MEMBER_EMAIL ?? process.env.SEED_MEMBER_PHONE;
const memberPassword = process.env.SEED_MEMBER_PASSWORD;
const adminIdentity = process.env.SEED_ADMIN_USERNAME ?? process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

async function login(page: Page, baseUrl: string, identity: string, password: string) {
  await page.goto(new URL('/login', baseUrl).toString(), { waitUntil: 'networkidle' });
  const passwordInput = page.locator('input[type="password"]').first();
  const identityInput = page.locator('input:not([type="password"]):not([type="hidden"]):not([type="checkbox"]):not([type="submit"])').first();
  await expect(identityInput).toBeVisible();
  await identityInput.fill(identity);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState('networkidle');
  await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
}

test.describe('seeded authenticated visual artifacts', () => {
  test('member authenticated home', async ({ page }, testInfo) => {
    test.skip(!memberUrl || !memberIdentity || !memberPassword, 'seeded member credentials are required');
    await login(page, memberUrl!, memberIdentity!, memberPassword!);
    await expect(page.locator('body')).toHaveScreenshot(`member-home-${testInfo.project.name}.png`, { fullPage: true });
  });

  test('admin authenticated home', async ({ page }, testInfo) => {
    test.skip(!adminUrl || !adminIdentity || !adminPassword, 'seeded admin credentials are required');
    await login(page, adminUrl!, adminIdentity!, adminPassword!);
    await expect(page.locator('body')).toHaveScreenshot(`admin-home-${testInfo.project.name}.png`, { fullPage: true });
  });
});
