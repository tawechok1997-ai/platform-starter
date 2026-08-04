import { test, type BrowserContext, type Page, type Route, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.MEMBER_HOME_URL
  ?? 'https://platformweb-member-production.up.railway.app/';

const PROTECTED_ROUTES = [
  '/mobile/member/commission',
  '/mobile/member/affiliate',
  '/mobile/member/bonus',
  '/mobile/member/history',
  '/mobile/member/notifications',
  '/profile/avatar',
  '/deposit',
  '/withdraw',
  '/bonus',
  '/affiliate',
  '/support',
  '/bank-accounts',
  '/profile',
  '/notifications',
  '/games',
  '/search',
] as const;

test.describe('Member mobile protected route audit', () => {
  test('guest cannot read protected mobile surfaces', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Protected route matrix runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'guest-protected-routes');
    const results: Array<Record<string, unknown>> = [];

    for (const routePath of PROTECTED_ROUTES) {
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && !/favicon|ERR_BLOCKED_BY_CLIENT/i.test(message.text())) {
          consoleErrors.push(message.text());
        }
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));

      try {
        const response = await page.goto(new URL(routePath, BASE_URL).toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        }).catch(() => null);
        await page.waitForTimeout(900);
        const finalUrl = new URL(page.url());
        const authPrompt = await detectAuthPrompt(page);
        const metrics = await readMetrics(page);
        const blocked = authPrompt.visible
          || finalUrl.pathname === '/login'
          || (finalUrl.pathname === '/' && finalUrl.searchParams.get('auth') === 'login');
        const leakedStandaloneContent = finalUrl.pathname === routePath
          && !blocked
          && (await page.locator('main[data-mobile-member-page], [data-mobile-member-page]').count()) > 0;

        const result = {
          route: routePath,
          status: response?.status() ?? null,
          finalUrl: page.url(),
          blocked,
          leakedStandaloneContent,
          authPrompt,
          metrics,
          consoleErrors,
          pageErrors,
        };
        results.push(result);
        if (!blocked || leakedStandaloneContent || pageErrors.length || metrics.horizontalOverflow) {
          const routeDir = path.join(evidenceDir, sanitizeRoutePath(routePath));
          await fs.mkdir(routeDir, { recursive: true });
          await page.screenshot({ path: path.join(routeDir, 'failure.png'), fullPage: false, animations: 'disabled' });
          await fs.writeFile(path.join(routeDir, 'result.json'), JSON.stringify(result, null, 2));
        }
      } finally {
        await page.close();
      }
    }

    await fs.writeFile(path.join(evidenceDir, 'guest-protected-routes.json'), JSON.stringify(results, null, 2));
    console.log(`MEMBER_MOBILE_PROTECTED_GUEST_AUDIT ${JSON.stringify({
      routes: results.length,
      unblocked: results.filter((result) => result.blocked === false).map((result) => result.route),
      leakedStandaloneContent: results.filter((result) => result.leakedStandaloneContent === true).map((result) => result.route),
      overflow: results.filter((result) => (result.metrics as { horizontalOverflow?: boolean }).horizontalOverflow).map((result) => result.route),
      pageErrors: results.filter((result) => (result.pageErrors as string[]).length).map((result) => result.route),
    })}`);
  });

  test('mock-authenticated protected routes render without login loops or viewport overflow', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Protected route matrix runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-protected-routes');
    await installMockMemberSession(context);
    const results: Array<Record<string, unknown>> = [];

    for (const routePath of PROTECTED_ROUTES) {
      const page = await context.newPage();
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error' && !/favicon|ERR_BLOCKED_BY_CLIENT|Failed to fetch/i.test(message.text())) {
          consoleErrors.push(message.text());
        }
      });

      try {
        const response = await page.goto(new URL(routePath, BASE_URL).toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        }).catch(() => null);
        await page.waitForTimeout(900);
        const finalUrl = new URL(page.url());
        const authPrompt = await detectAuthPrompt(page);
        const metrics = await readMetrics(page);
        const loginLoop = authPrompt.visible
          || finalUrl.pathname === '/login'
          || (finalUrl.pathname === '/' && finalUrl.searchParams.get('auth') === 'login');
        const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 1200);
        const notFound = response?.status() === 404 || /404|not found|ไม่พบหน้านี้/i.test(bodyText);

        const result = {
          route: routePath,
          status: response?.status() ?? null,
          finalUrl: page.url(),
          loginLoop,
          notFound,
          metrics,
          authPrompt,
          pageErrors,
          consoleErrors,
        };
        results.push(result);
        if (loginLoop || notFound || metrics.horizontalOverflow || pageErrors.length) {
          const routeDir = path.join(evidenceDir, sanitizeRoutePath(routePath));
          await fs.mkdir(routeDir, { recursive: true });
          await page.screenshot({ path: path.join(routeDir, 'failure.png'), fullPage: false, animations: 'disabled' });
          await fs.writeFile(path.join(routeDir, 'result.json'), JSON.stringify(result, null, 2));
        }
      } finally {
        await page.close();
      }
    }

    await fs.writeFile(path.join(evidenceDir, 'authenticated-protected-routes.json'), JSON.stringify(results, null, 2));
    console.log(`MEMBER_MOBILE_PROTECTED_AUTH_AUDIT ${JSON.stringify({
      routes: results.length,
      loginLoops: results.filter((result) => result.loginLoop === true).map((result) => result.route),
      notFound: results.filter((result) => result.notFound === true).map((result) => result.route),
      overflow: results.filter((result) => (result.metrics as { horizontalOverflow?: boolean }).horizontalOverflow).map((result) => result.route),
      pageErrors: results.filter((result) => (result.pageErrors as string[]).length).map((result) => result.route),
    })}`);
  });
});

async function detectAuthPrompt(page: Page) {
  const selectors = [
    '[role="dialog"]',
    '[data-member-auth-overlay]',
    'iframe[title*="login" i]',
    'iframe[title*="เข้าสู่ระบบ"]',
  ];
  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      if (await locator.nth(index).isVisible().catch(() => false)) {
        return { visible: true, selector };
      }
    }
  }
  return { visible: false, selector: '' };
}

async function readMetrics(page: Page) {
  return page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      || document.body.scrollWidth > document.body.clientWidth + 1,
    bodyOverflowX: getComputedStyle(document.body).overflowX,
    bodyOverflowY: getComputedStyle(document.body).overflowY,
    htmlOverflowX: getComputedStyle(document.documentElement).overflowX,
    htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
    mobileViewportMode: document.documentElement.dataset.memberViewportMode ?? '',
    mobileMemberNav: document.documentElement.dataset.mobileMemberNav ?? '',
    pageShells: document.querySelectorAll('main[data-mobile-member-page], [data-mobile-member-page]').length,
  }));
}

async function installMockMemberSession(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('member_access_token', 'protected-route-audit-access');
    localStorage.setItem('member_refresh_token', 'protected-route-audit-refresh');
  });

  await context.route('**/member/wallet', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      currency: 'THB',
      balance: '12345.67',
      availableBalance: '12000.00',
      lockedBalance: '345.67',
      status: 'active',
    }),
  }));
  await context.route('**/member/auth/profile', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: 'audit-member',
      username: 'NOA***999',
      displayName: 'สมาชิกตรวจสอบมือถือ',
      phone: '0890000000',
      email: 'audit@example.com',
      status: 'active',
      vipLevel: 'VIP 3',
      avatarUrl: '/images/avatar/7.webp',
    }),
  }));

  const emptyGet = async (route: Route) => {
    const method = route.request().method();
    await route.fulfill({
      status: method === 'GET' ? 200 : 422,
      contentType: 'application/json',
      body: JSON.stringify(method === 'GET'
        ? { items: [], data: [], total: 0, page: 1, pageSize: 20, balance: '0.00', pendingCount: 0 }
        : { message: 'Blocked by read-only mobile audit' }),
    });
  };

  await context.route('**/member/notifications**', emptyGet);
  await context.route('**/member/auth/security**', emptyGet);
  await context.route('**/member/auth/sessions**', emptyGet);
  await context.route('**/member/bank-accounts**', emptyGet);
  await context.route('**/member/bonus**', emptyGet);
  await context.route('**/member/affiliate**', emptyGet);
  await context.route('**/member/commission**', emptyGet);
  await context.route('**/member/history**', emptyGet);
  await context.route('**/member/deposit**', emptyGet);
  await context.route('**/member/withdraw**', emptyGet);
  await context.route('**/member/support**', emptyGet);
  await context.route('**/member/games**', emptyGet);
}

async function prepareEvidenceDirectory(testInfo: TestInfo, section: string) {
  const directory = path.resolve('artifacts/member-mobile-audit', testInfo.project.name, section);
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

function sanitizeRoutePath(routePath: string) {
  return routePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root';
}
