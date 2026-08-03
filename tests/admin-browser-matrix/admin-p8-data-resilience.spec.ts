import { expect, test, type Page, type Route } from '@playwright/test';

const SESSION_TOTAL = 137;
const RECOVERED_SESSION_TOTAL = 141;
const LONG_USER_AGENT = `Chrome/150 Admin Security Matrix ${'LONG-DEVICE-DESCRIPTION-'.repeat(36)}`;

test('/security keeps a large session dataset paginated and overflow safe', async ({ page }) => {
  const controller = await installSecurityFixture(page, createSessions(SESSION_TOTAL));

  await page.goto('/security?tab=sessions', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expectSecuritySurface(page);
  await expectVisibleText(page, LONG_USER_AGENT);
  await expect(page.getByText('1–10 จาก 137')).toBeVisible();
  await expectNoPageOverflow(page);

  const nextPage = page.getByRole('button', { name: 'หน้าถัดไป' });
  await nextPage.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('11–20 จาก 137')).toBeVisible();
  await expect(page.getByRole('button', { name: 'หน้า 2' })).toHaveAttribute('aria-current', 'page');
  await expectNoPageOverflow(page);

  const pageSize = page.getByRole('combobox', { name: 'รายการต่อหน้า' });
  await pageSize.selectOption('50');
  await expect(page.getByText('1–50 จาก 137')).toBeVisible();
  await expectNoPageOverflow(page);

  expect(controller.successfulSessionReads()).toBeGreaterThanOrEqual(1);
});

test('/security survives a network disconnect and recovers without losing the admin session', async ({ page }) => {
  const controller = await installSecurityFixture(page, createSessions(SESSION_TOTAL));

  await page.goto('/security?tab=sessions', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expectSecuritySurface(page);
  await expect(page.getByText('1–10 จาก 137')).toBeVisible();

  controller.disconnect();
  await page.getByRole('button', { name: 'รีเฟรช' }).click();

  await expect(page.getByText('โหลดข้อมูลความปลอดภัยไม่สำเร็จ กรุณาลองใหม่')).toBeVisible();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByText('1–10 จาก 137')).toBeVisible();
  expect(controller.disconnectedAttempts('/admin/auth/me')).toBeGreaterThanOrEqual(2);
  expect(controller.disconnectedAttempts('/admin/auth/sessions')).toBeGreaterThanOrEqual(2);
  expect(controller.disconnectedAttempts('/admin/access/owner-recovery-status')).toBeGreaterThanOrEqual(2);
  await expectNoPageOverflow(page);

  controller.replaceSessions(createSessions(RECOVERED_SESSION_TOTAL));
  controller.reconnect();
  await page.getByRole('button', { name: 'รีเฟรช' }).click();

  await expect(page.getByText('โหลดข้อมูลความปลอดภัยไม่สำเร็จ กรุณาลองใหม่')).toHaveCount(0);
  await expect(page.getByText('1–10 จาก 141')).toBeVisible();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expectNoPageOverflow(page);
});

type SessionFixture = {
  id: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: null;
  current: boolean;
  active: boolean;
};

async function installSecurityFixture(page: Page, initialSessions: SessionFixture[]) {
  let disconnected = false;
  let sessions = initialSessions;
  let successfulSessionReads = 0;
  const failedAttempts = new Map<string, number>();
  const disconnectablePaths = new Set([
    '/admin/auth/me',
    '/admin/auth/sessions',
    '/admin/access/owner-recovery-status',
  ]);

  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'p8-data-resilience-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
  });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');

    if (disconnected && disconnectablePaths.has(path)) {
      failedAttempts.set(path, (failedAttempts.get(path) ?? 0) + 1);
      await route.abort('internetdisconnected');
      return;
    }

    if (path === '/admin/auth/sessions') successfulSessionReads += 1;
    await fulfillJson(route, fixtureFor(path, sessions));
  });

  return {
    disconnect: () => { disconnected = true; },
    reconnect: () => { disconnected = false; },
    replaceSessions: (nextSessions: SessionFixture[]) => { sessions = nextSessions; },
    disconnectedAttempts: (path: string) => failedAttempts.get(path) ?? 0,
    successfulSessionReads: () => successfulSessionReads,
  };
}

function fixtureFor(path: string, sessions: SessionFixture[]) {
  if (path === '/admin/auth/me') {
    return {
      id: 'p8-data-admin',
      username: 'p8-data-admin',
      displayName: 'P8 Data Resilience Admin',
      roles: [{ code: 'system_admin', name: 'System Administrator' }],
      permissions: ['*'],
      twoFactorEnabled: true,
    };
  }
  if (path === '/admin/auth/sessions') return { items: sessions };
  if (path === '/admin/access/owner-recovery-status') {
    return {
      healthy: true,
      recoveryCodesRemaining: 8,
      protectedAdmins: [{
        id: 'p8-data-admin',
        username: 'p8-data-admin',
        status: 'ACTIVE',
        twoFactorEnabled: true,
        roles: ['system_admin'],
      }],
    };
  }
  if (path === '/admin/queues/summary') return { topUps: { count: 0 }, withdrawals: { count: 0 } };
  if (path.startsWith('/admin/risk-alerts')) return { items: [], total: 0, summary: { openCount: 0 } };
  if (path.startsWith('/admin/notifications')) return { items: [], unreadCount: 0 };
  if (path.startsWith('/admin/access/profile')) return { permissions: ['*'] };
  return {};
}

function createSessions(total: number): SessionFixture[] {
  const now = Date.UTC(2026, 7, 3, 12, 0, 0);
  return Array.from({ length: total }, (_, index) => ({
    id: `p8-session-${String(index + 1).padStart(4, '0')}`,
    deviceId: `device-${String(index + 1).padStart(4, '0')}`,
    ipAddress: `203.0.113.${(index % 200) + 1}`,
    userAgent: index === 0 ? LONG_USER_AGENT : `Admin Browser ${index + 1} / Responsive Dataset Fixture`,
    createdAt: new Date(now - index * 60_000).toISOString(),
    expiresAt: new Date(now + (index + 1) * 3_600_000).toISOString(),
    revokedAt: null,
    current: index === 0,
    active: true,
  }));
}

async function expectSecuritySurface(page: Page) {
  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ความปลอดภัยผู้ดูแล' }).first()).toBeVisible();
  await expect(page.locator('a[href="/security?tab=sessions"]')).toHaveAttribute('aria-current', 'page');

  const table = page.getByRole('table', { name: 'เซสชันผู้ดูแล' });
  const list = page.getByRole('list', { name: 'เซสชันผู้ดูแล' });
  await expect.poll(async () => (await table.isVisible()) || (await list.isVisible())).toBe(true);
}

async function expectVisibleText(page: Page, text: string) {
  await expect.poll(() => page.getByText(text, { exact: true }).evaluateAll((elements) => elements.some((element) => {
    const node = element as HTMLElement;
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0;
  }))).toBe(true);
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
