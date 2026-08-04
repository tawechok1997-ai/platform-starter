import { test, type BrowserContext, type Page, type Route, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.MEMBER_HOME_URL
  ?? 'https://platformweb-member-production.up.railway.app/';

const ROUTES = [
  '/deposit', '/withdraw', '/bonus', '/affiliate', '/support', '/bank-accounts',
  '/profile', '/notifications', '/games', '/search',
] as const;

test.describe('Member mobile protected authenticated routes v3', () => {
  test('protected member pages render without login loops and expose overflow precisely', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Protected route matrix runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'protected-authenticated-routes-v3');
    await installReadOnlyApiMocks(context);
    const results: Array<Record<string, unknown>> = [];

    for (const routePath of ROUTES) {
      const page = await context.newPage();
      const runtime = captureRuntime(page);
      try {
        const response = await page.goto(new URL(routePath, BASE_URL).toString(), {
          waitUntil: 'domcontentloaded', timeout: 45_000,
        }).catch(() => null);
        await page.waitForTimeout(1_000);
        const finalUrl = new URL(page.url());
        const bodyText = await page.locator('body').innerText().catch(() => '');
        const metrics = await readMetrics(page);
        const result = {
          route: routePath,
          status: response?.status() ?? null,
          contentType: response?.headers()['content-type'] ?? null,
          finalUrl: page.url(),
          loginLoop: finalUrl.pathname === '/session-expired'
            || finalUrl.pathname === '/login'
            || (finalUrl.pathname === '/' && finalUrl.searchParams.get('auth') === 'login'),
          notFound: response?.status() === 404 || /404|not found|ไม่พบหน้านี้/i.test(bodyText.slice(0, 1200)),
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

    await fs.writeFile(path.join(evidenceDir, 'protected-authenticated-routes-v3.json'), JSON.stringify(results, null, 2));
    console.log(`MEMBER_MOBILE_PROTECTED_AUTHENTICATED_ROUTES_V3 ${JSON.stringify({
      routes: results.length,
      loginLoops: results.filter((result) => result.loginLoop === true).map((result) => result.route),
      notFound: results.filter((result) => result.notFound === true).map((result) => result.route),
      overflow: results.filter((result) => (result.metrics as { horizontalOverflow: boolean }).horizontalOverflow).map((result) => ({
        route: result.route,
        viewport: (result.metrics as { viewportWidth: number }).viewportWidth,
        bodyScrollWidth: (result.metrics as { bodyScrollWidth: number }).bodyScrollWidth,
        outsideElements: (result.metrics as { outsideElements: unknown[] }).outsideElements.length,
      })),
      pageErrors: results.filter((result) => ((result.runtime as { pageErrors: string[] }).pageErrors).length).map((result) => result.route),
      consoleErrors: results.filter((result) => ((result.runtime as { consoleErrors: string[] }).consoleErrors).length).map((result) => result.route),
    })}`);
  });
});

async function installReadOnlyApiMocks(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('member_access_token', 'protected-route-v3-access');
    localStorage.setItem('member_refresh_token', 'protected-route-v3-refresh');
  });
  await context.route('**/member/**', async (route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue();
      return;
    }
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/member/auth/refresh') {
      await fulfill(route, {
        accessToken: 'protected-route-v3-access-refreshed',
        refreshToken: 'protected-route-v3-refresh-refreshed',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      return;
    }
    await fulfillReadOnly(route, {
      items: [], data: [], total: 0, page: 1, pageSize: 20,
      balance: '0.00', pendingCount: 0, methods: [],
    });
  });
  await context.route('**/member/wallet', (route) => fulfill(route, {
    currency: 'THB', balance: '12345.67', availableBalance: '12000.00', lockedBalance: '345.67', status: 'active',
  }));
  await context.route('**/member/auth/profile', (route) => fulfill(route, {
    id: 'audit-member', username: 'NOA***999', displayName: 'สมาชิกตรวจสอบมือถือ',
    phone: '0890000000', email: 'audit@example.com', status: 'active', vipLevel: 'VIP 3',
    avatarUrl: '/images/avatar/7.webp',
  }));
}

async function fulfillReadOnly(route: Route, payload: Record<string, unknown>) {
  await route.fulfill({
    status: route.request().method() === 'GET' ? 200 : 422,
    contentType: 'application/json',
    body: JSON.stringify(route.request().method() === 'GET' ? payload : { message: 'Blocked by read-only mobile audit' }),
  });
}

async function fulfill(route: Route, payload: Record<string, unknown>) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
}

async function readMetrics(page: Page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const outsideElements = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > window.innerWidth + 1
        ? [{
          tag: element.tagName.toLowerCase(), className: String(element.className).slice(0, 160),
          left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width),
        }]
        : [];
    }).slice(0, 80);
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentClientWidth: html.clientWidth,
      documentScrollWidth: html.scrollWidth,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      horizontalOverflow: html.scrollWidth > html.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1,
      outsideElements,
      bodyOverflow: getComputedStyle(body).overflow,
      htmlOverflow: getComputedStyle(html).overflow,
      viewportMode: html.dataset.memberViewportMode ?? '',
      sessionReady: html.dataset.memberSessionReady ?? '',
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
    method: request.method(), type: request.resourceType(), url: sanitizeUrl(request.url()), error: request.failure()?.errorText ?? 'unknown',
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
