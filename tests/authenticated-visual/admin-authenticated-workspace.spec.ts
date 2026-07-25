import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

const adminUrl = firstNonEmpty(process.env.ADMIN_WEB_URL);
const adminIdentity = firstNonEmpty(process.env.SEED_ADMIN_USERNAME, process.env.SEED_ADMIN_EMAIL);
const adminPassword = firstNonEmpty(process.env.SEED_ADMIN_PASSWORD);
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

type RouteLayout = {
  route: string;
  clientWidth: number;
  scrollWidth: number;
  contentWidth: number;
  pageWidth: number;
  sidebarWidth: number;
  surfacesOutsideViewport: Array<{ className: string; left: number; right: number; width: number }>;
  missingImages: Array<{ src: string; alt: string }>;
};

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

async function readRouteLayout(page: Page): Promise<RouteLayout> {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const content = document.querySelector<HTMLElement>('.admin-content-shell');
    const pageElement = document.querySelector<HTMLElement>('.admin-ui-page');
    const sidebar = document.querySelector<HTMLElement>('#admin-sidebar');
    const surfaces = Array.from(document.querySelectorAll<HTMLElement>(
      '.admin-ui-card, .admin-ui-metric, .admin-command-status, .admin-priority-lane, [class*="surface"]',
    )).filter((element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && element.getBoundingClientRect().width > 0;
    });
    const surfacesOutsideViewport = surfaces.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.left >= -2 && rect.right <= viewportWidth + 2) return [];
      return [{
        className: String(element.className),
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
      surfacesOutsideViewport,
      missingImages: Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt })),
    };
  });
}

function installMutationGuard(page: Page) {
  return page.route('**/*', async (route) => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      throw new Error(`Authenticated Admin workspace smoke must remain read-only: ${request.method()} ${request.url()}`);
    }
    await route.continue();
  });
}

async function attachAudit(testInfo: TestInfo, audit: RuntimeAudit, extra: Record<string, unknown>) {
  const payload = `${JSON.stringify({ ...audit, ...extra }, null, 2)}\n`;
  await writeFile(testInfo.outputPath('admin-authenticated-workspace-audit.json'), payload, 'utf8');
  await testInfo.attach('admin-authenticated-workspace-audit', {
    body: Buffer.from(payload),
    contentType: 'application/json',
  });
}

function assertCriticalRuntimeHealth(audit: RuntimeAudit) {
  const criticalFailures = audit.failedRequests.filter((issue) =>
    ['document', 'script', 'stylesheet', 'font', 'image'].includes(issue.resourceType),
  );
  const criticalResponses = audit.badResponses.filter((issue) =>
    (issue.status ?? 0) >= 500 || ['document', 'script', 'stylesheet', 'font', 'image'].includes(issue.resourceType),
  );
  expect(audit.pageErrors, 'Admin routes must not raise page errors').toEqual([]);
  expect(criticalFailures, 'Admin routes must not have critical request failures').toEqual([]);
  expect(criticalResponses, 'Admin routes must not have critical HTTP errors').toEqual([]);
}

test('admin authenticated workspace smoke', async ({ page }, testInfo) => {
  const missingEnvironment = [
    !adminUrl && 'ADMIN_WEB_URL',
    !adminIdentity && 'admin identity',
    !adminPassword && 'admin password',
  ].filter(Boolean);
  if (missingEnvironment.length > 0 && requireAdminSmoke) {
    throw new Error(`Authenticated Admin smoke environment is incomplete: ${missingEnvironment.join(', ')}`);
  }
  test.skip(missingEnvironment.length > 0, 'seeded admin credentials are required');

  const audit = installRuntimeAudit(page);
  await login(page, adminUrl!, adminIdentity!, adminPassword!);
  await installMutationGuard(page);
  await page.goto(new URL('/dashboard', adminUrl!).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);

  const shell = page.locator('.admin-shell');
  const sidebar = page.locator('#admin-sidebar');
  const menuButton = page.locator('.admin-menu-button');
  const collapseButton = page.locator('.admin-collapse-button');
  await expect(shell).toBeVisible();
  await expect(page.locator('.admin-topbar')).toBeVisible();
  await expect(sidebar).toBeAttached();
  await expect(page.locator('.admin-content-shell')).toBeVisible();
  await expect(page.locator('.admin-ui-page')).toBeVisible();
  await expect(page.locator('.admin-command-status')).toBeVisible();

  const tokens = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      background: styles.getPropertyValue('--admin-modern-bg').trim(),
      surface: styles.getPropertyValue('--admin-modern-surface').trim(),
      brand: styles.getPropertyValue('--admin-modern-brand').trim(),
      sidebar: styles.getPropertyValue('--admin-shell-sidebar-width').trim(),
    };
  });
  expect(tokens.background).toBe('#061019');
  expect(tokens.surface).toBe('#0c1a28');
  expect(tokens.brand).toBe('#6f7cff');
  expect(tokens.sidebar).toBe('248px');

  const commandTrigger = page.locator('.admin-command-trigger');
  await expect(commandTrigger).toBeVisible();
  await commandTrigger.click();
  await expect(page.locator('.admin-command-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.admin-command-dialog')).toHaveCount(0);

  const viewport = page.viewportSize();
  const mobileOrTablet = (viewport?.width ?? 1280) <= 1099;
  if (mobileOrTablet) {
    await expect(menuButton).toBeVisible();
    await expect(collapseButton).toBeHidden();
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
    await expect(menuButton).toBeHidden();
    await expect(collapseButton).toBeVisible();
    await expect(sidebar).toBeVisible();
    await collapseButton.click();
    await expect(shell).toHaveClass(/admin-shell--collapsed/);
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();
    await expect(shell).not.toHaveClass(/admin-shell--collapsed/);

    const profileTrigger = page.locator('.admin-sidebar-profile__trigger');
    await profileTrigger.click();
    const profileMenu = page.locator('.admin-profile-menu--sidebar');
    const logoutButton = profileMenu.locator('.admin-profile-menu__logout');
    await expect(profileMenu).toBeVisible();
    await expect(logoutButton).toBeVisible();
    const profileBox = await profileMenu.boundingBox();
    expect(profileBox).not.toBeNull();
    expect(profileBox?.x ?? -1).toBeGreaterThanOrEqual(-1);
    expect((profileBox?.x ?? 0) + (profileBox?.width ?? 0)).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
    expect(profileBox?.y ?? -1).toBeGreaterThanOrEqual(-1);
    expect((profileBox?.y ?? 0) + (profileBox?.height ?? 0)).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);
    await page.keyboard.press('Escape');
  }

  const accessibleRoutes = await page.locator('#admin-sidebar a[href^="/"]').evaluateAll((anchors) => Array.from(new Set(
    anchors
      .map((anchor) => anchor.getAttribute('href'))
      .filter((href): href is string => Boolean(href && href.startsWith('/')),
  )));
  expect(accessibleRoutes).toContain('/dashboard');
  expect(accessibleRoutes.length).toBeLessThanOrEqual(11);

  const routeLayouts: RouteLayout[] = [];
  for (const route of accessibleRoutes) {
    await page.goto(new URL(route, adminUrl!).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
    await expect(page.locator('.admin-content-shell')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(350);
    const layout = await readRouteLayout(page);
    expect(layout.scrollWidth - layout.clientWidth, `${route} must not overflow horizontally`).toBeLessThanOrEqual(2);
    expect(layout.surfacesOutsideViewport, `${route} surfaces must stay inside the viewport`).toEqual([]);
    expect(layout.missingImages, `${route} must not render broken images`).toEqual([]);
    expect(layout.contentWidth, `${route} content must have usable width`).toBeGreaterThan(280);
    expect(layout.pageWidth, `${route} page must have usable width`).toBeGreaterThan(280);
    expect(layout.pageWidth / Math.max(layout.contentWidth, 1), `${route} must use the content workspace`).toBeGreaterThanOrEqual(0.9);
    routeLayouts.push(layout);
  }

  await page.goto(new URL('/dashboard', adminUrl!).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
  await page.screenshot({
    path: testInfo.outputPath(`admin-authenticated-workspace-${testInfo.project.name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  assertCriticalRuntimeHealth(audit);
  await attachAudit(testInfo, audit, {
    finalUrl: page.url(),
    project: testInfo.project.name,
    mobileOrTablet,
    tokens,
    accessibleRouteCount: accessibleRoutes.length,
    routeLayouts,
  });
});
