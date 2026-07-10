import { expect, test } from '@playwright/test';

const memberUrl = process.env.MEMBER_WEB_URL || process.env.PLAYWRIGHT_MEMBER_URL || 'http://localhost:3000';

const publicPages = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'maintenance', path: '/maintenance' },
  { name: 'session-expired', path: '/session-expired' },
  { name: 'legal', path: '/legal' },
  { name: 'contact', path: '/contact' },
];

for (const pageDef of publicPages) {
  test(`${pageDef.name} visual baseline`, async ({ page }, testInfo) => {
    const response = await page.goto(`${memberUrl}${pageDef.path}`, { waitUntil: 'networkidle' });
    expect(response?.status(), pageDef.name).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${pageDef.name}-${testInfo.project.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  });
}
