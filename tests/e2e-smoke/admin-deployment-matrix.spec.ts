import { expect, test, type Page } from '@playwright/test';
import routeMatrix from './admin-critical-routes.json';

const VIEWPORTS = routeMatrix.viewports;
const LOGIN_ROUTE = routeMatrix.loginRoute;
const PROTECTED_ROUTES = routeMatrix.protectedRoutes;

function collectRuntimeFailures(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'unknown error';
    if (request.url().startsWith('data:')) return;
    if (/ERR_ABORTED|NS_BINDING_ABORTED/i.test(failure)) return;
    failedRequests.push(`${request.method()} ${request.url()} :: ${failure}`);
  });

  return { consoleErrors, pageErrors, failedRequests };
}

async function assertPageHealth(page: Page, route: string) {
  await expect(page.locator('body')).not.toHaveText('', { timeout: 15_000 });
  await expect(page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')).toHaveCount(0);

  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyTextLength: document.body.innerText.trim().length,
    title: document.title,
  }));

  expect(metrics.bodyTextLength, `${route} rendered no meaningful content`).toBeGreaterThan(10);
  expect(metrics.title.trim(), `${route} has no document title`).not.toBe('');
  expect(metrics.documentWidth, `${route} overflowed: ${metrics.documentWidth}px > ${metrics.viewportWidth}px`).toBeLessThanOrEqual(metrics.viewportWidth + 2);
}

async function optionallySignIn(page: Page) {
  const username = process.env.ADMIN_TEST_USERNAME;
  const password = process.env.ADMIN_TEST_PASSWORD;
  if (!username || !password) return false;

  await page.goto(LOGIN_ROUTE, { waitUntil: 'domcontentloaded' });
  const usernameInput = page.locator('input[name="identifier"], input[name="username"], input[name="email"], input[type="email"], input[autocomplete="username"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await usernameInput.fill(username);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"]').first().click();
  await expect(page).not.toHaveURL(new RegExp(`${LOGIN_ROUTE.replace('/', '\\/')}(?:\\?|$)`), { timeout: 20_000 });
  return true;
}

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}: deployed admin remains healthy`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const runtime = collectRuntimeFailures(page);
    const authenticated = await optionallySignIn(page);

    if (!authenticated) {
      await page.goto(LOGIN_ROUTE, { waitUntil: 'domcontentloaded' });
      await assertPageHealth(page, LOGIN_ROUTE);
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-login.png`), fullPage: true });
    }

    for (const route of PROTECTED_ROUTES) {
      await test.step(route, async () => {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await assertPageHealth(page, route);
        const currentPath = new URL(page.url()).pathname;

        if (authenticated) {
          expect(currentPath, `${route} returned to login after authentication`).not.toBe(LOGIN_ROUTE);
          await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-${route.slice(1).replaceAll('/', '-')}.png`), fullPage: true });
        } else {
          expect(currentPath, `${route} did not redirect to login`).toBe(LOGIN_ROUTE);
        }
      });
    }

    const ignoredConsolePatterns = [/favicon/i, /Failed to load resource.*404/i, /ResizeObserver loop/i];
    const meaningfulConsoleErrors = runtime.consoleErrors.filter((message) => !ignoredConsolePatterns.some((pattern) => pattern.test(message)));
    const meaningfulRequestFailures = runtime.failedRequests.filter((message) => !/favicon|analytics|telemetry|browser-intake/i.test(message));

    expect(runtime.pageErrors, `page errors:\n${runtime.pageErrors.join('\n')}`).toEqual([]);
    expect(meaningfulConsoleErrors, `console errors:\n${meaningfulConsoleErrors.join('\n')}`).toEqual([]);
    expect(meaningfulRequestFailures, `failed requests:\n${meaningfulRequestFailures.join('\n')}`).toEqual([]);
  });
}
