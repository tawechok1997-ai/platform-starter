import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.MEMBER_HOME_URL ?? 'http://127.0.0.1:3101/';
const LOGIN_NAME = /เข้าสู่ระบบ|ล็อกอิน|log in|login/i;
const REGISTER_NAME = /สมัครสมาชิก|ลงทะเบียน|register|sign up/i;

test.describe('Member auth lifecycle regression', () => {
  test('Mobile opens and closes Login/Register twenty times without a click blocker', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the lifecycle loop once at the reference phone viewport');
    test.setTimeout(180_000);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.locator('body').waitFor({ state: 'visible' });

    for (let index = 0; index < 20; index += 1) {
      await openAuth(page, 'login', `mobile-login-${index}`);
      await closeAuth(page, index % 2 === 0 ? 'escape' : 'message');
      await assertReleased(page);

      // Open the opposite mode immediately. There is deliberately no 180 ms
      // courtesy pause here; the old implementation required one and therefore
      // ate the next human click like a tiny invisible bureaucrat.
      await openAuth(page, 'register', `mobile-register-${index}`);
      await closeAuth(page, index % 2 === 0 ? 'message' : 'escape');
      await assertReleased(page);
    }
  });

  test('Desktop repeats the same lifecycle at every required audit width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '1024x768', 'One project drives all required desktop widths');
    test.setTimeout(300_000);

    for (const viewport of [
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.locator('body').waitFor({ state: 'visible' });

      for (let index = 0; index < 20; index += 1) {
        const mode = index % 2 === 0 ? 'login' : 'register';
        await openAuth(page, mode, `desktop-${viewport.width}-${index}`);
        await closeAuth(page, index % 3 === 0 ? 'message' : 'escape');
        await assertReleased(page);
      }
    }
  });
});

async function openAuth(page: Page, mode: 'login' | 'register', requestId: string) {
  const accessibleName = mode === 'login' ? LOGIN_NAME : REGISTER_NAME;
  const visibleControl = page.getByRole('button', { name: accessibleName }).filter({ visible: true }).first();

  if (await visibleControl.count()) {
    await visibleControl.click({ timeout: 5_000 }).catch(async () => {
      await dispatchAuthRequest(page, mode, requestId);
    });
  } else {
    await dispatchAuthRequest(page, mode, requestId);
  }

  const overlay = page.locator('.member-auth-overlay');
  await expect(overlay).toBeVisible({ timeout: 10_000 });
  await expect(overlay).toHaveAttribute('data-state', /opening|open/);
  await expect(overlay.locator('iframe.member-auth-overlay__frame')).toHaveCount(1);
}

async function dispatchAuthRequest(page: Page, mode: 'login' | 'register', requestId: string) {
  await page.evaluate(({ requestedMode, id }) => {
    window.dispatchEvent(new CustomEvent('member:auth-open', {
      detail: { mode: requestedMode, requestId: id },
    }));
  }, { requestedMode: mode, id: requestId });
}

async function closeAuth(page: Page, method: 'escape' | 'message') {
  const overlay = page.locator('.member-auth-overlay');
  await expect(overlay).toBeVisible();

  if (method === 'escape') {
    await page.keyboard.press('Escape');
  } else {
    const frame = page.frameLocator('iframe.member-auth-overlay__frame');
    await frame.locator('body').waitFor({ state: 'attached', timeout: 10_000 });
    await frame.locator('body').evaluate(() => {
      window.parent.postMessage({ type: 'member-auth-close' }, window.location.origin);
    });
  }

  await expect(overlay).toHaveCount(0, { timeout: 2_000 });
}

async function assertReleased(page: Page) {
  const state = await page.evaluate(() => ({
    overlayCount: document.querySelectorAll('.member-auth-overlay').length,
    activeOverlayCount: document.querySelectorAll('[data-member-active-overlay="true"]').length,
    rootOverlayFlag: document.documentElement.hasAttribute('data-member-overlay-open'),
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
  }));

  expect(state.overlayCount).toBe(0);
  expect(state.activeOverlayCount).toBe(0);
  expect(state.rootOverlayFlag).toBe(false);
  expect(state.bodyOverflow).not.toBe('hidden');
  expect(state.htmlOverflow).not.toBe('hidden');
}
