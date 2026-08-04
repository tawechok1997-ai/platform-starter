import { expect, test, type Page, type Route } from '@playwright/test';

const LONG_ADMIN_NAME = `ผู้ดูแลระบบทดสอบชื่อยาวมาก${'ADMINPROFILE'.repeat(24)}`;
const LONG_ROLE_NAME = `ตำแหน่งผู้ดูแลระบบหลายบทบาท${'RESPONSIBILITY'.repeat(18)}`;

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

type AdminSessionFixtureOptions = {
  authMeFailures?: number;
  displayName?: string;
  roleName?: string;
};

for (const routeCase of routeCases) {
  test(`${routeCase.path} is keyboard, label, and overflow safe`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await installAdminSession(page);
    await page.goto(routeCase.path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    await assertRouteSurface(page, routeCase);

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

  test(`${routeCase.path} survives forced colors and WCAG text spacing`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await installAdminSession(page);
    await page.goto(routeCase.path, { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({
      content: `
        :where(p, li, a, button, label, input, textarea, select, h1, h2, h3, h4, h5, h6) {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }
        p { margin-bottom: 2em !important; }
      `,
    });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    await assertRouteSurface(page, routeCase);
    await page.keyboard.press('Tab');
    await expect.poll(() => page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active || active === document.body || active === document.documentElement) return false;
      const rect = active.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    })).toBe(true);
  });
}

test('/system-settings recovers from one temporary auth read failure', async ({ page }) => {
  const session = await installAdminSession(page, { authMeFailures: 1 });
  await page.goto('/system-settings', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expect(page.getByRole('heading', { name: 'การตั้งค่าระบบ' }).first()).toBeVisible();
  await expect.poll(session.firstSuccessfulAuthMeAttempt).toBe(2);
  expect(session.authMeFailuresServed()).toBe(1);
  expect(session.authMeAttempts()).toBeGreaterThanOrEqual(2);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
});

test('/system-settings contains long profile data without horizontal page overflow', async ({ page }) => {
  await installAdminSession(page, { displayName: LONG_ADMIN_NAME, roleName: LONG_ROLE_NAME });
  await page.goto('/system-settings', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  const profileTrigger = page.locator('.admin-sidebar-profile__trigger');
  await expect(profileTrigger).toContainText(LONG_ADMIN_NAME);
  await expect(profileTrigger).toContainText(LONG_ROLE_NAME);

  if (await profileTrigger.isVisible()) {
    await expect(profileTrigger).toBeVisible();
  } else {
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
  }

  await assertRouteSurface(page, routeCases[0]);
});

async function assertRouteSurface(page: Page, routeCase: typeof routeCases[number]) {
  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: routeCase.heading }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: routeCase.expectedLink }).first()).toBeVisible();
  await expect(page.getByText(/ไม่มีสิทธิ์เปิดหน้าการตั้งค่านี้/)).toHaveCount(0);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth - overflow.clientWidth).toBeLessThanOrEqual(2);
}

async function installAdminSession(page: Page, options: AdminSessionFixtureOptions = {}) {
  let authMeAttempts = 0;
  let authMeFailuresServed = 0;
  let firstSuccessfulAuthMeAttempt: number | null = null;

  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'p8-accessibility-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
  });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');
    if (path === '/admin/auth/me') {
      authMeAttempts += 1;
      if (authMeAttempts <= (options.authMeFailures ?? 0)) {
        authMeFailuresServed += 1;
        await fulfillJson(route, { message: 'temporary unavailable' }, 503);
        return;
      }
      if (firstSuccessfulAuthMeAttempt === null) firstSuccessfulAuthMeAttempt = authMeAttempts;
    }
    await fulfillJson(route, fixtureFor(path, options));
  });

  return {
    authMeAttempts: () => authMeAttempts,
    authMeFailuresServed: () => authMeFailuresServed,
    firstSuccessfulAuthMeAttempt: () => firstSuccessfulAuthMeAttempt,
  };
}

function fixtureFor(path: string, options: AdminSessionFixtureOptions = {}) {
  if (path === '/admin/auth/me') {
    return {
      id: 'p8-admin',
      username: 'p8-admin',
      displayName: options.displayName ?? 'P8 Admin',
      roles: [{ code: 'system_admin', name: options.roleName ?? 'System Administrator' }],
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
