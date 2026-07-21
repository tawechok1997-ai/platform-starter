import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import routeMatrix from './admin-critical-routes.json';

const VIEWPORTS = routeMatrix.viewports;
const PROTECTED_ROUTES = routeMatrix.protectedRoutes;
const REQUIRE_AUTHENTICATION = process.env.REQUIRE_AUTHENTICATION === 'true';

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

async function auditAccessibility(page: Page, route: string, testInfo: TestInfo) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    await testInfo.attach(`axe-${route.replaceAll('/', '-') || 'root'}.json`, {
      body: Buffer.from(JSON.stringify(results.violations, null, 2)),
      contentType: 'application/json',
    });
  }

  if (!REQUIRE_AUTHENTICATION) return;

  const seriousViolations = results.violations.filter((violation) =>
    violation.impact === 'critical' || violation.impact === 'serious',
  );

  expect(
    seriousViolations,
    `${route} has serious accessibility violations:\n${seriousViolations
      .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
      .join('\n')}`,
  ).toEqual([]);
}

async function assertPageHealth(page: Page, route: string, testInfo: TestInfo) {
  const response = await page.waitForResponse(
    (candidate) => candidate.request().isNavigationRequest() && candidate.frame() === page.mainFrame(),
    { timeout: 1_000 },
  ).catch(() => null);

  if (response) {
    expect(response.status(), `${route} returned ${response.status()}`).toBeLessThan(500);
  }

  await expect(page.locator('body')).not.toHaveText('', { timeout: 15_000 });
  await expect(page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')).toHaveCount(0);

  const metrics = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyTextLength: document.body.innerText.trim().length,
    title: document.title,
    mainCount: document.querySelectorAll('main, [role="main"]').length,
    h1Count: document.querySelectorAll('h1').length,
  }));

  expect(metrics.bodyTextLength, `${route} rendered no meaningful content`).toBeGreaterThan(10);
  expect(metrics.title.trim(), `${route} has no document title`).not.toBe('');

  if (REQUIRE_AUTHENTICATION) {
    expect(metrics.documentWidth, `${route} overflowed: ${metrics.documentWidth}px > ${metrics.viewportWidth}px`).toBeLessThanOrEqual(metrics.viewportWidth + 2);
    expect(metrics.mainCount, `${route} has no main landmark`).toBeGreaterThanOrEqual(1);
    expect(metrics.h1Count, `${route} must expose exactly one h1`).toBe(1);

    const unlabeledControls = await page.locator('input:not([type="hidden"]), select, textarea').evaluateAll((controls) =>
      controls
        .filter((control) => {
          const element = control as HTMLInputElement;
          if (element.disabled) return false;
          if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')) return false;
          const id = element.id;
          if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return false;
          return !element.closest('label');
        })
        .map((control) => control.outerHTML.slice(0, 240)),
    );
    expect(unlabeledControls, `${route} has unlabeled form controls:\n${unlabeledControls.join('\n')}`).toEqual([]);
  }

  await auditAccessibility(page, route, testInfo);
}

async function optionallySignIn(page: Page) {
  if (!REQUIRE_AUTHENTICATION) return false;

  const username = process.env.ADMIN_TEST_USERNAME;
  const password = process.env.ADMIN_TEST_PASSWORD;
  if (!username || !password) return false;

  await page.goto(routeMatrix.loginRoute, { waitUntil: 'domcontentloaded' });
  const usernameInput = page.locator('input[name="identifier"], input[name="username"], input[name="email"], input[type="email"], input[autocomplete="username"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

  await expect(usernameInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await usernameInput.fill(username);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"]').first().click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20_000 });
  return true;
}

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}: deployed admin remains healthy`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const runtime = collectRuntimeFailures(page);
    const authenticated = await optionallySignIn(page);

    if (REQUIRE_AUTHENTICATION) {
      expect(authenticated, 'Authenticated acceptance mode requires ADMIN_TEST_USERNAME and ADMIN_TEST_PASSWORD').toBe(true);
    }

    if (!authenticated) {
      await page.goto(routeMatrix.loginRoute, { waitUntil: 'domcontentloaded' });
      await assertPageHealth(page, routeMatrix.loginRoute, testInfo);
      await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-login.png`), fullPage: true });
    }

    for (const route of PROTECTED_ROUTES) {
      await test.step(route, async () => {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        const currentPath = new URL(page.url()).pathname;

        if (authenticated) {
          expect(currentPath, `${route} returned to login after authentication`).not.toBe(routeMatrix.loginRoute);
          await assertPageHealth(page, route, testInfo);
          await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-${route.slice(1).replaceAll('/', '-')}.png`), fullPage: true });
        } else {
          expect(currentPath, `${route} did not redirect to login`).toBe(routeMatrix.loginRoute);
          await assertPageHealth(page, routeMatrix.loginRoute, testInfo);
        }
      });
    }

    const ignoredConsolePatterns = [/favicon/i, /Failed to load resource.*404/i, /ResizeObserver loop/i];
    const meaningfulConsoleErrors = runtime.consoleErrors.filter((message) => !ignoredConsolePatterns.some((pattern) => pattern.test(message)));
    const meaningfulRequestFailures = runtime.failedRequests.filter((message) => !/favicon|analytics|telemetry|browser-intake/i.test(message));

    expect(runtime.pageErrors, `page errors:\n${runtime.pageErrors.join('\n')}`).toEqual([]);

    if (REQUIRE_AUTHENTICATION) {
      expect(meaningfulConsoleErrors, `console errors:\n${meaningfulConsoleErrors.join('\n')}`).toEqual([]);
      expect(meaningfulRequestFailures, `failed requests:\n${meaningfulRequestFailures.join('\n')}`).toEqual([]);
    } else {
      if (meaningfulConsoleErrors.length > 0) {
        await testInfo.attach('public-smoke-console-errors.txt', {
          body: Buffer.from(meaningfulConsoleErrors.join('\n')),
          contentType: 'text/plain',
        });
      }
      if (meaningfulRequestFailures.length > 0) {
        await testInfo.attach('public-smoke-request-failures.txt', {
          body: Buffer.from(meaningfulRequestFailures.join('\n')),
          contentType: 'text/plain',
        });
      }
    }
  });
}
