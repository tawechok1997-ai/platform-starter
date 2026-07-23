import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

const memberUrl = firstNonEmpty(process.env.MEMBER_WEB_URL);
const adminUrl = firstNonEmpty(process.env.ADMIN_WEB_URL);
const apiUrl = firstNonEmpty(process.env.API_URL);
const memberIdentity = firstNonEmpty(
  process.env.SEED_MEMBER_USERNAME,
  process.env.SEED_MEMBER_EMAIL,
  process.env.SEED_MEMBER_PHONE,
);
const memberPassword = firstNonEmpty(process.env.SEED_MEMBER_PASSWORD);
const adminIdentity = firstNonEmpty(process.env.SEED_ADMIN_USERNAME, process.env.SEED_ADMIN_EMAIL);
const adminPassword = firstNonEmpty(process.env.SEED_ADMIN_PASSWORD);
const requireMemberSmoke = process.env.REQUIRE_MEMBER_AUTHENTICATED_SMOKE === 'true';

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

async function attachAudit(testInfo: TestInfo, audit: RuntimeAudit, extra: Record<string, unknown>) {
  const payload = `${JSON.stringify({ ...audit, ...extra }, null, 2)}\n`;
  const outputPath = testInfo.outputPath('member-authenticated-production-audit.json');
  await writeFile(outputPath, payload, 'utf8');
  await testInfo.attach('member-authenticated-production-audit', {
    body: Buffer.from(payload),
    contentType: 'application/json',
  });
}

async function assertRuntimeHealth(page: Page, audit: RuntimeAudit) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyTextLength: document.body.innerText.trim().length,
    missingImages: Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt })),
  }));

  expect(metrics.bodyTextLength).toBeGreaterThan(100);
  expect(metrics.scrollWidth - metrics.clientWidth, 'Authenticated Home must not overflow horizontally').toBeLessThanOrEqual(2);
  expect(metrics.missingImages, 'Authenticated Home must not render broken images').toEqual([]);
  expect(audit.pageErrors, 'Authenticated Home must not raise page errors').toEqual([]);

  const criticalFailures = audit.failedRequests.filter((issue) =>
    ['document', 'script', 'stylesheet', 'font', 'image'].includes(issue.resourceType),
  );
  const criticalResponses = audit.badResponses.filter((issue) =>
    (issue.status ?? 0) >= 500 || ['document', 'script', 'stylesheet', 'font', 'image'].includes(issue.resourceType),
  );
  expect(criticalFailures, 'Authenticated Home must not have critical request failures').toEqual([]);
  expect(criticalResponses, 'Authenticated Home must not have critical HTTP errors').toEqual([]);
  return metrics;
}

test.describe('seeded authenticated visual artifacts', () => {
  test('member authenticated home', async ({ page }, testInfo) => {
    const missingMemberEnvironment = [
      !memberUrl && 'MEMBER_WEB_URL',
      !apiUrl && 'API_URL',
      !memberIdentity && 'member identity',
      !memberPassword && 'member password',
    ].filter(Boolean);
    if (missingMemberEnvironment.length > 0 && requireMemberSmoke) {
      throw new Error(`Authenticated Member smoke environment is incomplete: ${missingMemberEnvironment.join(', ')}`);
    }
    test.skip(missingMemberEnvironment.length > 0, 'seeded member credentials are required');

    const audit = installRuntimeAudit(page);
    const settings = await fetchPublicSettings(page);

    await login(page, memberUrl!, memberIdentity!, memberPassword!);
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
    const metrics = await assertRuntimeHealth(page, audit);
    await page.screenshot({ path: testInfo.outputPath('member-authenticated-home.png'), fullPage: true, animations: 'disabled' });
    await attachAudit(testInfo, audit, {
      finalUrl: page.url(),
      project: testInfo.project.name,
      expectedSiteName,
      gamesEnabled,
      showCategories,
      showPromotions,
      metrics,
    });
  });

  test('admin authenticated home', async ({ page }, testInfo) => {
    test.skip(!adminUrl || !adminIdentity || !adminPassword, 'seeded admin credentials are required');
    await login(page, adminUrl!, adminIdentity!, adminPassword!);
    await expect(page.locator('body')).toHaveScreenshot(`admin-home-${testInfo.project.name}.png`, { fullPage: true });
  });
});
