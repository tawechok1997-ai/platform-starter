import { expect, test, type Page, type Route } from '@playwright/test';

const ownerPermissions = ['*'];
const paymentsPermissions = ['topups.view', 'deposit.view', 'withdraw.view', 'wallet.view', 'reports.view'];
const allWorkspaces = ['finance', 'payments', 'growth', 'manager', 'system'] as const;

for (const locale of ['th', 'en'] as const) {
  test(`dashboard widget interactions persist for ${locale}`, async ({ page }, testInfo) => {
    await installDashboardSession(page, {
      locale,
      permissions: ownerPermissions,
      adminUserId: 'matrix-owner',
      workspaces: allWorkspaces,
      selectedWorkspace: 'all',
    });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

    const dashboard = page.locator('main.admin-shell');
    await expect(dashboard).toBeVisible();
    await expect(page.locator('[data-admin-widget-workspace="all"]')).toBeVisible();
    await expect(page.locator('[data-widget-id]')).toHaveCount(6);

    const rangeSelect = page.getByLabel(locale === 'th' ? 'ช่วงวันที่' : 'Date range');
    await rangeSelect.selectOption('7d');

    const cashFlow = page.locator('[data-widget-id="finance.cash-flow"]');
    await expect(cashFlow).toBeVisible();
    await expect(cashFlow.getByRole('heading', { name: locale === 'th' ? 'กระแสเงินย้อนหลัง' : 'Historical cash flow' })).toBeVisible();
    await expect(cashFlow.getByText(locale === 'th' ? 'เทียบช่วงก่อนหน้า' : 'Compared with previous period')).toBeVisible();

    const csvDownload = page.waitForEvent('download');
    await cashFlow.getByRole('button', { name: locale === 'th' ? 'ส่งออก CSV' : 'Export CSV' }).click();
    const downloadedCsv = await csvDownload;
    expect(downloadedCsv.suggestedFilename()).toMatch(/^finance-trends-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/);

    const pngDownload = page.waitForEvent('download');
    await cashFlow.getByRole('button', { name: locale === 'th' ? 'ส่งออก PNG' : 'Export PNG' }).click();
    const downloadedPng = await pngDownload;
    expect(downloadedPng.suggestedFilename()).toMatch(/^finance-trends-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.png$/);

    await cashFlow.getByRole('button', { name: locale === 'th' ? 'เต็มจอ' : 'Fullscreen' }).click();
    await expect(cashFlow).toHaveAttribute('data-fullscreen', 'true');
    await page.keyboard.press('Escape');
    await expect(cashFlow).not.toHaveAttribute('data-fullscreen', 'true');

    await page.getByRole('button', { name: locale === 'th' ? 'จัดวางวิดเจ็ต' : 'Edit layout' }).click();
    const hideButton = page.getByRole('button', { name: locale === 'th' ? 'ซ่อนวิดเจ็ต' : 'Hide widget' }).first();
    await expect(hideButton).toBeVisible();
    await hideButton.click();
    await expect(page.getByText(locale === 'th' ? 'วิดเจ็ตที่ซ่อน' : 'Hidden widgets')).toBeVisible();

    await expect.poll(() => page.evaluate(() => window.localStorage.getItem('admin_widget_layout_v1:matrix-owner')))
      .toContain('"hidden":true');

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

test('P3 workspace selection filters widgets without mutating the saved layout', async ({ page }) => {
  const session = await installDashboardSession(page, {
    locale: 'th',
    permissions: ownerPermissions,
    adminUserId: 'matrix-workspaces',
    workspaces: allWorkspaces,
    selectedWorkspace: 'all',
  });
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
  await expect(page.locator('[data-widget-id]')).toHaveCount(6);

  await selectP3Workspace(page, 'finance');
  await expect(page.locator('[data-admin-widget-workspace="finance"]')).toBeVisible();
  await expectVisibleWidgetIds(page, [
    'operations.priority-work',
    'finance.cash-flow',
    'wallet.balance-composition',
    'activity.recent',
  ]);

  await selectP3Workspace(page, 'payments');
  await expectVisibleWidgetIds(page, [
    'operations.priority-work',
    'finance.cash-flow',
    'finance.pending-queues',
    'activity.recent',
  ]);

  await selectP3Workspace(page, 'system');
  await expectVisibleWidgetIds(page, [
    'operations.priority-work',
    'risk.open-severity',
    'activity.recent',
  ]);

  expect(session.getPreferencePatchCount()).toBe(0);

  await selectP3Workspace(page, 'all');
  await expect(page.locator('[data-admin-widget-workspace="all"]')).toBeVisible();
  await expect(page.locator('[data-widget-id="finance.cash-flow"]')).toBeVisible();
  await expect(page.locator('[data-widget-id="finance.pending-queues"]')).toBeVisible();
  await expect(page.locator('[data-widget-id="risk.open-severity"]')).toBeVisible();
  expect(session.getPreferencePatchCount()).toBe(0);
});

test('dashboard widget data is filtered by effective permission', async ({ page }) => {
  await installDashboardSession(page, {
    locale: 'th',
    permissions: paymentsPermissions,
    adminUserId: 'matrix-payments',
    workspaces: ['payments'],
    selectedWorkspace: 'payments',
  });
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);

  await expect(page.locator('[data-admin-widget-workspace="payments"]')).toBeVisible();
  await expect(page.locator('[data-widget-id="risk.open-severity"]')).toHaveCount(0);
  await expect(page.getByText('High velocity transaction pattern')).toHaveCount(0);
  await expect(page.getByText('ความเสี่ยงวิกฤต')).toHaveCount(0);
  await expect(page.locator('[data-widget-id="finance.cash-flow"]')).toBeVisible();
  await expect(page.locator('[data-widget-id="finance.pending-queues"]')).toBeVisible();
  await expect(page.getByText('matrix_member').first()).toBeVisible();
  await expect(page.getByText('matrix_withdraw').first()).toBeVisible();
});

test('malformed historical payload is isolated to the cash-flow widget', async ({ page }) => {
  await installDashboardSession(page, {
    locale: 'th',
    permissions: ownerPermissions,
    adminUserId: 'matrix-malformed',
    workspaces: allWorkspaces,
    selectedWorkspace: 'all',
  });
  await page.route('**/api/admin/dashboard/finance-trends**', async (route) => fulfillJson(route, {}));

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main.admin-shell')).toBeVisible();
  await expect(page.locator('[data-widget-id]')).toHaveCount(6);
  const cashFlow = page.locator('[data-widget-id="finance.cash-flow"]');
  await expect(cashFlow.getByText('Finance trend response is incomplete')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'โหลดหน้านี้ไม่สำเร็จ' })).toHaveCount(0);
});

async function installDashboardSession(page: Page, options: {
  locale: 'th' | 'en';
  permissions: readonly string[];
  adminUserId: string;
  workspaces: readonly string[];
  selectedWorkspace: string;
}) {
  let savedPreferenceValue: unknown = null;
  let preferencePatchCount = 0;

  await page.addInitScript(({ selectedLocale, workspace }) => {
    window.sessionStorage.setItem('admin_access_token', 'dashboard-widget-matrix-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', selectedLocale);
    window.localStorage.setItem('admin_workspace_selection_v1', workspace);
  }, { selectedLocale: options.locale, workspace: options.selectedWorkspace });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');

    if (path.startsWith('/admin/preferences/dashboard-widget-layout-v1')) {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON() as { value?: unknown } | null;
        savedPreferenceValue = body?.value ?? null;
        preferencePatchCount += 1;
      }
      await fulfillJson(route, {
        key: 'dashboard-widget-layout-v1',
        value: savedPreferenceValue,
        version: savedPreferenceValue ? preferencePatchCount : 0,
        updatedAt: savedPreferenceValue ? new Date().toISOString() : null,
      });
      return;
    }

    await fulfillJson(route, fixtureFor(path, options));
  });

  return {
    getPreferencePatchCount: () => preferencePatchCount,
  };
}

function fixtureFor(path: string, options: {
  permissions: readonly string[];
  adminUserId: string;
  workspaces: readonly string[];
}) {
  if (path === '/admin/auth/me') {
    return {
      id: options.adminUserId,
      username: options.adminUserId,
      displayName: options.adminUserId,
      roles: options.workspaces.map((workspaceId, index) => ({
        code: `matrix-${workspaceId}`,
        name: workspaceId,
        workspaceId,
        primary: index === 0,
      })),
      workspaceAssignments: options.workspaces.map((workspaceId, index) => ({
        workspaceId,
        primary: index === 0,
        enabled: true,
      })),
      primaryWorkspaceId: options.workspaces[0],
      permissions: options.permissions,
    };
  }

  if (path.startsWith('/admin/dashboard/finance-trends')) return trendFixture();

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
  if (path.startsWith('/admin/access/profile')) return { permissions: options.permissions };
  return {};
}

function trendFixture() {
  const daily = Array.from({ length: 7 }, (_, index) => ({
    date: `2026-07-${String(21 + index).padStart(2, '0')}`,
    topUpAmount: String(3000 + (index * 400)),
    topUpCount: 2 + index,
    withdrawalAmount: String(1200 + (index * 150)),
    withdrawalCount: 1 + (index % 3),
    netFlow: String(1800 + (index * 250)),
  }));
  return {
    range: { days: 7, from: '2026-07-21T00:00:00.000Z', to: '2026-07-27T23:59:59.999Z' },
    totals: {
      topUpAmount: '29400',
      topUpCount: 35,
      withdrawalAmount: '11550',
      withdrawalCount: 13,
      netFlow: '17850',
    },
    daily,
    generatedAt: '2026-07-27T23:59:59.999Z',
  };
}

async function selectP3Workspace(page: Page, selection: string) {
  await page.evaluate((workspace) => {
    document.documentElement.dataset.adminWorkspace = workspace;
    window.dispatchEvent(new CustomEvent('admin:workspace-change', { detail: { selection: workspace } }));
  }, selection);
}

async function expectVisibleWidgetIds(page: Page, expectedIds: readonly string[]) {
  await expect.poll(async () => page.locator('[data-widget-id]').evaluateAll((nodes) => nodes
    .map((node) => node.getAttribute('data-widget-id'))
    .filter((value): value is string => Boolean(value))))
    .toEqual(expectedIds);
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}
