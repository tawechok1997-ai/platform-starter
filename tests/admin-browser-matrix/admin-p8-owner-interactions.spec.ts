import { expect, test, type Page, type Route } from '@playwright/test';

const INVITATION_TOTAL = 25;
const SESSION_TOTAL = 2;
const MANUAL_SECRET = 'P8-OWNER-SECRET-123456';

test('/activity-center drawer traps focus, restores the opener, and unlocks page scroll', async ({ page }) => {
  await installOwnerInteractionFixture(page);
  await page.goto('/activity-center', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expect(page.getByRole('heading', { name: 'กิจกรรมและเหตุการณ์สำคัญ' }).first()).toBeVisible();
  const opener = page.locator('.admin-activity-event__button').filter({ hasText: 'Members: UPDATE' }).first();
  await expect(opener).toBeVisible();
  await opener.focus();
  await expect(opener).toBeFocused();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Members: UPDATE' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expectBodyLocked(page);

  const close = dialog.getByRole('button', { name: 'ปิด' });
  const related = dialog.getByRole('link', { name: 'เปิดรายการที่เกี่ยวข้อง' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(related).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expectBodyUnlocked(page);
  await expectNoPageOverflow(page);
});

test('/admin-invitations paginates the shared table and restores focus after cancelling confirmation', async ({ page }) => {
  const controller = await installOwnerInteractionFixture(page);
  await page.goto('/admin-invitations', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expect(page.getByRole('heading', { name: 'คำเชิญผู้ดูแล' }).first()).toBeVisible();
  await expectTableOrList(page, 'รายการคำเชิญผู้ดูแล');
  await expect(page.getByText('1–20 จาก 25')).toBeVisible();

  const nextPage = page.getByRole('button', { name: 'หน้าถัดไป' });
  await nextPage.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('21–25 จาก 25')).toBeVisible();
  await expect(page.getByRole('button', { name: 'หน้า 2' })).toHaveAttribute('aria-current', 'page');
  await expectNoPageOverflow(page);

  const trigger = page.getByRole('button', { name: 'ออกลิงก์ใหม่' }).first();
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeEnabled();
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');

  const dialog = page.getByRole('alertdialog', { name: 'ออกลิงก์ใหม่' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expectBodyLocked(page);

  const cancel = dialog.getByRole('button', { name: 'ยกเลิก' });
  const confirm = dialog.getByRole('button', { name: 'ออกลิงก์ใหม่' });
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(cancel).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expectBodyUnlocked(page);
  expect(controller.mutationCount('/admin/access/invitations/')).toBe(0);
  await expectNoPageOverflow(page);
});

test('/security tabs preserve query state and sensitive actions remain cancel-safe and clearable', async ({ page }) => {
  const controller = await installOwnerInteractionFixture(page);
  await page.goto('/security?tab=overview&source=p8', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expect(page.getByRole('heading', { name: 'ความปลอดภัยผู้ดูแล' }).first()).toBeVisible();
  const tabs = page.getByRole('navigation', { name: 'ความปลอดภัยผู้ดูแล' });
  const sessionsTab = tabs.getByRole('link', { name: /เซสชัน/ });
  await sessionsTab.focus();
  await page.keyboard.press('Enter');

  await expect.poll(() => page.evaluate(() => ({
    tab: new URL(window.location.href).searchParams.get('tab'),
    source: new URL(window.location.href).searchParams.get('source'),
  }))).toEqual({ tab: 'sessions', source: 'p8' });
  await expect(sessionsTab).toHaveAttribute('aria-current', 'page');
  await expectTableOrList(page, 'เซสชันผู้ดูแล');
  await expect(page.getByText(`1–${SESSION_TOTAL} จาก ${SESSION_TOTAL}`)).toBeVisible();

  const logoutOthers = page.getByRole('button', { name: 'ออกจากระบบอุปกรณ์อื่น' });
  await expect(logoutOthers).toBeEnabled();
  await logoutOthers.focus();
  await logoutOthers.click();

  const confirmDialog = page.getByRole('alertdialog', { name: 'ออกจากระบบอุปกรณ์อื่น' });
  await expect(confirmDialog).toBeVisible();
  await expect(confirmDialog.getByRole('button', { name: 'ยกเลิก' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(confirmDialog).toHaveCount(0);
  await expect(logoutOthers).toBeFocused();
  expect(controller.mutationCount('/admin/auth/sessions/logout-others')).toBe(0);

  const twoFactorTab = tabs.getByRole('link', { name: '2FA' });
  await twoFactorTab.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => ({
    tab: new URL(window.location.href).searchParams.get('tab'),
    source: new URL(window.location.href).searchParams.get('source'),
  }))).toEqual({ tab: 'two-factor', source: 'p8' });
  await expect(twoFactorTab).toHaveAttribute('aria-current', 'page');

  await page.getByRole('button', { name: 'สร้าง 2FA secret' }).click();
  await expect(page.getByLabel('Manual secret')).toHaveValue(MANUAL_SECRET);
  expect(controller.mutationCount('/admin/auth/2fa/setup')).toBe(1);

  await page.getByRole('button', { name: 'ล้างจากหน้าจอ' }).first().click();
  await expect(page.getByLabel('Manual secret')).toHaveCount(0);
  await expect(page.getByText('ล้างข้อมูลตั้งค่า 2FA จากหน้าจอแล้ว')).toBeVisible();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expectNoPageOverflow(page);
});

type InvitationFixture = {
  adminUserId: string;
  email: string;
  username: string;
  accountStatus: 'LOCKED';
  invitationStatus: 'ACTIVE';
  createdAt: string;
  expiresAt: string;
  usedAt: null;
  protected: false;
  roles: Array<{ id: string; code: string; name: string; level: number }>;
};

type SessionFixture = {
  id: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: null;
  current: boolean;
  active: true;
};

async function installOwnerInteractionFixture(page: Page) {
  const mutationCalls = new Map<string, number>();
  const invitations = createInvitations(INVITATION_TOTAL);
  const sessions = createSessions();

  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'p8-owner-interaction-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
  });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');
    const method = route.request().method().toUpperCase();

    if (method !== 'GET' && method !== 'HEAD') {
      mutationCalls.set(path, (mutationCalls.get(path) ?? 0) + 1);
    }

    await fulfillJson(route, fixtureFor(path, method, invitations, sessions));
  });

  return {
    mutationCount: (prefix: string) => Array.from(mutationCalls.entries())
      .filter(([path]) => path.startsWith(prefix))
      .reduce((total, [, count]) => total + count, 0),
  };
}

function fixtureFor(path: string, method: string, invitations: InvitationFixture[], sessions: SessionFixture[]) {
  if (path === '/admin/auth/me') {
    return {
      id: 'p8-owner-admin',
      username: 'p8-owner-admin',
      displayName: 'P8 Owner Interaction Admin',
      roles: [{ code: 'system_admin', name: 'System Administrator' }],
      permissions: ['*'],
      twoFactorEnabled: true,
    };
  }
  if (path === '/admin/audit-logs') {
    return {
      items: [{
        id: 'audit-owner-1',
        action: 'UPDATE',
        module: 'Members',
        targetId: 'member-owner-1',
        createdAt: '2026-08-03T12:00:00.000Z',
        adminUser: { username: 'p8-owner-admin' },
      }],
      total: 1,
    };
  }
  if (path === '/admin/finance/summary') {
    return { totals: { pendingTopUps: 0, pendingWithdrawals: 0 }, recentLedgers: [] };
  }
  if (path === '/admin/risk-alerts') return { items: [], total: 0, summary: { openCount: 0 } };
  if (path === '/admin/access/invitations/roles') {
    return { items: [{ id: 'role-system', code: 'system_admin', name: 'System Administrator', level: 100, hasWildcard: true }] };
  }
  if (path === '/admin/access/invitations' && method === 'GET') return { items: invitations };
  if (path === '/admin/auth/sessions') return { items: sessions };
  if (path === '/admin/access/owner-recovery-status') {
    return {
      healthy: true,
      recoveryCodesRemaining: 8,
      protectedAdmins: [{
        id: 'p8-owner-admin',
        username: 'p8-owner-admin',
        email: 'owner@example.test',
        status: 'ACTIVE',
        twoFactorEnabled: true,
        roles: ['system_admin'],
      }],
    };
  }
  if (path === '/admin/auth/2fa/setup' && method === 'POST') {
    return {
      secret: MANUAL_SECRET,
      otpAuthUrl: `otpauth://totp/P8:p8-owner-admin?secret=${MANUAL_SECRET}&issuer=P8`,
    };
  }
  if (path === '/admin/queues/summary') return { topUps: { count: 0 }, withdrawals: { count: 0 } };
  if (path.startsWith('/admin/notifications')) return { items: [], unreadCount: 0 };
  if (path.startsWith('/admin/access/profile')) return { permissions: ['*'] };
  if (path.startsWith('/admin/settings/features')) return {};
  return {};
}

function createInvitations(total: number): InvitationFixture[] {
  return Array.from({ length: total }, (_, index) => ({
    adminUserId: `invite-${String(index + 1).padStart(3, '0')}`,
    email: `invite-${String(index + 1).padStart(3, '0')}@example.test`,
    username: `invite_admin_${String(index + 1).padStart(3, '0')}`,
    accountStatus: 'LOCKED',
    invitationStatus: 'ACTIVE',
    createdAt: new Date(Date.UTC(2026, 7, 3, 12, index, 0)).toISOString(),
    expiresAt: new Date(Date.UTC(2035, 7, 3, 12, index, 0)).toISOString(),
    usedAt: null,
    protected: false,
    roles: [{ id: 'role-system', code: 'system_admin', name: 'System Administrator', level: 100 }],
  }));
}

function createSessions(): SessionFixture[] {
  return [
    {
      id: 'session-current',
      deviceId: 'desktop-current',
      ipAddress: '203.0.113.10',
      userAgent: 'P8 Current Browser',
      createdAt: '2026-08-03T10:00:00.000Z',
      expiresAt: '2035-08-03T10:00:00.000Z',
      revokedAt: null,
      current: true,
      active: true,
    },
    {
      id: 'session-other',
      deviceId: 'mobile-other',
      ipAddress: '203.0.113.11',
      userAgent: 'P8 Other Browser',
      createdAt: '2026-08-03T11:00:00.000Z',
      expiresAt: '2035-08-03T11:00:00.000Z',
      revokedAt: null,
      current: false,
      active: true,
    },
  ];
}

async function expectTableOrList(page: Page, label: string) {
  const table = page.getByRole('table', { name: label });
  const list = page.getByRole('list', { name: label });
  await expect.poll(async () => (await table.isVisible()) || (await list.isVisible())).toBe(true);
}

async function expectBodyLocked(page: Page) {
  await expect.poll(() => page.evaluate(() => ({
    overflow: document.body.style.overflow,
    position: document.body.style.position,
  }))).toEqual({ overflow: 'hidden', position: 'fixed' });
}

async function expectBodyUnlocked(page: Page) {
  await expect.poll(() => page.evaluate(() => (
    document.body.style.overflow !== 'hidden' && document.body.style.position !== 'fixed'
  ))).toBe(true);
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
