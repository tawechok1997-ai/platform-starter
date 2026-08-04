import { expect, test, type BrowserContext, type Route } from '@playwright/test';

const BASE_URL = process.env.MEMBER_HOME_URL ?? 'http://127.0.0.1:3101/';
const P8_ROUTES = [
  ['/mobile/member/promotions', 'promotions'],
  ['/mobile/member/news', 'news'],
  ['/mobile/member/activity', 'activity'],
  ['/mobile/member/guide', 'guide'],
] as const;
const P9_ROUTES = ['/deposit', '/withdraw', '/bank-accounts', '/transactions'] as const;

test.describe('Mobile P7-P9 closure smoke', () => {
  test.skip(({ viewport }) => !viewport || viewport.width > 430, 'Mobile viewport only');

  test('P7 auth overlay closes, restores document scrolling, and clears auth query', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the interaction contract once');

    await page.goto(new URL('/?auth=login&next=%2Fdeposit', BASE_URL).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });

    const html = page.locator('html');
    const overlay = page.locator('.member-auth-overlay');
    await expect(html).toHaveAttribute('data-mobile-p7-p9-ready', 'true', { timeout: 20_000 });
    await expect(html).toHaveAttribute('data-mobile-p7-p9-phase', 'p7');
    await expect(overlay).toBeVisible({ timeout: 20_000 });
    await expect(html).toHaveAttribute('data-mobile-overlay-owner', 'auth');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden({ timeout: 10_000 });
    await page.waitForTimeout(320);

    const finalUrl = new URL(page.url());
    expect(finalUrl.searchParams.has('auth')).toBe(false);
    expect(finalUrl.searchParams.has('next')).toBe(false);
    await expect(html).toHaveAttribute('data-mobile-overlay-open', 'false');
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
    await expectHorizontalFit(page);
  });

  test('P8 content routes render their live owners without horizontal overflow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the route matrix once');
    const mutationRequests: string[] = [];
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        mutationRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    for (const [routePath, owner] of P8_ROUTES) {
      const response = await page.goto(new URL(routePath, BASE_URL).toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      expect(response?.status() ?? 200).toBeLessThan(400);
      await expect(page.locator('html')).toHaveAttribute('data-mobile-p7-p9-ready', 'true', { timeout: 20_000 });
      await expect(page.locator('html')).toHaveAttribute('data-mobile-p7-p9-phase', 'p8');
      await expect(page.locator(`[data-mobile-member-page="${owner}"]`)).toBeVisible({ timeout: 20_000 });
      await expectHorizontalFit(page);
    }

    expect(mutationRequests).toEqual([]);
  });

  test('P9 finance routes remain authenticated, read-only, and inside the viewport', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the finance matrix once');
    const mutationRequests: string[] = [];
    await installReadOnlyMemberSession(context, mutationRequests);
    const page = await context.newPage();

    try {
      for (const routePath of P9_ROUTES) {
        const response = await page.goto(new URL(routePath, BASE_URL).toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });
        expect(response?.status() ?? 200).toBeLessThan(400);
        await expect(page.locator('html')).toHaveAttribute('data-mobile-p7-p9-ready', 'true', { timeout: 20_000 });
        await expect(page.locator('html')).toHaveAttribute('data-mobile-p7-p9-phase', 'p9');
        await expect(page.locator('.member-finance-page, main:has(> a[href="/"])').first()).toBeVisible({ timeout: 20_000 });
        expect(new URL(page.url()).pathname).toBe(routePath);
        await expectHorizontalFit(page);
      }
    } finally {
      await page.close();
    }

    expect(mutationRequests).toEqual([]);
  });
});

async function installReadOnlyMemberSession(context: BrowserContext, mutationRequests: string[]) {
  await context.addInitScript(() => {
    localStorage.setItem('member_access_token', 'p9-read-only-access');
    localStorage.setItem('member_refresh_token', 'p9-read-only-refresh');
  });

  await context.route('**/member/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const pathname = new URL(request.url()).pathname;

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      mutationRequests.push(`${method} ${pathname}`);
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Mutation blocked by P9 read-only smoke' }),
      });
      return;
    }

    if (pathname === '/member/auth/refresh') {
      await fulfill(route, {
        accessToken: 'p9-read-only-access-refreshed',
        refreshToken: 'p9-read-only-refresh-refreshed',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
      return;
    }

    if (pathname === '/member/wallet') {
      await fulfill(route, {
        currency: 'THB',
        balance: '12345.67',
        availableBalance: '12000.00',
        lockedBalance: '345.67',
        status: 'active',
      });
      return;
    }

    if (pathname === '/member/auth/profile') {
      await fulfill(route, {
        id: 'p9-smoke-member',
        username: 'P9SMOKE',
        displayName: 'P9 Read Only',
        status: 'active',
      });
      return;
    }

    await fulfill(route, {
      items: [],
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      balance: '0.00',
      pendingCount: 0,
    });
  });
}

async function fulfill(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function expectHorizontalFit(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => ({
    bodyClientWidth: document.body.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth + 1);
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}
