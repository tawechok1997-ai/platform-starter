import { test, expect, request } from '@playwright/test';

const adminWebUrl = process.env.ADMIN_WEB_URL;

test.describe('admin security boundaries', () => {
  test('blocks a cross-origin admin mutation', async () => {
    test.skip(!adminWebUrl, 'Set ADMIN_WEB_URL to run deployed admin security smoke tests');
    const api = await request.newContext({ baseURL: adminWebUrl });
    try {
      const response = await api.post('/api/admin/auth/refresh', {
        headers: { Origin: 'https://evil.example' },
        data: {},
      });
      expect(response.status()).toBe(403);
    } finally {
      await api.dispose();
    }
  });

  test('does not expose access token names in the login HTML', async ({ page }) => {
    test.skip(!adminWebUrl, 'Set ADMIN_WEB_URL to run deployed admin security smoke tests');
    await page.goto(`${adminWebUrl}/login`, { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    expect(html).not.toContain('admin_access_token');
  });
  test('admin login returns an HttpOnly refresh cookie when smoke credentials are configured', async () => {
    const username = process.env.ADMIN_SMOKE_USERNAME;
    const secret = process.env.ADMIN_SMOKE_SECRET;
    test.skip(!adminWebUrl || !username || !secret, 'Set ADMIN_WEB_URL, ADMIN_SMOKE_USERNAME and ADMIN_SMOKE_SECRET to run login cookie smoke test');

    const api = await request.newContext({ baseURL: adminWebUrl });
    try {
      const response = await api.post('/api/auth/login', {
        data: { username, secret, captchaToken: process.env.ADMIN_SMOKE_CAPTCHA_TOKEN, deviceId: 'playwright-security-smoke' },
      });
      expect(response.status()).toBeLessThan(500);
      const payload = await response.json().catch(() => null);
      if (response.status() === 400 && payload?.code === 'CAPTCHA_REQUIRED') return;
      if (payload?.requiresTwoFactor) {
        expect(payload.challengeId).toBeTruthy();
        return;
      }
      expect(response.ok()).toBeTruthy();
      const setCookie = response.headers()['set-cookie'] ?? '';
      expect(setCookie).toContain('platform_admin_refresh=');
      expect(setCookie.toLowerCase()).toContain('httponly');
      expect(setCookie.toLowerCase()).toContain('samesite=lax');
    } finally {
      await api.dispose();
    }
  });

  test('read-only admin does not receive mutation controls when credentials are configured', async ({ page }) => {
    const username = process.env.ADMIN_READONLY_USERNAME;
    const secret = process.env.ADMIN_READONLY_SECRET;
    test.skip(!adminWebUrl || !username || !secret, 'Set ADMIN_WEB_URL, ADMIN_READONLY_USERNAME and ADMIN_READONLY_SECRET to run read-only UI smoke test');

    const response = await page.request.post(`${adminWebUrl}/api/auth/login`, {
      data: { username, secret, captchaToken: process.env.ADMIN_READONLY_CAPTCHA_TOKEN, deviceId: 'playwright-readonly-smoke' },
    });
    expect(response.status()).toBeLessThan(500);
    const payload = await response.json().catch(() => null);
    if (response.status() === 400 && payload?.code === 'CAPTCHA_REQUIRED') return;
    if (payload?.requiresTwoFactor) return;
    expect(response.ok()).toBeTruthy();

    await page.goto(`${adminWebUrl}/access`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/access');
    await expect(page.getByText('ดูบัญชีผู้ดูแลแบบอ่านอย่างเดียว')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add role' })).toHaveCount(0);

    await page.goto(`${adminWebUrl}/admin-accounts`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/admin-accounts');
    await expect(page.getByRole('button', { name: /เปลี่ยนสถานะ|Suspend|Lock|Unlock/i })).toHaveCount(0);
  });
});
