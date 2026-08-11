import { expect, test, type Locator, type Page } from '@playwright/test';

const BASE_URL = process.env.MEMBER_HOME_URL ?? 'http://127.0.0.1:3101/';
const DESKTOP_AUDIT_VIEWPORTS = [
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

test.describe('Member auth lifecycle regression', () => {
  test('refresh never exposes a blank auth iframe on Mobile or Desktop', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== '390x844' && testInfo.project.name !== '1024x768',
      'Run the hard-refresh regression at one phone and one desktop viewport',
    );
    test.setTimeout(90_000);

    await installBlankFrameProbe(page);
    const target = new URL('/?auth=login&authRequest=refresh-regression', BASE_URL).toString();
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await assertRenderedAuthFrame(page);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45_000 });
    await assertRenderedAuthFrame(page);

    const blankExposureCount = await page.evaluate(() => (
      (window as Window & { __memberAuthBlankExposureCount?: number }).__memberAuthBlankExposureCount ?? 0
    ));
    expect(blankExposureCount, 'No exposed auth iframe may be visible before its real dialog exists').toBe(0);

    // Exercise the real embedded Escape bridge once per reference viewport.
    await closeAuth(page, 'escape');
    await assertReleased(page);
  });

  test('Mobile handles twenty Login/Register auth requests without stale input ownership', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Run the lifecycle loop once at the reference phone viewport');
    test.setTimeout(120_000);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.locator('body').waitFor({ state: 'visible' });
    await waitForAuthOwner(page, 'mobile');

    for (let index = 0; index < 20; index += 1) {
      await openAuth(page, 'login', `mobile-login-${index}`);
      await closeAuth(page, 'backdrop');
      await assertReleased(page);

      // Open the opposite mode immediately. There is deliberately no courtesy
      // pause here: the previous overlay must release input ownership before
      // the next canonical auth request arrives.
      await openAuth(page, 'register', `mobile-register-${index}`);
      await closeAuth(page, 'backdrop');
      await assertReleased(page);
    }
  });

  for (const viewport of DESKTOP_AUDIT_VIEWPORTS) {
    test(`Desktop ${viewport.width}px handles twenty auth lifecycles without stale input ownership`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== '1024x768', 'One desktop project drives each required audit width');
      test.setTimeout(150_000);

      await page.setViewportSize(viewport);
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.locator('body').waitFor({ state: 'visible' });
      await waitForAuthOwner(page, `desktop-${viewport.width}`);

      for (let index = 0; index < 20; index += 1) {
        const mode = index % 2 === 0 ? 'login' : 'register';
        await openAuth(page, mode, `desktop-${viewport.width}-${index}`);
        await closeAuth(page, 'backdrop');
        await assertReleased(page);
      }
    });
  }
});

async function installBlankFrameProbe(page: Page) {
  await page.addInitScript(() => {
    if (window.top !== window) return;
    const root = window as Window & { __memberAuthBlankExposureCount?: number };
    root.__memberAuthBlankExposureCount = 0;

    const sample = () => {
      const overlay = document.querySelector<HTMLElement>('.member-auth-overlay');
      const frames = overlay?.querySelectorAll<HTMLIFrameElement>('iframe.member-auth-overlay__frame') ?? [];
      for (const frame of frames) {
        const style = getComputedStyle(frame);
        const exposed = style.visibility !== 'hidden'
          && style.display !== 'none'
          && Number.parseFloat(style.opacity || '0') > 0.01;
        const dialog = frame.contentDocument?.querySelector(
          '[data-embedded="true"] [role="dialog"], [data-embedded="true"] .source-login-modal, [data-embedded="true"] .source-register-modal',
        );
        if (exposed && !dialog) {
          root.__memberAuthBlankExposureCount = (root.__memberAuthBlankExposureCount ?? 0) + 1;
        }
      }
      window.requestAnimationFrame(sample);
    };

    window.requestAnimationFrame(sample);
  });
}

async function assertRenderedAuthFrame(page: Page) {
  const overlay = page.locator('.member-auth-overlay');
  await expect(overlay).toBeVisible({ timeout: 15_000 });
  await expect(overlay).toHaveAttribute('data-frame-ready', 'true', { timeout: 15_000 });
  await assertPreloadedFrameOwnership(overlay, undefined, true);

  const frame = page.frameLocator(
    'iframe.member-auth-overlay__frame[data-auth-frame-active="true"]',
  );
  await expect(frame.locator(
    '[data-embedded="true"] [role="dialog"], [data-embedded="true"] .source-login-modal, [data-embedded="true"] .source-register-modal',
  ).first()).toBeVisible({ timeout: 15_000 });
}

async function waitForAuthOwner(page: Page, scope: string) {
  const requestId = `readiness-${scope}-${Date.now().toString(36)}`;
  const overlay = page.locator(`.member-auth-overlay[data-auth-request-id="${requestId}"]`);

  for (let attempt = 0; attempt < 40; attempt += 1) {
    await dispatchAuthRequest(page, 'login', requestId);
    if (await overlay.isVisible().catch(() => false)) {
      await closeAuth(page, 'backdrop');
      await assertReleased(page);
      return;
    }
    await page.waitForTimeout(50);
  }

  await expect(
    overlay,
    `Member auth owner never accepted the readiness request for ${scope}`,
  ).toBeVisible({ timeout: 2_000 });
}

async function openAuth(page: Page, mode: 'login' | 'register', requestId: string) {
  await dispatchAuthRequest(page, mode, requestId);

  const overlay = page.locator(`.member-auth-overlay[data-auth-request-id="${requestId}"]`);
  await expect(overlay).toBeVisible({ timeout: 10_000 });
  await expect(overlay).toHaveAttribute('data-state', /opening|open/);
  await assertPreloadedFrameOwnership(overlay, mode, false);
}

async function assertPreloadedFrameOwnership(
  overlay: Locator,
  expectedMode?: 'login' | 'register',
  requireRenderedActive = false,
) {
  const frames = overlay.locator('iframe.member-auth-overlay__frame');
  const activeFrame = overlay.locator(
    'iframe.member-auth-overlay__frame[data-auth-frame-active="true"]',
  );
  const inactiveFrame = overlay.locator(
    'iframe.member-auth-overlay__frame[data-auth-frame-active="false"]',
  );

  await expect(frames).toHaveCount(2);
  await expect(activeFrame).toHaveCount(1);
  await expect(inactiveFrame).toHaveCount(1);
  await expect(inactiveFrame).toHaveAttribute('aria-hidden', 'true');
  await expect(inactiveFrame).toHaveCSS('pointer-events', 'none');
  if (requireRenderedActive) await expect(activeFrame).toBeVisible();
  if (expectedMode) await expect(activeFrame).toHaveAttribute('data-auth-frame-mode', expectedMode);
}

async function dispatchAuthRequest(page: Page, mode: 'login' | 'register', requestId: string) {
  await page.evaluate(({ requestedMode, id }) => {
    window.dispatchEvent(new CustomEvent('member:auth-open', {
      detail: { mode: requestedMode, requestId: id },
    }));
  }, { requestedMode: mode, id: requestId });
}

async function closeAuth(page: Page, method: 'escape' | 'backdrop') {
  const overlay = page.locator('.member-auth-overlay');
  await expect(overlay).toBeVisible();

  if (method === 'escape') {
    const activeFrame = page.frameLocator(
      'iframe.member-auth-overlay__frame[data-auth-frame-active="true"]',
    );
    await activeFrame.locator('body').waitFor({ state: 'attached', timeout: 10_000 });
    await activeFrame.locator('body').focus();
    await page.keyboard.press('Escape');
  } else {
    // P7 separately verifies real pointer hit geometry. The stress loop needs
    // the backdrop close handler itself so iframe hit-testing cannot turn a
    // cleanup test into a multi-minute click retry benchmark.
    await overlay.locator('.member-auth-overlay__backdrop').evaluate((backdrop) => backdrop.click());
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
