import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const MEMBER_HOME_URL = process.env.MEMBER_HOME_URL
  ?? 'https://platformweb-member-production.up.railway.app/';
const LOCAL_SMOKE = isLoopbackUrl(MEMBER_HOME_URL);

type AncestorMetric = {
  node: string;
  overflowX: string;
  overflowY: string;
  position: string;
  transform: string;
  contain: string;
  clientHeight: number;
  scrollHeight: number;
};

type LayoutMetrics = {
  bodyClientWidth: number;
  bodyScrollWidth: number;
  documentClientWidth: number;
  documentScrollWidth: number;
  headerPosition: string;
  headerTop: number | null;
  railPosition: string;
  railTop: number | null;
  rootLeft: number | null;
  rootRight: number | null;
  rootWidth: number | null;
  viewportWidth: number;
  windowScrollY: number;
  scrollingElement: string;
  headerAncestors: AncestorMetric[];
};

test.describe('production Mobile Home smoke', () => {
  test.skip(({ viewport }) => !viewport || viewport.width > 430, 'Mobile viewport only');

  test('home fits viewport, sticky chrome works, and category selection renders', async ({ page }, testInfo) => {
    const consoleRecords: Array<{ type: string; text: string }> = [];
    const pageErrors: string[] = [];
    const failedRequests: Array<{ method: string; resourceType: string; url: string; failure: string }> = [];

    page.on('console', (message) => consoleRecords.push({ type: message.type(), text: message.text() }));
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url: sanitizeUrl(request.url()),
      failure: request.failure()?.errorText ?? 'unknown',
    }));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(MEMBER_HOME_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    const root = page.locator('[data-mobile-home-root="true"]');
    await expect(root).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-mobile-section-owner="header"]')).toBeVisible();
    await expect(page.locator('[data-mobile-section-owner="category-menu"]')).toBeVisible();
    await page.waitForTimeout(1_500);

    const evidenceDir = await prepareEvidenceDirectory(testInfo);
    await page.screenshot({ path: path.join(evidenceDir, 'top.png'), fullPage: false, animations: 'disabled' });

    const topMetrics = await readLayoutMetrics(page);
    expectHorizontalFit(topMetrics);
    expect(topMetrics.rootLeft ?? -1).toBeGreaterThanOrEqual(-1);
    expect(topMetrics.rootRight ?? Number.MAX_SAFE_INTEGER).toBeLessThanOrEqual(topMetrics.viewportWidth + 1);

    const categoryRail = page.locator('[data-mobile-section-owner="category-menu"]');
    await categoryRail.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy({ top: 420, left: 0, behavior: 'auto' }));
    await page.waitForTimeout(250);

    const stickyMetrics = await readLayoutMetrics(page);
    await fs.writeFile(path.join(evidenceDir, 'sticky-diagnostics.json'), JSON.stringify(stickyMetrics, null, 2));
    console.log(`MOBILE_STICKY_DIAGNOSTICS ${JSON.stringify(stickyMetrics)}`);

    expectHorizontalFit(stickyMetrics);
    expect(stickyMetrics.headerPosition).toBe('sticky');
    expect(
      stickyMetrics.headerTop ?? 999,
      `Sticky diagnostics: ${JSON.stringify(stickyMetrics, null, 2)}`,
    ).toBeGreaterThanOrEqual(-1);
    expect(stickyMetrics.headerTop ?? 999).toBeLessThanOrEqual(2);
    expect(stickyMetrics.railPosition).toBe('sticky');
    expect(stickyMetrics.railTop ?? -999).toBeGreaterThanOrEqual(55);
    expect(stickyMetrics.railTop ?? 999).toBeLessThanOrEqual(110);

    await page.screenshot({ path: path.join(evidenceDir, 'sticky.png'), fullPage: false, animations: 'disabled' });

    const casinoButton = page.locator('button[data-mobile-category-id="casino"]');
    await casinoButton.click();
    await expect(casinoButton).toHaveAttribute('aria-selected', 'true');
    await expect(root).toHaveAttribute('data-mobile-active-category', 'casino');
    await page.waitForTimeout(600);

    const categoryMetrics = await readLayoutMetrics(page);
    expectHorizontalFit(categoryMetrics);
    await page.screenshot({ path: path.join(evidenceDir, 'casino.png'), fullPage: false, animations: 'disabled' });

    const relevantConsoleErrors = consoleRecords.filter((entry) => (
      entry.type === 'error'
      && !/favicon|ERR_BLOCKED_BY_CLIENT/i.test(entry.text)
      && !(LOCAL_SMOKE && /ERR_CONNECTION_REFUSED/i.test(entry.text))
    ));

    await fs.writeFile(path.join(evidenceDir, 'metrics.json'), JSON.stringify({
      top: topMetrics,
      sticky: stickyMetrics,
      category: categoryMetrics,
    }, null, 2));
    await fs.writeFile(path.join(evidenceDir, 'console.json'), JSON.stringify(consoleRecords, null, 2));
    await fs.writeFile(path.join(evidenceDir, 'page-errors.json'), JSON.stringify(pageErrors, null, 2));
    await fs.writeFile(path.join(evidenceDir, 'failed-requests.json'), JSON.stringify(failedRequests, null, 2));

    expect(pageErrors, `Page errors: ${JSON.stringify(pageErrors)}`).toEqual([]);
    expect(relevantConsoleErrors, `Console errors: ${JSON.stringify(relevantConsoleErrors)}`).toEqual([]);
  });

  test('P4-P6 home owner, canonical launch, drawer and optional member bottom navigation work together', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the complete interaction contract once');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(MEMBER_HOME_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    const root = page.locator('[data-mobile-home-root="true"]');
    const html = page.locator('html');
    const menuTrigger = page.locator('button[aria-controls="mobile-home-drawer"]');
    const drawer = page.locator('#mobile-home-drawer');
    const bottomNavigation = page.locator('[data-mobile-member-bottom-navigation="true"]');

    await expect(root).toBeVisible({ timeout: 30_000 });
    await expect(root).toHaveAttribute('data-mobile-p4-p6-ready', 'true', { timeout: 15_000 });
    const hasBottomNavigation = await bottomNavigation.count() > 0;
    if (hasBottomNavigation) await expect(bottomNavigation).toBeVisible({ timeout: 15_000 });
    else await expect(bottomNavigation).toHaveCount(0);

    await menuTrigger.click();
    await expect(menuTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(html).toHaveAttribute('data-mobile-drawer-open', 'true');
    if (hasBottomNavigation) await expect(bottomNavigation).toBeHidden();

    await page.keyboard.press('Escape');
    await expect(menuTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(html).toHaveAttribute('data-mobile-drawer-open', 'false');
    if (hasBottomNavigation) await expect(bottomNavigation).toBeVisible();
    await expect(menuTrigger).toBeFocused();

    const casinoButton = page.locator('button[data-mobile-category-id="casino"]');
    const homeButton = page.locator('button[data-mobile-category-id="home"]');
    await casinoButton.click();
    await expect(root).toHaveAttribute('data-mobile-active-category', 'casino');
    await expect(html).toHaveAttribute('data-mobile-member-home-surface', 'false');
    if (hasBottomNavigation) await expect(bottomNavigation).toBeHidden();

    await homeButton.click();
    await expect(root).toHaveAttribute('data-mobile-active-category', 'home');
    await expect(html).toHaveAttribute('data-mobile-member-home-surface', 'true');
    if (hasBottomNavigation) await expect(bottomNavigation).toBeVisible();

    await installDeterministicGameAction(page);
    const gameAction = page.locator('[data-p5-smoke-game="true"]');
    await expect(gameAction).toHaveAttribute('data-mobile-game-launch', 'canonical', { timeout: 15_000 });
    await expect(gameAction).toHaveAttribute('data-game-platform', 'mobile');
    await expect(gameAction).toBeVisible();

    const launchData = await gameAction.evaluate((element) => ({
      category: element.getAttribute('data-game-category') ?? '',
      game: element.getAttribute('data-game-id') ?? element.getAttribute('data-game-code') ?? '',
      provider: element.getAttribute('data-provider-code') ?? '',
    }));
    expect(launchData).toEqual({
      category: 'slot',
      game: 'p5-smoke-game',
      provider: 'p5-smoke-provider',
    });

    const launchRequestPromise = page.waitForRequest((request) => {
      if (!request.isNavigationRequest()) return false;
      try {
        return new URL(request.url()).pathname === '/games';
      } catch {
        return false;
      }
    }, { timeout: 30_000 });

    await gameAction.click();
    const launchRequest = await launchRequestPromise;
    const launchUrl = new URL(launchRequest.url());
    expect(launchUrl.searchParams.get('platform')).toBe('mobile');
    expect(launchUrl.searchParams.get('provider')).toBe('p5-smoke-provider');
    expect(launchUrl.searchParams.get('game')).toBe('p5-smoke-game');
    expect(launchUrl.searchParams.get('category')).toBe('slot');

    const evidenceDir = await prepareEvidenceDirectory(testInfo);
    await fs.writeFile(path.join(evidenceDir, 'p4-p6-interactions.json'), JSON.stringify({
      launchData,
      launchUrl: launchUrl.toString(),
    }, null, 2));
  });
});

async function installDeterministicGameAction(page: Page) {
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) throw new Error('Mobile Home root is unavailable');

    root.querySelector('[data-p5-smoke-game="true"]')?.remove();

    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = 'P5 smoke game';
    action.dataset.p5SmokeGame = 'true';
    action.dataset.gameId = 'p5-smoke-game';
    action.dataset.gameCode = 'p5-smoke-code';
    action.dataset.gameName = 'P5 smoke game';
    action.dataset.providerCode = 'p5-smoke-provider';
    action.dataset.gameCategory = 'slot';
    Object.assign(action.style, {
      display: 'block',
      width: '160px',
      minHeight: '44px',
      position: 'fixed',
      top: '120px',
      left: '16px',
      zIndex: '2147483500',
    });
    root.append(action);
  });
}

async function prepareEvidenceDirectory(testInfo: TestInfo) {
  const evidenceDir = path.resolve('artifacts/r013-visual/mobile-home-production', testInfo.project.name);
  await fs.mkdir(evidenceDir, { recursive: true });
  return evidenceDir;
}

async function readLayoutMetrics(page: Page): Promise<LayoutMetrics> {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    const header = document.querySelector<HTMLElement>('[data-mobile-section-owner="header"]');
    const rail = document.querySelector<HTMLElement>('[data-mobile-section-owner="category-menu"]');
    const rootRect = root?.getBoundingClientRect();
    const headerRect = header?.getBoundingClientRect();
    const railRect = rail?.getBoundingClientRect();
    const headerAncestors: AncestorMetric[] = [];

    let owner = header?.parentElement ?? null;
    while (owner) {
      const style = getComputedStyle(owner);
      headerAncestors.push({
        node: describeNode(owner),
        overflowX: style.overflowX,
        overflowY: style.overflowY,
        position: style.position,
        transform: style.transform,
        contain: style.contain,
        clientHeight: owner.clientHeight,
        scrollHeight: owner.scrollHeight,
      });
      owner = owner.parentElement;
    }

    return {
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      headerPosition: header ? getComputedStyle(header).position : '',
      headerTop: headerRect?.top ?? null,
      railPosition: rail ? getComputedStyle(rail).position : '',
      railTop: railRect?.top ?? null,
      rootLeft: rootRect?.left ?? null,
      rootRight: rootRect?.right ?? null,
      rootWidth: rootRect?.width ?? null,
      viewportWidth: window.innerWidth,
      windowScrollY: window.scrollY,
      scrollingElement: document.scrollingElement ? describeNode(document.scrollingElement) : '',
      headerAncestors,
    };

    function describeNode(element: Element) {
      const id = element.id ? `#${element.id}` : '';
      const classes = element instanceof HTMLElement && element.classList.length > 0
        ? `.${Array.from(element.classList).join('.')}`
        : '';
      const mobileOwner = element instanceof HTMLElement && element.dataset.mobileHomeRoot === 'true'
        ? '[data-mobile-home-root=true]'
        : '';
      const animationOwner = element instanceof HTMLElement && element.dataset.animationLevel
        ? `[data-animation-level=${element.dataset.animationLevel}]`
        : '';
      return `${element.tagName.toLowerCase()}${id}${classes}${mobileOwner}${animationOwner}`;
    }
  });
}

function expectHorizontalFit(metrics: LayoutMetrics) {
  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(metrics.documentClientWidth + 1);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.bodyClientWidth + 1);
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

function isLoopbackUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1';
  } catch {
    return false;
  }
}
