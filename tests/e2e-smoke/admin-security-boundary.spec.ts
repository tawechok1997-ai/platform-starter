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
});
