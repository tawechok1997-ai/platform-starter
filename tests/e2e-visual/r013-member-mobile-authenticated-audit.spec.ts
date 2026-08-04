import { expect, test, type BrowserContext, type Locator, type Page, type Route, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.MEMBER_HOME_URL
  ?? 'https://platformweb-member-production.up.railway.app/';

const POPUP_KINDS = [
  'menu',
  'contact',
  'password',
  'deposit',
  'withdraw',
  'network-income',
  'commission-income',
  'coupon',
  'language',
  'video',
] as const;

const AUTHENTICATED_ROUTES = [
  '/mobile/member/vip',
  '/mobile/member/commission',
  '/mobile/member/affiliate',
  '/mobile/member/bonus',
  '/mobile/member/live',
  '/mobile/member/promotions',
  '/mobile/member/news',
  '/mobile/member/activity',
  '/mobile/member/history',
  '/mobile/member/notifications',
  '/mobile/member/guide',
  '/profile/avatar',
] as const;

test.describe('Member mobile authenticated audit', () => {
  test('authenticated shell, bottom navigation, drawer and every member popup', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Authenticated interaction audit runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-interactions-v2');
    await installReadOnlyMemberSession(context);
    const page = await context.newPage();
    const runtime = captureRuntime(page);

    try {
      await page.goto(new URL('/', BASE_URL).toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      const root = page.locator('[data-mobile-home-root="true"]');
      await expect(root).toBeVisible({ timeout: 30_000 });
      await expect(root).toHaveAttribute('data-mobile-authenticated', 'true', { timeout: 20_000 });
      await page.waitForTimeout(800);

      const report: Record<string, unknown> = {
        initialUrl: page.url(),
        root: await readMetrics(page),
        headerControls: await readInteractive(page.locator('[data-mobile-section-owner="header"]')),
        bottomNavigation: await inspectBottomNavigation(page),
      };

      const menuButton = page.locator('button[aria-label="เปิดเมนูสมาชิก"]');
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      const drawer = page.locator('#mobile-home-drawer');
      await expect(drawer).toBeVisible();
      report.drawer = {
        bounds: await readBounds(drawer),
        interactive: await readInteractive(drawer),
        text: normalizeText(await drawer.textContent()),
        bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
      };
      await page.screenshot({ path: path.join(evidenceDir, 'drawer.png'), fullPage: false, animations: 'disabled' });
      await page.locator('#mobile-home-drawer button[aria-label="ปิดเมนู"]').click();
      await expect(drawer).not.toBeVisible();

      const popups: Array<Record<string, unknown>> = [];
      for (const kind of POPUP_KINDS) {
        await closeVisibleDialogs(page);
        await page.evaluate((popupKind) => {
          window.dispatchEvent(new CustomEvent('member:mobile-popup-open', { detail: { kind: popupKind } }));
        }, kind);
        const dialog = page.locator('[role="dialog"]:visible').last();
        const visible = await dialog.isVisible({ timeout: 4_000 }).catch(() => false);
        if (!visible) {
          popups.push({ kind, visible: false, url: page.url() });
          continue;
        }

        await page.waitForTimeout(150);
        const popup: Record<string, unknown> = {
          kind,
          visible: true,
          bounds: await readBounds(dialog),
          interactive: await readInteractive(dialog),
          text: normalizeText(await dialog.textContent()).slice(0, 1600),
          bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
        };

        if (kind === 'language') {
          const options = dialog.locator('button');
          popup.options = await options.evaluateAll((buttons) => buttons.map((button) => ({
            text: (button.textContent ?? '').replace(/\s+/g, ' ').trim(),
            disabled: (button as HTMLButtonElement).disabled,
            width: Math.round(button.getBoundingClientRect().width),
            height: Math.round(button.getBoundingClientRect().height),
          })));
          const unsupported = options.filter({ hasText: 'Tagalog' });
          if (await unsupported.count()) {
            const before = normalizeText(await dialog.textContent());
            await unsupported.first().click();
            await page.waitForTimeout(180);
            popup.tagalogClick = {
              dialogStillOpen: await dialog.isVisible().catch(() => false),
              contentUnchanged: normalizeText(await dialog.textContent()) === before,
              htmlLang: await page.locator('html').getAttribute('lang'),
            };
          }
        }

        await page.screenshot({
          path: path.join(evidenceDir, `popup-${kind}.png`),
          fullPage: false,
          animations: 'disabled',
        });
        popups.push(popup);
        await closeVisibleDialogs(page);
      }

      report.popups = popups;
      report.finalUrl = page.url();
      report.finalMetrics = await readMetrics(page);
      report.runtime = runtime.snapshot();
      await writeJson(path.join(evidenceDir, 'authenticated-interactions-v2.json'), report);
      console.log(`MEMBER_MOBILE_AUTHENTICATED_INTERACTIONS ${JSON.stringify({
        finalUrl: report.finalUrl,
        popupCount: popups.length,
        missingPopups: popups.filter((popup) => popup.visible === false).map((popup) => popup.kind),
        outsideViewport: popups.filter((popup) => (popup.bounds as { insideViewport?: boolean } | undefined)?.insideViewport === false).map((popup) => popup.kind),
        tagalogClick: popups.find((popup) => popup.kind === 'language')?.tagalogClick ?? null,
        pageErrors: runtime.snapshot().pageErrors.length,
        consoleErrors: runtime.snapshot().consoleErrors.length,
      })}`);
    } finally {
      await page.close();
    }
  });

  test('authenticated dedicated mobile route matrix remains inside the viewport', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Authenticated route matrix runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-routes-v2');
    await installReadOnlyMemberSession(context);
    const results: Array<Record<string, unknown>> = [];

    for (const routePath of AUTHENTICATED_ROUTES) {
      const page = await context.newPage();
      const runtime = captureRuntime(page);
      try {
        const response = await page.goto(new URL(routePath, BASE_URL).toString(), {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        }).catch(() => null);
        await page.waitForTimeout(900);
        const metrics = await readMetrics(page);
        const bodyText = await page.locator('body').innerText().catch(() => '');
        const result = {
          route: routePath,
          status: response?.status() ?? null,
          finalUrl: page.url(),
          loginLoop: /\/session-expired|\/login(?:\?|$)/.test(new URL(page.url()).pathname),
          notFound: response?.status() === 404 || /404|not found|ไม่พบหน้านี้/i.test(bodyText.slice(0, 1200)),
          metrics,
          interactive: await readInteractive(page.locator('body')),
          runtime: runtime.snapshot(),
        };
        results.push(result);

        const routeDir = path.join(evidenceDir, sanitizeRoutePath(routePath));
        await fs.mkdir(routeDir, { recursive: true });
        await page.screenshot({ path: path.join(routeDir, 'viewport.png'), fullPage: false, animations: 'disabled' });
        await writeJson(path.join(routeDir, 'audit.json'), result);
      } finally {
        await page.close();
      }
    }

    await writeJson(path.join(evidenceDir, 'authenticated-routes-v2.json'), results);
    console.log(`MEMBER_MOBILE_AUTHENTICATED_ROUTES ${JSON.stringify({
      routes: results.length,
      loginLoops: results.filter((result) => result.loginLoop === true).map((result) => result.route),
      notFound: results.filter((result) => result.notFound === true).map((result) => result.route),
      overflow: results.filter((result) => (result.metrics as { horizontalOverflow?: boolean }).horizontalOverflow).map((result) => result.route),
      pageErrors: results.filter((result) => ((result.runtime as { pageErrors: string[] }).pageErrors).length > 0).map((result) => result.route),
    })}`);
  });
});

async function installReadOnlyMemberSession(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('member_access_token', 'member-mobile-audit-access');
    localStorage.setItem('member_refresh_token', 'member-mobile-audit-refresh');
  });

  await context.route('**/member/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/member/auth/refresh') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'member-mobile-audit-access-refreshed',
          refreshToken: 'member-mobile-audit-refresh-refreshed',
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
      referralLink: '/affiliate?ref=audit-member',
    }),
  }));
  await context.route('**/member/auth/security**', (route) => fulfillReadOnly(route, { twoFactorEnabled: false }));
  await context.route('**/member/auth/sessions**', (route) => fulfillReadOnly(route, { items: [] }));
  await context.route('**/member/notifications**', (route) => fulfillReadOnly(route, { items: [], total: 0, pendingCount: 0 }));
  await context.route('**/member/bank-accounts**', (route) => fulfillReadOnly(route, { items: [] }));
  await context.route('**/member/bonus**', (route) => fulfillReadOnly(route, { items: [], balance: '0.00' }));
  await context.route('**/member/affiliate**', (route) => fulfillReadOnly(route, { items: [], balance: '0.00', referralLink: '/affiliate?ref=audit-member' }));
  await context.route('**/member/commission**', (route) => fulfillReadOnly(route, { items: [], balance: '0.00' }));
  await context.route('**/member/history**', (route) => fulfillReadOnly(route, { items: [], total: 0 }));
  await context.route('**/member/deposit**', (route) => fulfillReadOnly(route, { items: [], methods: [] }));
  await context.route('**/member/withdraw**', (route) => fulfillReadOnly(route, { items: [], methods: [] }));
}

async function fulfillReadOnly(route: Route, getPayload: Record<string, unknown>) {
  const method = route.request().method();
  await route.fulfill({
    status: method === 'GET' ? 200 : 422,
    contentType: 'application/json',
    body: JSON.stringify(method === 'GET' ? getPayload : { message: 'Blocked by read-only mobile audit' }),
  });
}

async function inspectBottomNavigation(page: Page) {
  const nav = page.locator('nav[data-mobile-member-bottom-navigation="true"]');
  const visible = await nav.isVisible().catch(() => false);
  return {
    visible,
    bounds: visible ? await readBounds(nav) : null,
    interactive: visible ? await readInteractive(nav) : [],
  };
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
      scrollY: window.scrollY,
      viewportMode: html?.dataset.memberViewportMode ?? '',
      sessionReady: html?.dataset.memberSessionReady ?? '',
      mobileMemberNav: html?.dataset.mobileMemberNav ?? '',
      pathname: location.pathname,
    };
  });
}

async function readBounds(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      position: style.position,
      zIndex: style.zIndex,
      insideViewport: rect.left >= -1
        && rect.top >= -1
        && rect.right <= window.innerWidth + 1
        && rect.bottom <= window.innerHeight + 1,
    };
  });
}

async function readInteractive(locator: Locator) {
  return locator.locator('a,button,input,select,textarea,[role="button"],[role="tab"]').evaluateAll((elements) => elements.flatMap((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden') return [];
    return [{
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
      ariaLabel: element.getAttribute('aria-label'),
      href: element instanceof HTMLAnchorElement ? element.getAttribute('href') : null,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      smallTouchTarget: rect.width < 44 || rect.height < 44,
      disabled: element instanceof HTMLButtonElement || element instanceof HTMLInputElement ? element.disabled : false,
    }];
  }));
}

async function closeVisibleDialogs(page: Page) {
  for (let round = 0; round < 4; round += 1) {
    const visible = page.locator('[role="dialog"]:visible');
    if (await visible.count() === 0) return;
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(80);
    const remaining = page.locator('[role="dialog"]:visible');
    if (await remaining.count() === 0) return;
    const closeButton = remaining.last().locator('button[aria-label*="ปิด"], button[aria-label*="Close" i]').first();
    if (await closeButton.isVisible().catch(() => false)) await closeButton.click().catch(() => undefined);
    await page.waitForTimeout(80);
  }
}

function captureRuntime(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: Array<Record<string, unknown>> = [];
  const badResponses: Array<Record<string, unknown>> = [];

  page.on('console', (message) => {
    if (message.type() === 'error' && !/favicon|ERR_BLOCKED_BY_CLIENT/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({
    method: request.method(),
    type: request.resourceType(),
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

async function writeJson(filePath: string, value: unknown) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
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
