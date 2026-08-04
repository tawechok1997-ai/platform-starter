import { expect, test, type Page, type Route } from '@playwright/test';

const LONG_ADMIN_NAME = `ผู้ดูแลระบบทดสอบชื่อยาวมาก${'ADMINPROFILE'.repeat(24)}`;
const LONG_ROLE_NAME = `ตำแหน่งผู้ดูแลระบบหลายบทบาท${'RESPONSIBILITY'.repeat(18)}`;

test('/system-settings reflows at a 200 percent desktop-equivalent viewport', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('desktop'), 'Covered by the desktop browser projects at a halved CSS viewport.');

  await page.setViewportSize({ width: 720, height: 900 });
  await installAdminSession(page);
  await page.goto('/system-settings', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'การตั้งค่าระบบ' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'การตั้งค่าเว็บไซต์' }).first()).toBeVisible();
  await expectNoPageOverflow(page);

  const menuButton = page.getByRole('button', { name: 'เปิดเมนูแอดมิน' });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const drawer = page.locator('#admin-sidebar');
  await expect(drawer).toHaveClass(/\bopen\b/);
  await expect.poll(() => drawer.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0
      && rect.height > 0
      && rect.left >= -1
      && rect.right <= window.innerWidth + 1;
  })).toBe(true);
  await expectNoPageOverflow(page);

  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveClass(/\bopen\b/);
  await expect(menuButton).toBeFocused();
});

async function installAdminSession(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'p8-zoom-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
  });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');
    await fulfillJson(route, fixtureFor(path));
  });
}

function fixtureFor(path: string) {
  if (path === '/admin/auth/me') {
    return {
      id: 'p8-zoom-admin',
      username: 'p8-zoom-admin',
      displayName: LONG_ADMIN_NAME,
      roles: [{ code: 'system_admin', name: LONG_ROLE_NAME }],
      permissions: ['*'],
    };
  }
  if (path.startsWith('/admin/settings/features')) return {};
  if (path.startsWith('/admin/notifications')) return { items: [], unreadCount: 0 };
  if (path.startsWith('/admin/access/profile')) return { permissions: ['*'] };
  return {};
}

async function expectNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth - overflow.clientWidth).toBeLessThanOrEqual(2);
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}
