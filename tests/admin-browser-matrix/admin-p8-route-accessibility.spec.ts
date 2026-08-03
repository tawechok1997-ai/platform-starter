import { expect, test, type Page, type Route } from '@playwright/test';

const routeCases = [
  {
    path: '/system-settings',
    heading: 'การตั้งค่าระบบ',
    expectedLink: 'การตั้งค่าเว็บไซต์',
  },
  {
    path: '/settings/activities',
    heading: 'กิจกรรม ภารกิจ และรางวัล',
    expectedLink: 'ประวัติการเปลี่ยนแปลง',
  },
] as const;

for (const routeCase of routeCases) {
  test(`${routeCase.path} is keyboard, label, and overflow safe`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await installAdminSession(page);
    await page.goto(routeCase.path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { name: routeCase.heading }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: routeCase.expectedLink }).first()).toBeVisible();
    await expect(page.getByText(/ไม่มีสิทธิ์เปิดหน้าการตั้งค่านี้/)).toHaveCount(0);

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth - overflow.clientWidth).toBeLessThanOrEqual(2);

    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => {
      const active = document.activeElement;
      return Boolean(active && active !== document.body && active !== document.documentElement);
    })).toBe(true);

    const hiddenFocus = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return true;
      const rect = active.getBoundingClientRect();
      const style = window.getComputedStyle(active);
      return style.visibility === 'hidden'
        || style.display === 'none'
        || rect.width <= 0
        || rect.height <= 0;
    });
    expect(hiddenFocus).toBe(false);

    const unlabeledControls = await page.locator('input:not([type="hidden"]), textarea, select').evaluateAll((elements) => (
      elements
        .filter((element) => {
          const control = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (control.disabled || control.getAttribute('aria-hidden') === 'true') return false;
          const labels = 'labels' in control ? control.labels : null;
          return !(labels?.length || control.getAttribute('aria-label') || control.getAttribute('aria-labelledby'));
        })
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          name: element.getAttribute('name'),
          id: element.id,
        }))
    ));
    expect(unlabeledControls).toEqual([]);
  });
}

async function installAdminSession(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'p8-accessibility-token');
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
      id: 'p8-admin',
      username: 'p8-admin',
      displayName: 'P8 Admin',
      roles: [{ code: 'system_admin', name: 'System Administrator' }],
      permissions: ['*'],
    };
  }
  if (path.startsWith('/admin/settings/features')) return {};
  if (path.startsWith('/admin/notifications')) return { items: [], unreadCount: 0 };
  if (path.startsWith('/admin/access/profile')) return { permissions: ['*'] };
  return {};
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}
