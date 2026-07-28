import { expect, test, type Page, type Route, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const roles = {
  owner: ['*'],
  finance: ['topups.view', 'deposit.view', 'withdraw.view', 'wallet.view', 'reports.view', 'reports.export'],
  risk: ['risk.view'],
  support: ['users.view', 'support.view', 'support.reply'],
  readonly: ['admin.access.view'],
} as const;

type RoleName = keyof typeof roles;
type RouteCase = { path: string; label: string; anyOf?: readonly string[]; ownerOnly?: boolean };

const routeCases: readonly RouteCase[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/operations', label: 'Operations' },
  { path: '/topups', label: 'Top-ups', anyOf: ['topups.view', 'deposit.view'] },
  { path: '/withdrawals', label: 'Withdrawals', anyOf: ['withdraw.view'] },
  { path: '/risk-alerts', label: 'Risk alerts', anyOf: ['risk.view'] },
  { path: '/support-center', label: 'Support', anyOf: ['users.view'] },
  { path: '/audit', label: 'Audit', anyOf: ['admin.view', 'admin.access.view'] },
  { path: '/admin-invitations', label: 'Admin invitations', anyOf: ['admin.create'] },
  { path: '/webhook-logs', label: 'Webhook logs', anyOf: ['game.providers.view'] },
  { path: '/wallet-ledgers', label: 'Wallet ledgers', ownerOnly: true },
  { path: '/game-transfers', label: 'Game transfers', ownerOnly: true },
  { path: '/reconciliation-center', label: 'Reconciliation', ownerOnly: true },
  { path: '/simple-game-settings', label: 'Provider quick setup', ownerOnly: true },
  { path: '/members', label: 'Members', ownerOnly: true },
  { path: '/reports', label: 'Reports', ownerOnly: true },
  { path: '/settings', label: 'Settings workspace', ownerOnly: true },
  { path: '/settings/website', label: 'Website settings', ownerOnly: true },
  { path: '/settings/branding', label: 'Branding settings', ownerOnly: true },
  { path: '/settings/icons', label: 'Icon settings', ownerOnly: true },
  { path: '/settings/theme', label: 'Theme settings', ownerOnly: true },
  { path: '/settings/seo', label: 'SEO settings', ownerOnly: true },
  { path: '/settings/contact', label: 'Contact settings', ownerOnly: true },
  { path: '/settings/maintenance', label: 'Maintenance settings', ownerOnly: true },
  { path: '/settings/scripts', label: 'Script settings', ownerOnly: true },
  { path: '/settings/features', label: 'Feature settings', ownerOnly: true },
  { path: '/settings/legal', label: 'Legal settings', ownerOnly: true },
] as const;

type RuntimeIssue = { route: string; kind: 'console' | 'page' | 'request' | 'response'; detail: string };
type MatrixResult = {
  role: RoleName;
  route: string;
  label: string;
  expected: 'allowed' | 'denied';
  rendered: 'allowed' | 'denied';
  viewport: { width: number; height: number } | null;
  horizontalOverflow: number;
};

for (const roleName of Object.keys(roles) as RoleName[]) {
  test(`${roleName} route permission and responsive matrix`, async ({ page }, testInfo) => {
    const permissions = [...roles[roleName]];
    const issues: RuntimeIssue[] = [];
    const results: MatrixResult[] = [];

    installRuntimeAudit(page, issues);
    await installMockAdminSession(page, roleName, permissions);

    for (const routeCase of routeCases) {
      if (routeCase.ownerOnly && roleName !== 'owner') continue;
      await page.goto(routeCase.path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
      const issueStart = issues.length;

      await expect(page.locator('.admin-shell')).toBeVisible();
      await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);

      const expectedAllowed = canAccess(permissions, routeCase.anyOf ?? []);
      const denied = page.locator('.admin-access-denied');
      if (expectedAllowed) await expect(denied).toHaveCount(0);
      else await expect(denied).toBeVisible();

      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      const overflow = layout.scrollWidth - layout.clientWidth;
      expect(overflow, `${roleName} ${routeCase.path} must not overflow horizontally`).toBeLessThanOrEqual(2);

      await page.waitForTimeout(100);
      const routeIssues = issues.slice(issueStart);
      expect(routeIssues, `${roleName} ${routeCase.path} must not raise runtime or critical network errors`).toEqual([]);

      results.push({
        role: roleName,
        route: routeCase.path,
        label: routeCase.label,
        expected: expectedAllowed ? 'allowed' : 'denied',
        rendered: (await denied.count()) > 0 ? 'denied' : 'allowed',
        viewport: page.viewportSize(),
        horizontalOverflow: overflow,
      });

      if (roleName === 'owner' && expectedAllowed) {
        await page.screenshot({ path: testInfo.outputPath(`${slug(routeCase.path)}.png`), fullPage: true, animations: 'disabled' });
      }

      if (routeCase.path === '/dashboard' && (page.viewportSize()?.width ?? 1_000) <= 834) {
        const menuButton = page.getByRole('button', { name: /เปิดเมนูแอดมิน|Open admin menu/i });
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        await expect(page.locator('#admin-sidebar')).toHaveClass(/open/);
        await page.keyboard.press('Escape');
        await expect(page.locator('#admin-sidebar')).not.toHaveClass(/open/);
      }
    }

    await attachMatrix(testInfo, roleName, results, issues);
  });
}

async function installMockAdminSession(page: Page, roleName: RoleName, permissions: readonly string[]) {
  await page.addInitScript(() => {
    window.sessionStorage.setItem('admin_access_token', 'browser-matrix-token');
    window.localStorage.setItem('admin_session_hint', '1');
    window.localStorage.setItem('admin_locale', 'th');
  });

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^\/api\/admin/, '/admin');
    await fulfillJson(route, fixtureFor(path, roleName, permissions));
  });
}

function fixtureFor(path: string, roleName: RoleName, permissions: readonly string[]) {
  if (path === '/admin/auth/me') {
    return { id: `matrix-${roleName}`, username: `matrix_${roleName}`, displayName: `Matrix ${roleName}`, roles: [{ code: roleName, name: roleName }], permissions };
  }
  if (path.startsWith('/admin/queues/summary')) return { topUps: { count: 4 }, withdrawals: { count: 2 } };
  if (path.startsWith('/admin/reports/queue-aging')) return { summary: { pendingTopUps: 4, pendingWithdrawals: 2, oldestAgeMinutes: 132, over15Minutes: 6, over60Minutes: 1, over24Hours: 0 }, oldest: [{ id: 'topup-1', type: 'TOPUP', userId: 'member-1', username: 'matrix_member', amount: '2500', currency: 'THB', createdAt: new Date(Date.now() - 48 * 60_000).toISOString(), ageMinutes: 48, ageLabel: '48 นาที' }, { id: 'withdrawal-1', type: 'WITHDRAWAL', userId: 'member-2', username: 'matrix_owner', amount: '1200', currency: 'THB', createdAt: new Date(Date.now() - 132 * 60_000).toISOString(), ageMinutes: 132, ageLabel: '2 ชม. 12 นาที' }], generatedAt: new Date().toISOString() };
  if (path.startsWith('/admin/money-ops/control-center')) return { summary: { failedTransfers: 2, openRiskAlerts: 1, mismatchSnapshots: 1, webhookFailed: 3 }, recent: {}, realLedgerMutationEnabled: true };
  if (path.startsWith('/admin/reports/daily')) return { range: { from: '2026-07-20', to: '2026-07-27' }, topUps: [{ status: 'COMPLETED', count: 12, amount: '25000' }], withdrawals: [{ status: 'COMPLETED', count: 7, amount: '9800' }], adjustments: [], wallets: { count: 42, totalBalance: '125000', totalLockedBalance: '3500' }, ledgers: { count: 58, amount: '34800' }, pendingQueues: { topUps: { count: 4, amount: '5600' }, withdrawals: { count: 2, amount: '3200' } }, generatedAt: new Date().toISOString() };
  if (path.startsWith('/admin/reports/reconciliation')) return { checkedCount: 42, mismatchCount: 1, items: [{ walletId: 'wallet-1', shortUserId: 'member-1', username: 'matrix_member', actualBalance: '1250', latestLedgerBalance: '1200', lockedBalance: '0', availableBalance: '1250', status: 'MISMATCH' }], generatedAt: new Date().toISOString() };
  if (path.startsWith('/admin/reports/trends')) return { range: { days: 7, from: '2026-07-21', to: '2026-07-27' }, totals: { topUpAmount: '25000', topUpCount: 12, withdrawalAmount: '9800', withdrawalCount: 7, netFlow: '15200' }, daily: [{ date: '2026-07-27', topUpAmount: '5000', topUpCount: 3, withdrawalAmount: '1800', withdrawalCount: 1, netFlow: '3200' }], generatedAt: new Date().toISOString() };
  if (path.startsWith('/admin/finance/summary')) {
    return {
      totals: { walletCount: 0, totalBalance: '0', totalLockedBalance: '0', totalAvailableBalance: '0', pendingTopUps: 0, pendingWithdrawals: 0 },
      today: { date: '2026-07-24', topUpAmount: '0', topUpCount: 0, withdrawalAmount: '0', withdrawalCount: 0, netFlow: '0' },
      queues: { topUps: [], withdrawals: [] }, recentLedgers: [], generatedAt: new Date().toISOString(),
    };
  }
  if (path.startsWith('/admin/risk-alerts')) return { items: [], total: 0, page: 1, pageCount: 1, summary: { openCount: 0, criticalCount: 0 } };
  if (path.startsWith('/admin/topups') || path.startsWith('/admin/withdrawals')) return { items: [], total: 0, page: 1, pageCount: 1 };
  if (path.startsWith('/admin/support')) return { items: [], total: 0, page: 1, pageCount: 1, summary: {} };
  if (path.startsWith('/admin/audit-logs')) return { items: [], total: 0, page: 1, pageCount: 1 };
  if (path === '/admin/access/invitations/roles') return { items: [] };
  if (path.startsWith('/admin/access/invitations')) return { items: [] };
  if (path.startsWith('/admin/webhook-logs')) return { items: [], summary: { total: 0, processed: 0, failed: 0, duplicate: 0 } };
  if (path.startsWith('/admin/settings/')) return { settings: {} };
  return { items: [], total: 0, page: 1, pageCount: 1, summary: {}, roles: [], permissions: [], adminUsers: [] };
}

async function fulfillJson(route: Route, payload: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: JSON.stringify(payload) });
}

function installRuntimeAudit(page: Page, issues: RuntimeIssue[]) {
  page.on('console', (message) => { if (message.type() === 'error') issues.push({ route: page.url(), kind: 'console', detail: message.text() }); });
  page.on('pageerror', (error) => issues.push({ route: page.url(), kind: 'page', detail: error.message }));
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_ABORTED') return;
    if (!['document', 'script', 'stylesheet', 'font', 'image'].includes(request.resourceType())) return;
    issues.push({ route: page.url(), kind: 'request', detail: `${request.resourceType()} ${request.url()} ${request.failure()?.errorText ?? ''}` });
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    const resourceType = response.request().resourceType();
    if (response.status() < 500 && !['document', 'script', 'stylesheet', 'font', 'image'].includes(resourceType)) return;
    issues.push({ route: page.url(), kind: 'response', detail: `${response.status()} ${resourceType} ${response.url()}` });
  });
}

function canAccess(permissions: readonly string[], required: readonly string[]) {
  if (required.length === 0 || permissions.includes('*')) return true;
  return required.some((permission) => permissions.includes(permission));
}

async function attachMatrix(testInfo: TestInfo, roleName: RoleName, results: MatrixResult[], issues: RuntimeIssue[]) {
  const payload = `${JSON.stringify({ role: roleName, project: testInfo.project.name, results, issues }, null, 2)}\n`;
  const outputPath = testInfo.outputPath(`${roleName}-matrix.json`);
  await writeFile(outputPath, payload, 'utf8');
  await testInfo.attach(`${roleName}-matrix`, { body: Buffer.from(payload), contentType: 'application/json' });
}

function slug(path: string) {
  return path === '/' ? 'root' : path.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-');
}
