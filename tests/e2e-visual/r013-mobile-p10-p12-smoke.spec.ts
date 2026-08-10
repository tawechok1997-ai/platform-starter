import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.MEMBER_HOME_URL ?? 'http://127.0.0.1:3101/';

const PUBLIC_ROUTE_MATRIX = [
  '/',
  '/browse/games',
  '/guide',
  '/mobile/member/promotions',
  '/mobile/member/vip',
] as const;

test.describe('Mobile P10-P12 localization, accessibility, and final QA', () => {
  test.skip(({ viewport }) => !viewport || viewport.width > 430, 'Mobile viewport only');

  test('P10 locale toggle updates document language and persists on every mobile viewport', async ({ page }) => {
    await openRoute(page, '/');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-mobile-p10-p12-ready', 'true', { timeout: 20_000 });
    await expect(html).toHaveAttribute('lang', 'th');

    const menuButton = page.locator('button[aria-controls="mobile-home-drawer"]');
    const languageButton = page.locator('button[aria-label="เปลี่ยนภาษา"], button[aria-label="Change language"]').first();
    await expectMinimumTarget(menuButton, 44);
    await expectMinimumTarget(languageButton, 44);

    await languageButton.click();
    await expect(html).toHaveAttribute('lang', 'en');
    await expect(html).toHaveAttribute('data-mobile-p10-p12-locale', 'en');
    expect(await page.evaluate(() => localStorage.getItem('member_locale'))).toBe('en');
    await expect(page.locator('#member-mobile-p10-p12-status')).toContainText('Language changed to English');

    await page.locator('button[aria-label="Change language"]').first().click();
    await expect(html).toHaveAttribute('lang', 'th');
    expect(await page.evaluate(() => localStorage.getItem('member_locale'))).toBe('th');
    await expectHorizontalFit(page);
  });

  test('P11 drawer exposes dialog semantics, closes with Escape, and restores focus', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the interaction contract once');
    await openRoute(page, '/');

    const trigger = page.locator('button[aria-controls="mobile-home-drawer"]');
    const drawer = page.locator('#mobile-home-drawer');
    await trigger.focus();
    await trigger.click();

    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden({ timeout: 10_000 });
    await expect(trigger).toBeFocused({ timeout: 10_000 });
  });

  test('P11 names login and register controls without changing auth requests', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the auth contract once');
    const mutationRequests: string[] = [];
    page.on('request', (request) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        mutationRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    for (const mode of ['login', 'register'] as const) {
      await openRoute(page, `/?auth=${mode}`);
      const overlay = page.locator('.member-auth-overlay');
      await expect(overlay).toBeVisible({ timeout: 20_000 });
      await expect.poll(async () => unnamedVisibleControls(page, '.member-auth-overlay')).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(overlay).toBeHidden({ timeout: 10_000 });
    }

    expect(mutationRequests).toEqual([]);
  });

  test('P11 keyboard-enables scroll owners and hides unsupported locale options', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the keyboard and language fixture once');
    await openRoute(page, '/');

    const tablist = page.locator('[data-mobile-section-owner="highlight-tabs"]');
    await expect(tablist).toHaveAttribute('data-mobile-keyboard-scroll', 'true');
    await expect(tablist).toHaveAttribute('tabindex', '0');
    await tablist.focus();
    await page.keyboard.press('ArrowRight');

    await page.evaluate(() => {
      const dialog = document.createElement('div');
      dialog.id = 'p10-language-fixture';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-label', 'Change language');
      dialog.innerHTML = [
        '<button type="button" data-language="th">Thai</button>',
        '<button type="button" data-language="en">English</button>',
        '<button type="button" data-language="tagalog">Tagalog</button>',
        '<button type="button" data-language="chinese">Chinese</button>',
      ].join('');
      document.body.append(dialog);
    });

    const fixture = page.locator('#p10-language-fixture');
    await expect(fixture.locator('[data-language="th"]')).toBeVisible();
    await expect(fixture.locator('[data-language="en"]')).toBeVisible();
    await expect(fixture.locator('[data-language="tagalog"]')).toBeHidden();
    await expect(fixture.locator('[data-language="chinese"]')).toBeHidden();
  });

  test('P12 public route matrix stays named, viewport-safe, and free from prohibited VIP ARIA', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the route matrix once');
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const routePath of PUBLIC_ROUTE_MATRIX) {
      await openRoute(page, routePath);
      await expect(page.locator('html')).toHaveAttribute('data-mobile-p10-p12-ready', 'true', { timeout: 20_000 });
      await expect.poll(async () => unnamedVisibleControls(page)).toEqual([]);
      await expectHorizontalFit(page);

      const visibleBackButtons = page.locator('button[aria-label*="ย้อนกลับ"]:visible, button[aria-label="Back"]:visible');
      for (let index = 0; index < await visibleBackButtons.count(); index += 1) {
        await expectMinimumTarget(visibleBackButtons.nth(index), 44);
      }
    }

    await page.evaluate(() => {
      const sectionLock = document.createElement('section');
      sectionLock.className = 'sectionLock p11-aria-fixture';
      sectionLock.setAttribute('aria-selected', 'true');
      sectionLock.setAttribute('aria-pressed', 'false');
      document.body.append(sectionLock);
    });
    const fixture = page.locator('.p11-aria-fixture');
    await expect(fixture).not.toHaveAttribute('aria-selected');
    await expect(fixture).not.toHaveAttribute('aria-pressed');
    expect(pageErrors).toEqual([]);
  });
});

async function openRoute(page: Page, pathname: string) {
  const response = await page.goto(new URL(pathname, BASE_URL).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  expect(response?.status() ?? 200).toBeLessThan(400);
  await expect(page.locator('body')).toBeAttached({ timeout: 20_000 });
  await expect(page.locator('main:visible, [role="dialog"]:visible').first()).toBeVisible({ timeout: 20_000 });
}

async function unnamedVisibleControls(page: Page, scope = 'body') {
  return page.locator(`${scope} input:visible, ${scope} select:visible, ${scope} textarea:visible`).evaluateAll((controls) => controls
    .filter((control) => {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return false;
      if (control instanceof HTMLInputElement && ['hidden', 'button', 'submit', 'reset', 'image'].includes(control.type)) return false;
      if (control.hasAttribute('aria-label') || control.hasAttribute('aria-labelledby')) return false;
      if (control.closest('label')) return false;
      if (control.id && document.querySelector(`label[for="${CSS.escape(control.id)}"]`)) return false;
      return true;
    })
    .map((control) => ({
      tag: control.tagName,
      id: control.id,
      name: control.getAttribute('name'),
      type: control.getAttribute('type'),
      placeholder: control.getAttribute('placeholder'),
    })));
}

async function expectMinimumTarget(locator: import('@playwright/test').Locator, minimum: number) {
  await expect(locator).toBeVisible({ timeout: 20_000 });
  const box = await locator.boundingBox();
  expect(box, 'Expected a visible target box').not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(minimum);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(minimum);
}

async function expectHorizontalFit(page: Page) {
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
