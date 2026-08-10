import { expect, test, type Page, type Route } from '@playwright/test';

test('Light and Dark appearance choices change real Admin surface colors', async ({ page }) => {
  await installOwnerSession(page);
  await page.goto('/settings/theme', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expect(page.locator('.admin-shell')).toBeVisible();
  await expect(page.getByRole('button', { name: 'ตั้งค่าหน้าตา' })).toBeVisible();

  await chooseTheme(page, 'มืด', 'dark');
  const dark = await readSurfaceColors(page);

  await chooseTheme(page, 'สว่าง', 'light');
  const light = await readSurfaceColors(page);

  expect(light.canvas, 'canonical canvas token must change between Dark and Light').not.toBe(dark.canvas);
  expect(light.body, 'body computed background must change between Dark and Light').not.toBe(dark.body);

  const changedSurfaces = [
    [dark.sidebar, light.sidebar],
    [dark.input, light.input],
    [dark.panel, light.panel],
  ].filter(([before, after]) => before && after && before !== after);
  expect(changedSurfaces.length, 'at least two real Admin surfaces must follow the theme owner').toBeGreaterThanOrEqual(2);

  await chooseTheme(page, 'มืด', 'dark');
  const restored = await readSurfaceColors(page);
  expect(restored.canvas).toBe(dark.canvas);
  expect(restored.body).toBe(dark.body);
});

async function chooseTheme(page: Page, label: 'สว่าง' | 'มืด', expected: 'light' | 'dark') {
  const trigger = page.getByRole('button', { name: 'ตั้งค่าหน้าตา' });
  const dialog = page.getByRole('dialog', { name: 'หน้าตาและการแสดงผล' });
  if (!(await dialog.isVisible().catch(() => false))) await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: label, exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-admin-theme', expected);
  await page.waitForTimeout(80);
}

async function readSurfaceColors(page: Page) {
  return page.evaluate(() => {
    const color = (selector: string, property: 'backgroundColor' | 'borderTopColor' = 'backgroundColor') => {
      const element = document.querySelector<HTMLElement>(selector);
      return element ? getComputedStyle(element)[property] : '';
    };
    const root = getComputedStyle(document.documentElement);
    return {
      canvas: root.getPropertyValue('--color-canvas').trim(),
      body: getComputedStyle(document.body).backgroundColor,
      sidebar: color('#admin-sidebar'),
      input: color('input:not([type="checkbox"]):not([type="radio"])'),
      panel: color('.admin-ui-card, .admin-content-shell article, .admin-content-shell section'),
    };
  });
}

async function installOwnerSession(page: Page) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'appearance-owner-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
    window.localStorage.setItem('admin_appearance_preferences_v1', JSON.stringify({
      theme: 'dark', density: 'comfortable', contrast: 'normal', motion: 'system',
    }));
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
      id: 'appearance-owner',
      username: 'appearance_owner',
      displayName: 'Appearance Owner',
      roles: [{ code: 'owner', name: 'Owner' }],
      permissions: ['*'],
    };
  }
  if (path.startsWith('/admin/settings/theme')) return { revision: 1, data: {} };
  if (path.startsWith('/admin/queues/summary')) return { topUps: { count: 0 }, withdrawals: { count: 0 } };
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
