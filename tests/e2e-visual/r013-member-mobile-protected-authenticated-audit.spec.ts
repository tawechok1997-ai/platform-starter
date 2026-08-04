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

test.describe('Member mobile protected authenticated audit v2', () => {
  test('mock-authenticated protected routes do not loop to login and stay in viewport', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Protected route matrix runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-protected-routes-v2');
    await installReadOnlyMemberSession(context);
    const results: Array<Record<string, unknown>> = [];

    for (const routePath of PROTECTED_ROUTES) {
      const page = await context.newPage();
      const runtime = captureRuntime(page);
      try {
        const response = await page.goto(new URL(routePath, BASE_URL).toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        }).catch(() => null);
        await page.waitForTimeout(900);
        const finalUrl = new URL(page.url());
        const bodyText = await page.locator('body').innerText().catch(() => '');
        const metrics = await readMetrics(page);
        const loginLoop = finalUrl.pathname === '/session-expired'
          || finalUrl.pathname === '/login'
          || (finalUrl.pathname === '/' && finalUrl.searchParams.get('auth') === 'login');
        const notFound = response?.status() === 404 || /404|not found|ไม่พบหน้านี้/i.test(bodyText.slice(0, 1200));
        const result = {
          route: routePath,
          status: response?.status() ?? null,
          finalUrl: page.url(),
          loginLoop,
          notFound,
          metrics,
          runtime: runtime.snapshot(),
        };
        results.push(result);

        const routeDir = path.join(evidenceDir, sanitizeRoutePath(routePath));
        await fs.mkdir(routeDir, { recursive: true });
        await page.screenshot({ path: path.join(routeDir, 'viewport.png'), fullPage: false, animations: 'disabled' });
        await fs.writeFile(path.join(routeDir, 'audit.json'), JSON.stringify(result, null, 2));
      } finally {
        await page.close();
      }
    }

    await fs.writeFile(path.join(evidenceDir, 'authenticated-protected-routes-v2.json'), JSON.stringify(results, null, 2));
    console.log(`MEMBER_MOBILE_PROTECTED_AUTHENTICATED_V2 ${JSON.stringify({
      routes: results.length,
      loginLoops: results.filter((result) => result.loginLoop === true).map((result) => result.route),
      notFound: results.filter((result) => result.notFound === true).map((result) => result.route),
      overflow: results.filter((result) => (result.metrics as { horizontalOverflow?: boolean }).horizontalOverflow).map((result) => result.route),
      pageErrors: results.filter((result) => ((result.runtime as { pageErrors: string[] }).pageErrors).length > 0).map((result) => result.route),
      consoleErrors: results.filter((result) => ((result.runtime as { consoleErrors: string[] }).consoleErrors).length > 0).map((result) => result.route),
    })}`);
  });
});

async function installReadOnlyMemberSession(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('member_access_token', 'protected-audit-access');
    localStorage.setItem('member_refresh_token', 'protected-audit-refresh');
  });

  await context.route('**/member/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/member/auth/refresh') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'protected-audit-access-refreshed',
          refreshToken: 'protected-audit-refresh-refreshed',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      });
      return;
    }
    await fulfillReadOnly(route, {
      items: [],
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      balance: '0.00',
      pendingCount: 0,
      methods: [],
    });
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
}

async function fulfillReadOnly(route: Route, getPayload: Record<string, unknown>) {
  const method = route.request().method();
  await route.fulfill({
    status: method === 'GET' ? 200 : 422,
    contentType: 'application/json',
    body: JSON.stringify(method === 'GET' ? getPayload : { message: 'Blocked by read-only mobile audit' }),
  });
}

async function readMetrics(page: Page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentClientWidth: html?.clientWidth ?? null,
      documentScrollWidth: html?.scrollWidth ?? null,
      bodyClientWidth: body?.clientWidth ?? null,
      bodyScrollWidth: body?.scrollWidth ?? null,
      horizontalOverflow: Boolean(
        html && html.scrollWidth > html.clientWidth + 1
        || body && body.scrollWidth > body.clientWidth + 1
      ),
      bodyOverflow: body ? getComputedStyle(body).overflow : '',
      htmlOverflow: html ? getComputedStyle(html).overflow : '',
      viewportMode: html?.dataset.memberViewportMode ?? '',
      memberNav: html?.dataset.mobileMemberNav ?? '',
      pathname: location.pathname,
    };
  });
}

function captureRuntime(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: Array<Record<string, unknown>> = [];
  const badResponses: Array<Record<string, unknown>> = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon|ERR_BLOCKED_BY_CLIENT/i.test(message.text())) consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({
    method: request.method(),
    url: sanitizeUrl(request.url()),
    error: request.failure()?.errorText ?? 'unknown',
  }));
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push({ status: response.status(), url: sanitizeUrl(response.url()) });
  });
  return { snapshot: () => ({ consoleErrors, pageErrors, failedRequests, badResponses }) };
}

async function prepareEvidenceDirectory(testInfo: TestInfo, section: string) {
  const directory = path.resolve('artifacts/member-mobile-audit', testInfo.project.name, section);
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

function sanitizeRoutePath(routePath: string) {
  return routePath.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'root';
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}
