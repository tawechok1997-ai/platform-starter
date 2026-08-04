import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const MEMBER_HOME_URL = process.env.MEMBER_HOME_URL
  ?? 'https://platformweb-member-production.up.railway.app/';

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
    expectHorizontalFit(stickyMetrics);
    expect(stickyMetrics.headerPosition).toBe('sticky');
    expect(stickyMetrics.headerTop ?? 999).toBeGreaterThanOrEqual(-1);
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
    ));
    expect(pageErrors, `Page errors: ${JSON.stringify(pageErrors)}`).toEqual([]);
    expect(relevantConsoleErrors, `Console errors: ${JSON.stringify(relevantConsoleErrors)}`).toEqual([]);

    await fs.writeFile(path.join(evidenceDir, 'metrics.json'), JSON.stringify({
      top: topMetrics,
      sticky: stickyMetrics,
      category: categoryMetrics,
    }, null, 2));
    await fs.writeFile(path.join(evidenceDir, 'console.json'), JSON.stringify(consoleRecords, null, 2));
    await fs.writeFile(path.join(evidenceDir, 'page-errors.json'), JSON.stringify(pageErrors, null, 2));
    await fs.writeFile(path.join(evidenceDir, 'failed-requests.json'), JSON.stringify(failedRequests, null, 2));
  });
});

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
    };
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
