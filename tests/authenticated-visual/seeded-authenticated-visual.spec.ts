import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

const memberUrl = firstNonEmpty(process.env.MEMBER_WEB_URL);
const adminUrl = firstNonEmpty(process.env.ADMIN_WEB_URL);
const apiUrl = firstNonEmpty(process.env.API_URL);
const memberToken = firstNonEmpty(process.env.PROD_MEMBER_TOKEN);
const memberIdentity = firstNonEmpty(
  process.env.SEED_MEMBER_USERNAME,
  process.env.SEED_MEMBER_EMAIL,
  process.env.SEED_MEMBER_PHONE,
);
const memberPassword = firstNonEmpty(process.env.SEED_MEMBER_PASSWORD);
const adminIdentity = firstNonEmpty(process.env.SEED_ADMIN_USERNAME, process.env.SEED_ADMIN_EMAIL);
const adminPassword = firstNonEmpty(process.env.SEED_ADMIN_PASSWORD);
const requireMemberSmoke = process.env.REQUIRE_MEMBER_AUTHENTICATED_SMOKE === 'true';
const requireAdminSmoke = process.env.REQUIRE_ADMIN_AUTHENTICATED_SMOKE === 'true';

type NetworkIssue = {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  error?: string;
};

type RuntimeAudit = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: NetworkIssue[];
  badResponses: NetworkIssue[];
};

type PublicSettings = {
  website?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  features?: Record<string, unknown>;
};

type AdminRouteLayout = {
  route: string;
  clientWidth: number;
  scrollWidth: number;
  contentWidth: number;
  pageWidth: number;
  sidebarWidth: number;
  cardCount: number;
  cardsOutsideViewport: Array<{ className: string; left: number; right: number; width: number }>;
  missingImages: Array<{ src: string; alt: string }>;
};

const featureRoutes = [
  ['game_lobby_enabled', '/games'],
  ['withdraw_enabled', '/withdraw'],
  ['promotion_enabled', '/promotions'],
  ['bonus_enabled', '/bonus'],
  ['affiliate_enabled', '/affiliate'],
  ['kyc_enabled', '/bank-accounts'],
  ['support_enabled', '/support'],
  ['profile_enabled', '/profile'],
  ['notification_enabled', '/notifications'],
] as const;

function installRuntimeAudit(page: Page): RuntimeAudit {
  const audit: RuntimeAudit = { consoleErrors: [], pageErrors: [], failedRequests: [], badResponses: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') audit.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => audit.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const error = request.failure()?.errorText;
    if (error === 'net::ERR_ABORTED' && request.resourceType() === 'fetch') return;
    audit.failedRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      error,
    });
  });
  page.on('response', (response) => {
    if (response.status() < 400) return;
    const request = response.request();
    audit.badResponses.push({
      url: response.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      status: response.status(),
    });
  });
  return audit;
}

async function login(page: Page, baseUrl: string, identity: string, password: string) {
  await page.goto(new URL('/login', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  const passwordInput = page.locator('input[type="password"]').first();
  const identityInput = page.locator('input:not([type="password"]):not([type="hidden"]):not([type="checkbox"]):not([type="submit"])').first();
  await expect(identityInput).toBeVisible();
  await identityInput.fill(identity);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForURL((url) => !/\/login(?:[/?#]|$)/.test(url.pathname), { timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
}

async function installMemberToken(page: Page, token: string) {
  await page.addInitScript((accessToken) => {
    window.localStorage.setItem('member_access_token', accessToken);
    window.localStorage.removeItem('member_refresh_token');
  }, token);
}

async function loadLazyContent(page: Page) {
  await page.evaluate(async () => {
    const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const step = Math.max(window.innerHeight * 0.8, 500);
    const maximum = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    for (let position = 0; position < maximum; position += step) {
      window.scrollTo(0, position);
      await sleep(90);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

async function fetchPublicSettings(page: Page): Promise<PublicSettings> {
  if (!apiUrl) return {};
  const response = await page.request.get(new URL('/public/site-settings', `${apiUrl.replace(/\/$/, '')}/`).toString());
  expect(response.status(), 'Public settings endpoint must remain healthy').toBeLessThan(400);
  return response.json() as Promise<PublicSettings>;
}

function booleanSetting(group: Record<string, unknown> | undefined, key: string, fallback = true) {
  const value = group?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

async function attachAudit(
  testInfo: TestInfo,
  name: string,
  audit: RuntimeAudit,
  extra: Record<string, unknown>,
) {
  const payload = `${JSON.stringify({ ...audit, ...extra }, null, 2)}\n`;
  const outputPath = testInfo.outputPath(`${name}.json`);
  await writeFile(outputPath, payload, 'utf8');
  await testInfo.attach(name, {
    body: Buffer.from(payload),
    contentType: 'application/json',
  });
}

async function assertRuntimeHealth(page: Page, audit: RuntimeAudit, surfaceLabel: string) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyTextLength: document.body.innerText.trim().length,
    missingImages: Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt })),
  }));

  expect(metrics.bodyTextLength).toBeGreaterThan(100);
  expect(metrics.scrollWidth - metrics.clientWidth, `${surfaceLabel} must not overflow horizontally`).toBeLessThanOrEqual(2);
  expect(metrics.missingImages, `${surfaceLabel} must not render broken images`).toEqual([]);
  expect(audit.pageErrors, `${surfaceLabel} must not raise page errors`).toEqual([]);

  const criticalFailures = audit.failedRequests.filter((issue) =>
    ['document', 'script', 'stylesheet', 'font', 'image'].includes(issue.resourceType),
  );
  const criticalResponses = audit.badResponses.filter((issue) =>
    (issue.status ?? 0) >= 500 || ['document', 'script', 'stylesheet', 'font', 'image'].includes(issue.resourceType),
  );
  expect(criticalFailures, `${surfaceLabel} must not have critical request failures`).toEqual([]);
  expect(criticalResponses, `${surfaceLabel} must not have critical HTTP errors`).toEqual([]);
  return metrics;
}

async function readAdminRouteLayout(page: Page): Promise<AdminRouteLayout> {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const content = document.querySelector<HTMLElement>('.admin-content-shell');
    const pageElement = document.querySelector<HTMLElement>('.admin-ui-page');
    const sidebar = document.querySelector<HTMLElement>('#admin-sidebar');
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.admin-ui-card, .admin-ui-metric, .admin-command-status, .admin-priority-lane'))
      .filter((element) => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    const cardsOutsideViewport = cards.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.left >= -2 && rect.right <= viewportWidth + 2) return [];
      return [{
        className: element.className,
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      }];
    });
    return {
      route: window.location.pathname,
      clientWidth: viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      contentWidth: Math.round(content?.getBoundingClientRect().width ?? 0),
      pageWidth: Math.round(pageElement?.getBoundingClientRect().width ?? 0),
      sidebarWidth: Math.round(sidebar?.getBoundingClientRect().width ?? 0),
      cardCount: cards.length,
      cardsOutsideViewport,
      missingImages: Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt })),
    };
  });
}

function safeArtifactName(route: string) {
  return route.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-') || 'dashboard';
}

test.describe('seeded authenticated visual artifacts', () => {
  test('member authenticated home', async ({ page }, testInfo) => {
    const hasCredentialLogin = Boolean(memberIdentity && memberPassword);
    const hasTokenLogin = Boolean(memberToken);
    const missingMemberEnvironment = [
      !memberUrl && 'MEMBER_WEB_URL',
      !apiUrl && 'API_URL',
      !hasCredentialLogin && !hasTokenLogin && 'member credentials or PROD_MEMBER_TOKEN',
    ].filter(Boolean);
    if (missingMemberEnvironment.length > 0 && requireMemberSmoke) {
      throw new Error(`Authenticated Member smoke environment is incomplete: ${missingMemberEnvironment.join(', ')}`);
    }
    test.skip(missingMemberEnvironment.length > 0, 'seeded member authentication is required');

    const audit = installRuntimeAudit(page);
    const settings = await fetchPublicSettings(page);

    if (memberToken) await installMemberToken(page, memberToken);
    else await login(page, memberUrl!, memberIdentity!, memberPassword!);

    await page.goto(new URL('/', memberUrl!).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
    await expect(page.locator('.member-home-shell')).toBeVisible();

    const expectedSiteName = typeof settings.website?.site_name === 'string'
      ? settings.website.site_name
      : 'Platform Starter';
    await expect(page.locator('.member-brand-copy strong')).toHaveText(expectedSiteName);

    const gamesEnabled = booleanSetting(settings.features, 'game_lobby_enabled');
    const showCategories = booleanSetting(settings.theme, 'show_game_categories');
    const categoryRail = page.locator('.member-category-rail');
    if (gamesEnabled && showCategories) {
      await expect(categoryRail).toBeVisible();
      await expect(categoryRail.locator('[data-game-category-key]')).toHaveCount(8);
    } else {
      await expect(categoryRail).toHaveCount(0);
    }

    await expect(page.getByRole('navigation', { name: 'เมนูหน้า Home' })).toBeVisible();
    const competition = page.locator('.member-competition-showcase');
    if (gamesEnabled) {
      await expect(competition).toBeVisible();
      await expect(competition.locator('.member-jackpot-card')).toBeVisible();
      await expect(competition.locator('.member-leaderboard-card')).toBeVisible();
    } else {
      await expect(competition).toHaveCount(0);
    }

    await page.getByRole('button', { name: 'โปรโมชั่นแนะนำ', exact: true }).click();
    const promotionPanel = page.getByRole('region', { name: 'โปรโมชั่นแนะนำ' });
    await expect(promotionPanel).toBeVisible();
    const showPromotions = booleanSetting(settings.theme, 'show_promotion_banner');
    if (!showPromotions) await expect(promotionPanel).toContainText('โปรโมชั่นถูกปิดใช้งานชั่วคราว');

    await page.getByRole('button', { name: 'กิจกรรม', exact: true }).click();
    await expect(page.getByRole('region', { name: 'กิจกรรม' })).toBeVisible();
    await page.getByRole('button', { name: 'ไฮไลท์', exact: true }).click();

    await page.getByRole('button', { name: 'เปิดเมนู' }).click();
    const drawer = page.getByRole('dialog', { name: 'เมนูสมาชิก' });
    await expect(drawer).toBeVisible();
    for (const [featureKey, href] of featureRoutes) {
      const enabled = booleanSetting(settings.features, featureKey);
      await expect(drawer.locator(`a[href="${href}"]`), `${href} must follow ${featureKey}`).toHaveCount(enabled ? 1 : 0);
    }
    await page.getByRole('button', { name: 'ปิดเมนู' }).click();

    await page.goto(new URL('/transactions', memberUrl!).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
    await page.goto(new URL('/', memberUrl!).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);

    await loadLazyContent(page);
    const metrics = await assertRuntimeHealth(page, audit, 'Authenticated Member Home');
    await page.screenshot({ path: testInfo.outputPath('member-authenticated-home.png'), fullPage: true, animations: 'disabled' });
    await attachAudit(testInfo, 'member-authenticated-production-audit', audit, {
      finalUrl: page.url(),
      project: testInfo.project.name,
      authMode: memberToken ? 'token' : 'credentials',
      expectedSiteName,
      gamesEnabled,
      showCategories,
      showPromotions,
      metrics,
    });
  });

  test('admin authenticated home', async ({ page }, testInfo) => {
    const missingAdminEnvironment = [
      !adminUrl && 'ADMIN_WEB_URL',
      !adminIdentity && 'admin identity',
      !adminPassword && 'admin password',
    ].filter(Boolean);
    if (missingAdminEnvironment.length > 0 && requireAdminSmoke) {
      throw new Error(`Authenticated Admin smoke environment is incomplete: ${missingAdminEnvironment.join(', ')}`);
    }
    test.skip(missingAdminEnvironment.length > 0, 'seeded admin credentials are required');

    const audit = installRuntimeAudit(page);
    await login(page, adminUrl!, adminIdentity!, adminPassword!);
    await page.goto(new URL('/dashboard', adminUrl!).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);

    const shell = page.locator('.admin-shell');
    const topbar = page.locator('.admin-topbar');
    const sidebar = page.locator('#admin-sidebar');
    const content = page.locator('.admin-content-shell');
    const adminPage = page.locator('.admin-ui-page');
    await expect(shell).toBeVisible();
    await expect(topbar).toBeVisible();
    await expect(sidebar).toBeAttached();
    await expect(content).toBeVisible();
    await expect(adminPage).toBeVisible();
    await expect(page.locator('.admin-command-status')).toBeVisible();

    const modernTokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        background: styles.getPropertyValue('--admin-modern-bg').trim(),
        surface: styles.getPropertyValue('--admin-modern-surface').trim(),
        brand: styles.getPropertyValue('--admin-modern-brand').trim(),
        sidebar: styles.getPropertyValue('--admin-modern-sidebar').trim(),
      };
    });
    expect(modernTokens.background).toBe('#061019');
    expect(modernTokens.surface).toBe('#0c1a28');
    expect(modernTokens.brand).toBe('#38bdf8');
    expect(modernTokens.sidebar).toBe('248px');

    const commandTrigger = page.locator('.admin-command-trigger');
    await expect(commandTrigger).toBeVisible();
    await commandTrigger.click();
    await expect(page.locator('.admin-command-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.admin-command-dialog')).toHaveCount(0);

    const viewport = page.viewportSize();
    const mobileOrTablet = (viewport?.width ?? 1280) <= 1099;
    const menuButton = page.locator('.admin-menu-button');
    await expect(menuButton).toBeVisible();

    if (mobileOrTablet) {
      await menuButton.click();
      await expect(sidebar).toHaveClass(/open/);
      const mobileController = page.locator('.admin-mobile-drawer-controller');
      await expect(mobileController).toBeVisible();
      const mobileLogout = mobileController.locator('.admin-mobile-drawer-controller__logout');
      await expect(mobileLogout).toBeVisible();
      const logoutBox = await mobileLogout.boundingBox();
      expect(logoutBox).not.toBeNull();
      expect((logoutBox?.x ?? -1) + (logoutBox?.width ?? 0)).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
      await page.locator('.admin-mobile-drawer-controller__close').click();
      await expect(sidebar).not.toHaveClass(/open/);
    } else {
      await expect(sidebar).toBeVisible();
      const collapseButton = page.locator('.admin-collapse-button');
      await expect(collapseButton).toBeVisible();
      await collapseButton.click();
      await expect(shell).toHaveClass(/admin-shell--collapsed/);
      await menuButton.click();
      await expect(shell).not.toHaveClass(/admin-shell--collapsed/);

      const profileTrigger = page.locator('.admin-sidebar-profile__trigger');
      await expect(profileTrigger).toBeVisible();
      await profileTrigger.click();
      const profileMenu = page.locator('.admin-profile-menu--sidebar');
      const logoutButton = profileMenu.locator('.admin-profile-menu__logout');
      await expect(profileMenu).toBeVisible();
      await expect(logoutButton).toBeVisible();
      const profileMenuBox = await profileMenu.boundingBox();
      expect(profileMenuBox).not.toBeNull();
      expect(profileMenuBox?.x ?? -1).toBeGreaterThanOrEqual(-1);
      expect((profileMenuBox?.x ?? 0) + (profileMenuBox?.width ?? 0)).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
      expect(profileMenuBox?.y ?? -1).toBeGreaterThanOrEqual(-1);
      expect((profileMenuBox?.y ?? 0) + (profileMenuBox?.height ?? 0)).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);
      await page.keyboard.press('Escape');
    }

    const accessibleRoutes = await page.locator('#admin-sidebar a[href^="/"]').evaluateAll((anchors) => Array.from(new Set(
      anchors
        .map((anchor) => anchor.getAttribute('href'))
        .filter((href): href is string => Boolean(href && href.startsWith('/'))),
    )));
    expect(accessibleRoutes).toContain('/dashboard');

    const routeLayouts: AdminRouteLayout[] = [];
    for (const route of accessibleRoutes) {
      await page.goto(new URL(route, adminUrl!).toString(), { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
      await expect(page.locator('.admin-content-shell')).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(450);
      await loadLazyContent(page);
      const layoutMetrics = await readAdminRouteLayout(page);
      expect(layoutMetrics.scrollWidth - layoutMetrics.clientWidth, `${route} must not overflow horizontally`).toBeLessThanOrEqual(2);
      expect(layoutMetrics.cardsOutsideViewport, `${route} cards must stay inside the viewport`).toEqual([]);
      expect(layoutMetrics.missingImages, `${route} must not render broken images`).toEqual([]);
      expect(layoutMetrics.contentWidth, `${route} content must have usable width`).toBeGreaterThan(280);
      expect(layoutMetrics.pageWidth, `${route} page must have usable width`).toBeGreaterThan(280);
      expect(layoutMetrics.pageWidth / Math.max(layoutMetrics.contentWidth, 1), `${route} must use the content workspace`).toBeGreaterThanOrEqual(0.9);
      routeLayouts.push(layoutMetrics);

      if (route === '/dashboard') {
        await page.screenshot({
          path: testInfo.outputPath(`admin-authenticated-dashboard-${testInfo.project.name}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      }
    }

    await page.goto(new URL('/dashboard', adminUrl!).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
    const metrics = await assertRuntimeHealth(page, audit, 'Authenticated Admin routes');
    const dashboardLayout = await readAdminRouteLayout(page);
    expect(getComputedStyleFromRoute(dashboardLayout.sidebarWidth, mobileOrTablet)).toBe(true);

    await attachAudit(testInfo, 'admin-authenticated-production-audit', audit, {
      finalUrl: page.url(),
      project: testInfo.project.name,
      mobileOrTablet,
      modernTokens,
      metrics,
      dashboardLayout,
      accessibleRouteCount: accessibleRoutes.length,
      routeLayouts,
    });

    if (mobileOrTablet) {
      await page.locator('.admin-menu-button').click();
      const logoutButton = page.locator('.admin-mobile-drawer-controller__logout');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();
    } else {
      await page.locator('.admin-sidebar-profile__trigger').click();
      const logoutButton = page.locator('.admin-profile-menu--sidebar .admin-profile-menu__logout');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();
    }
    await page.waitForURL(/\/login(?:[/?#]|$)/, { timeout: 20_000 });
  });
});

function getComputedStyleFromRoute(sidebarWidth: number, mobileOrTablet: boolean) {
  return mobileOrTablet ? sidebarWidth < 1100 : sidebarWidth === 248;
}
