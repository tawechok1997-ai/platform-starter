import { expect, test, type Page, type Route } from '@playwright/test';

type PersonaCase = {
  name: string;
  path: string;
  permissions: readonly string[];
  allowedHeading?: string;
};

const cases: readonly PersonaCase[] = [
  {
    name: 'marketing can open activity settings',
    path: '/settings/activities',
    permissions: ['promotion.view', 'settings.features.view', 'settings.features.update', 'reports.view'],
    allowedHeading: 'กิจกรรม ภารกิจ และรางวัล',
  },
  {
    name: 'finance is denied activity settings',
    path: '/settings/activities',
    permissions: ['wallet.view', 'topups.view', 'deposit.view', 'withdraw.view', 'reports.view'],
  },
  {
    name: 'system admin can open system settings',
    path: '/system-settings',
    permissions: ['admin.access.view', 'provider.view', 'provider.update', 'game.providers.view', 'game.providers.manage', 'settings.features.view'],
    allowedHeading: 'การตั้งค่าระบบ',
  },
  {
    name: 'explicit deny removes activity settings from a system admin session',
    path: '/settings/activities',
    permissions: ['admin.access.view', 'provider.view', 'provider.update', 'game.providers.view', 'game.providers.manage'],
  },
];

for (const personaCase of cases) {
  test(personaCase.name, async ({ page }) => {
    await installPersona(page, personaCase.permissions);
    await page.goto(personaCase.path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    if (personaCase.allowedHeading) {
      await expect(page.getByRole('heading', { name: personaCase.allowedHeading }).first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'ไม่มีสิทธิ์เข้าถึงหน้านี้' })).toHaveCount(0);
      return;
    }

    await expect(page.getByRole('heading', { name: 'ไม่มีสิทธิ์เข้าถึงหน้านี้' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'กลับหน้าหลัก' })).toBeVisible();
  });
}

async function installPersona(page: Page, permissions: readonly string[]) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'p8-persona-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
  });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');
    await fulfillJson(route, fixtureFor(path, permissions));
  });
}

function fixtureFor(path: string, permissions: readonly string[]) {
  if (path === '/admin/auth/me') {
    return {
      id: 'p8-persona-admin',
      username: 'p8-persona-admin',
      displayName: 'P8 Persona Admin',
      roles: [{ code: 'p8_test', name: 'P8 Test Persona' }],
      permissions,
    };
  }
  if (path === '/admin/queues/summary') return { topUps: { count: 0 }, withdrawals: { count: 0 } };
  if (path.startsWith('/admin/risk-alerts')) return { items: [], total: 0, summary: { openCount: 0 } };
  if (path.startsWith('/admin/settings/features')) return {};
  if (path.startsWith('/admin/notifications')) return { items: [], unreadCount: 0 };
  if (path.startsWith('/admin/access/profile')) return { permissions };
  return {};
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}
