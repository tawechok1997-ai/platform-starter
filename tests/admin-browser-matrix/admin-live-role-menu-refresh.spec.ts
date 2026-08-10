import { expect, test, type Page, type Route } from '@playwright/test';

test('changing an Admin role invalidates the live sidebar permission state', async ({ page }) => {
  let roleCode = 'owner';
  let permissions = ['*'];
  let authMeReads = 0;

  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'live-role-refresh-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
  });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');
    if (path === '/admin/auth/me') authMeReads += 1;
    await fulfillJson(route, fixtureFor(path, roleCode, permissions));
  });

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => authMeReads, { timeout: 12_000 }).toBeGreaterThanOrEqual(2);
  await expect(page.locator('.admin-shell')).toBeVisible();
  await expect(page.locator('#admin-sidebar a[href="/topups"]')).toHaveCount(1);

  const readsBeforeInvalidation = authMeReads;
  roleCode = 'marketing';
  permissions = ['promotion.view', 'settings.features.view', 'settings.features.update', 'reports.view'];

  const navigation = page.waitForEvent('framenavigated', { timeout: 12_000 }).catch(() => null);
  await page.evaluate(() => window.dispatchEvent(new Event('admin:identity-invalidated')));
  await expect.poll(() => authMeReads, { timeout: 8_000 }).toBeGreaterThan(readsBeforeInvalidation);
  await navigation;
  await page.waitForLoadState('domcontentloaded');

  await expect(page.locator('.admin-shell')).toBeVisible();
  await expect(page.locator('#admin-sidebar a[href="/topups"]')).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
});

function fixtureFor(path: string, roleCode: string, permissions: readonly string[]) {
  if (path === '/admin/auth/me') {
    return {
      id: 'live-role-admin',
      username: 'live_role_admin',
      displayName: 'Live Role Admin',
      roles: [{ code: roleCode, name: roleCode }],
      permissions,
    };
  }
  if (path.startsWith('/admin/queues/summary')) return { topUps: { count: 0 }, withdrawals: { count: 0 } };
  if (path.startsWith('/admin/reports/queue-aging')) return { summary: {}, oldest: [], generatedAt: new Date().toISOString() };
  if (path.startsWith('/admin/notifications')) return { items: [], unreadCount: 0 };
  if (path.startsWith('/admin/access/profile')) return { permissions };
  if (path.startsWith('/admin/risk-alerts')) return { items: [], total: 0, summary: { openCount: 0 } };
  return {};
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}
