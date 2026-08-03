import { expect, test, type Page, type Route } from '@playwright/test';

const permissions = ['*'];

for (const locale of ['th', 'en'] as const) {
  test(`dashboard widget interactions persist for ${locale}`, async ({ page }, testInfo) => {
    await installDashboardSession(page, locale);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    const dashboard = page.locator('main');
    await expect(dashboard).toBeVisible();
    await expect(page.locator('[data-widget-id]')).toHaveCount(6);

    const rangeSelect = page.getByLabel(locale === 'th' ? 'ช่วงวันที่' : 'Date range');
    await rangeSelect.selectOption('7d');
    await expect(page.getByText(locale === 'th'
      ? /API ปัจจุบันส่งข้อมูล Snapshot ล่าสุด/
      : /current API returns the latest snapshot/).first()).toBeVisible();

    const cashFlow = page.locator('[data-widget-id="finance.cash-flow"]');
    await expect(cashFlow).toBeVisible();

    const csvDownload = page.waitForEvent('download');
    await cashFlow.getByRole('button', { name: locale === 'th' ? 'ส่งออก CSV' : 'Export CSV' }).click();
    const downloadedCsv = await csvDownload;
    expect(downloadedCsv.suggestedFilename()).toBe('finance.cash-flow.csv');

    await cashFlow.getByRole('button', { name: locale === 'th' ? 'เต็มหน้าจอ' : 'Fullscreen' }).click();
    await expect(cashFlow).toHaveAttribute('data-fullscreen', 'true');
    await page.keyboard.press('Escape');
    await expect(cashFlow).not.toHaveAttribute('data-fullscreen', 'true');

    await page.getByRole('button', { name: locale === 'th' ? 'จัดวางวิดเจ็ต' : 'Edit layout' }).click();
    const hideButton = page.getByRole('button', { name: locale === 'th' ? 'ซ่อนวิดเจ็ต' : 'Hide widget' }).first();
    await expect(hideButton).toBeVisible();
    await hideButton.click();
    await expect(page.getByText(locale === 'th' ? 'วิดเจ็ตที่ซ่อน' : 'Hidden widgets')).toBeVisible();

    const savedLayout = await page.evaluate(() => window.localStorage.getItem('admin_widget_layout_v1:matrix-owner'));
    expect(savedLayout).toContain('"hidden":true');

    await page.getByRole('button', { name: locale === 'th' ? 'คืนค่าเริ่มต้น' : 'Restore default' }).click();
    await expect(page.locator('[data-widget-id]')).toHaveCount(6);
    await page.getByRole('button', { name: locale === 'th' ? 'เสร็จสิ้น' : 'Finish editing' }).click();

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth - layout.clientWidth).toBeLessThanOrEqual(2);

    await page.screenshot({
      path: testInfo.outputPath(`dashboard-widget-system-${locale}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  });
}

async function installDashboardSession(page: Page, locale: 'th' | 'en') {
  await page.addInitScript(({ selectedLocale }) => {
    window.sessionStorage.setItem('admin_access_token', 'dashboard-widget-matrix-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', selectedLocale);
  }, { selectedLocale: locale });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');
    await fulfillJson(route, fixtureFor(path));
  });
}

function fixtureFor(path: string) {
  if (path === '/admin/auth/me') {
    return {
      id: 'matrix-owner',
      username: 'matrix_owner',
      displayName: 'Matrix Owner',
      roles: [{ code: 'owner', name: 'Owner' }],
      permissions,
    };
  }

  if (path.startsWith('/admin/finance/summary')) {
    return {
      totals: {
        walletCount: 42,
        totalBalance: '125000',
        totalLockedBalance: '3500',
        totalAvailableBalance: '121000',
        pendingTopUps: 2,
        pendingWithdrawals: 1,
      },
      today: {
        date: new Date().toISOString().slice(0, 10),
        topUpAmount: '25000',
        topUpCount: 12,
        withdrawalAmount: '9800',
        withdrawalCount: 7,
        netFlow: '15200',
      },
      queues: {
        topUps: [{
          id: 'topup-widget-1',
          shortUserId: 'member-1',
          amount: '2500',
          currency: 'THB',
          status: 'PENDING_SLIP_REVIEW',
          method: 'BANK',
          createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
          user: { username: 'matrix_member', shortId: 'member-1' },
        }],
        withdrawals: [{
          id: 'withdraw-widget-1',
          shortUserId: 'member-2',
          amount: '1200',
          currency: 'THB',
          status: 'PENDING',
          method: 'BANK',
          createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
          user: { username: 'matrix_withdraw', shortId: 'member-2' },
        }],
      },
      recentLedgers: [{
        id: 'ledger-widget-1',
        type: 'TOPUP',
        direction: 'CREDIT',
        amount: '2500',
        createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
        user: { username: 'matrix_member', shortId: 'member-1' },
      }],
      generatedAt: new Date().toISOString(),
    };
  }

  if (path.startsWith('/admin/risk-alerts')) {
    return {
      items: [{
        id: 'risk-widget-1',
        type: 'VELOCITY',
        severity: 'CRITICAL',
        status: 'OPEN',
        title: 'High velocity transaction pattern',
        memberId: 'member-1',
        createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      }],
      total: 1,
      page: 1,
      pageCount: 1,
      summary: { openCount: 1, criticalCount: 1 },
    };
  }

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
