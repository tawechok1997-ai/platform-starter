import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const memberBaseUrl = (process.env.MEMBER_BASE_URL || 'https://platformweb-member-production.up.railway.app').replace(/\/$/, '');
const referenceBaseUrl = (process.env.REFERENCE_BASE_URL || 'https://noah345.shop').replace(/\/$/, '');
const evidenceRoot = path.resolve('artifacts/production-member-acceptance/evidence');

const routes = [
  { name: 'home', path: '/', kind: 'home' },
  { name: 'login', path: '/login', kind: 'login' },
  { name: 'register', path: '/register', kind: 'register' },
] as const;

type SurfaceKind = (typeof routes)[number]['kind'];

type NetworkProblem = {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  error?: string;
};

type PageAudit = {
  site: 'member' | 'reference';
  surface: string;
  requestedUrl: string;
  finalUrl?: string;
  status?: number;
  title?: string;
  viewport: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: NetworkProblem[];
  badResponses: NetworkProblem[];
  metrics?: {
    bodyTextLength: number;
    clientWidth: number;
    scrollWidth: number;
    horizontalOverflow: number;
    inputs: number;
    buttons: number;
    links: number;
    headings: string[];
    missingImages: Array<{ src: string; alt: string }>;
  };
  navigationError?: string;
};

function safeName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

function isIgnoredNetworkUrl(url: string) {
  return [
    'google-analytics.com',
    'googletagmanager.com',
    'connect.facebook.net',
    'facebook.com/tr',
    '/favicon.ico',
    'chrome-extension://',
  ].some((fragment) => url.includes(fragment));
}

function installAudit(page: Page, audit: PageAudit) {
  page.on('console', (message) => {
    if (message.type() === 'error') audit.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => audit.pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    if (isIgnoredNetworkUrl(request.url())) return;
    audit.failedRequests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      error: request.failure()?.errorText,
    });
  });
  page.on('response', (response) => {
    if (response.status() < 400 || isIgnoredNetworkUrl(response.url())) return;
    const request = response.request();
    audit.badResponses.push({
      url: response.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      status: response.status(),
    });
  });
}

async function loadLazyContent(page: Page) {
  await page.evaluate(async () => {
    const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    const step = Math.max(window.innerHeight * 0.8, 500);
    const maximum = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    for (let position = 0; position < maximum; position += step) {
      window.scrollTo(0, position);
      await sleep(80);
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

async function collectMetrics(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const bodyText = document.body?.innerText || '';
    return {
      bodyTextLength: bodyText.trim().length,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
      inputs: document.querySelectorAll('input').length,
      buttons: document.querySelectorAll('button').length,
      links: document.querySelectorAll('a').length,
      headings: Array.from(document.querySelectorAll('h1, h2'))
        .map((element) => element.textContent?.trim() || '')
        .filter(Boolean)
        .slice(0, 12),
      missingImages: Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt }))
        .slice(0, 30),
    };
  });
}

function writeAudit(audit: PageAudit, testInfo: TestInfo) {
  const directory = path.join(evidenceRoot, safeName(testInfo.project.name));
  mkdirSync(directory, { recursive: true });
  const filename = `${safeName(audit.site)}-${safeName(audit.surface)}.json`;
  const json = `${JSON.stringify(audit, null, 2)}\n`;
  writeFileSync(path.join(directory, filename), json);
  return testInfo.attach(`${audit.site}-${audit.surface}-audit`, {
    body: Buffer.from(json),
    contentType: 'application/json',
  });
}

async function captureSurface(
  page: Page,
  testInfo: TestInfo,
  site: PageAudit['site'],
  baseUrl: string,
  surface: { name: string; path: string; kind: SurfaceKind },
  strict: boolean,
) {
  const requestedUrl = new URL(surface.path, `${baseUrl}/`).toString();
  const audit: PageAudit = {
    site,
    surface: surface.name,
    requestedUrl,
    viewport: testInfo.project.name,
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
  };
  installAudit(page, audit);

  try {
    const response = await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => undefined);
    await loadLazyContent(page);
    audit.status = response?.status();
    audit.finalUrl = page.url();
    audit.title = await page.title();
    audit.metrics = await collectMetrics(page);

    const screenshotDirectory = path.join(evidenceRoot, safeName(testInfo.project.name));
    mkdirSync(screenshotDirectory, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDirectory, `${safeName(site)}-${safeName(surface.name)}.png`),
      fullPage: true,
      animations: 'disabled',
    });
  } catch (error) {
    audit.navigationError = error instanceof Error ? error.message : String(error);
  } finally {
    await writeAudit(audit, testInfo);
  }

  if (!strict) return;

  expect(audit.navigationError, `Unable to open ${requestedUrl}`).toBeUndefined();
  expect(audit.status, `Unexpected document status for ${requestedUrl}`).toBeLessThan(400);
  expect(audit.metrics?.bodyTextLength || 0, `Empty body for ${requestedUrl}`).toBeGreaterThan(20);
  expect(audit.metrics?.horizontalOverflow || 0, `Horizontal overflow on ${requestedUrl}`).toBeLessThanOrEqual(2);
  expect(audit.pageErrors, `Page errors on ${requestedUrl}`).toEqual([]);

  const criticalFailures = audit.failedRequests.filter((problem) =>
    ['document', 'script', 'stylesheet', 'font', 'image'].includes(problem.resourceType),
  );
  const criticalBadResponses = audit.badResponses.filter((problem) =>
    ['document', 'script', 'stylesheet', 'font', 'image'].includes(problem.resourceType),
  );
  expect(criticalFailures, `Critical request failures on ${requestedUrl}`).toEqual([]);
  expect(criticalBadResponses, `Critical HTTP responses on ${requestedUrl}`).toEqual([]);
  expect(audit.metrics?.missingImages || [], `Broken rendered images on ${requestedUrl}`).toEqual([]);

  if (surface.kind === 'login') {
    await expect(page.locator('input[type="password"]')).toHaveCount(1);
    expect(audit.metrics?.inputs || 0).toBeGreaterThanOrEqual(2);
  }
  if (surface.kind === 'register') {
    expect(await page.locator('input[type="password"]').count()).toBeGreaterThanOrEqual(1);
    expect(audit.metrics?.inputs || 0).toBeGreaterThanOrEqual(3);
  }
}

for (const surface of routes) {
  test(`deployed Member ${surface.name} is visually and operationally healthy`, async ({ page }, testInfo) => {
    await captureSurface(page, testInfo, 'member', memberBaseUrl, surface, true);
  });

  test(`capture reference ${surface.name} for visual sign-off`, async ({ page }, testInfo) => {
    await captureSurface(page, testInfo, 'reference', referenceBaseUrl, surface, false);
  });
}
