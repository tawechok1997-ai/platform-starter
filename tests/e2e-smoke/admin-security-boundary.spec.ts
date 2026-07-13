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
        data: { username, secret, deviceId: 'playwright-security-smoke' },
      });
      expect([200, 401, 403]).toContain(response.status());
      const payload = await response.json().catch(() => null);
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

});
