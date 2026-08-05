import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DESKTOP_PROJECTS = new Set(['1024x768', '1440x900']);
const DEFAULT_PIN_TOP = 124;

test('member home keeps the following jackpot sidebar right of the main feed', async ({ page }, testInfo) => {
  test.skip(
    !DESKTOP_PROJECTS.has(testInfo.project.name),
    'Desktop Home geometry only applies to desktop projects.',
  );

  await page.goto('http://127.0.0.1:3101/', { waitUntil: 'domcontentloaded' });
  const body = page.locator('.desktop-reference-home > .desktop-home__body');
  const main = page.locator('.desktop-reference-home .reference-main-column');
  const sidebar = page.locator('.desktop-reference-home .reference-sidebar');

  await expect(body).toBeVisible();
  await expect(main).toBeVisible();
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toHaveAttribute('data-home-sidebar-owner', 'runtime');
  await expect(sidebar).toHaveAttribute('data-scroll-state', /^(start|following)$/);

  const scrollTarget = await page.evaluate(({ defaultPinTop }) => {
    const bodyElement = document.querySelector<HTMLElement>('.desktop-reference-home > .desktop-home__body');
    const sidebarElement = document.querySelector<HTMLElement>('.desktop-reference-home .reference-sidebar');
    if (!bodyElement || !sidebarElement) return null;

    const bodyRect = bodyElement.getBoundingClientRect();
    const layoutWidth = bodyElement.offsetWidth;
    const scale = layoutWidth > 0 && bodyRect.width > 0 ? bodyRect.width / layoutWidth : 1;
    const configuredPinTop = Number.parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue('--member-desktop-sidebar-pin-top'),
    );
    const pinTop = Number.isFinite(configuredPinTop) && configuredPinTop > 0
      ? configuredPinTop
      : defaultPinTop;
    const maxTop = Math.max(0, bodyElement.scrollHeight - sidebarElement.offsetHeight);
    const desiredTop = Math.min(Math.max(2, maxTop / 2), Math.max(2, maxTop - 2));
    const bodyDocumentTop = bodyRect.top + window.scrollY;
    const targetY = Math.max(0, bodyDocumentTop - pinTop + desiredTop * scale);

    window.scrollTo({ top: targetY, behavior: 'auto' });
    return { maxTop, desiredTop, targetY };
  }, { defaultPinTop: DEFAULT_PIN_TOP });

  expect(scrollTarget).not.toBeNull();
  expect(scrollTarget?.maxTop).toBeGreaterThan(4);
  await expect(sidebar).toHaveAttribute('data-scroll-state', 'following');

  await expect.poll(async () => page.evaluate(() => {
    const bodyElement = document.querySelector<HTMLElement>('.desktop-reference-home > .desktop-home__body');
    const mainElement = document.querySelector<HTMLElement>('.desktop-reference-home .reference-main-column');
    const sidebarElement = document.querySelector<HTMLElement>('.desktop-reference-home .reference-sidebar');
    if (!bodyElement || !mainElement || !sidebarElement) return null;

    const bodyRect = bodyElement.getBoundingClientRect();
    const mainRect = mainElement.getBoundingClientRect();
    const sidebarRect = sidebarElement.getBoundingClientRect();

    return {
      bodyLeft: bodyRect.left,
      bodyRight: bodyRect.right,
      mainLeft: mainRect.left,
      mainRight: mainRect.right,
      mainWidth: mainRect.width,
      sidebarLeft: sidebarRect.left,
      sidebarRight: sidebarRect.right,
      sidebarWidth: sidebarRect.width,
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      scrollState: sidebarElement.dataset.scrollState,
    };
  })).not.toBeNull();

  const measured = await page.evaluate(() => {
    const bodyElement = document.querySelector<HTMLElement>('.desktop-reference-home > .desktop-home__body')!;
    const mainElement = document.querySelector<HTMLElement>('.desktop-reference-home .reference-main-column')!;
    const sidebarElement = document.querySelector<HTMLElement>('.desktop-reference-home .reference-sidebar')!;
    const bodyRect = bodyElement.getBoundingClientRect();
    const mainRect = mainElement.getBoundingClientRect();
    const sidebarRect = sidebarElement.getBoundingClientRect();

    return {
      bodyLeft: bodyRect.left,
      bodyRight: bodyRect.right,
      mainLeft: mainRect.left,
      mainRight: mainRect.right,
      mainWidth: mainRect.width,
      sidebarLeft: sidebarRect.left,
      sidebarRight: sidebarRect.right,
      sidebarWidth: sidebarRect.width,
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      scrollState: sidebarElement.dataset.scrollState,
    };
  });

  expect(measured.scrollState).toBe('following');
  expect(measured.sidebarWidth).toBeGreaterThan(180);
  expect(measured.mainWidth).toBeGreaterThan(measured.sidebarWidth);
  expect(Math.abs(measured.mainLeft - measured.bodyLeft)).toBeLessThanOrEqual(2);
  expect(measured.mainRight).toBeLessThanOrEqual(measured.sidebarLeft + 2);
  expect(Math.abs(measured.bodyRight - measured.sidebarRight)).toBeLessThanOrEqual(2);
  expect(measured.documentWidth - measured.viewportWidth).toBeLessThanOrEqual(2);

  const evidenceDir = path.resolve(
    'artifacts/r013-visual/runtime',
    testInfo.project.name,
    'member-home-sidebar-layout',
  );
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.screenshot({
    path: path.join(evidenceDir, 'page.png'),
    fullPage: false,
    animations: 'disabled',
  });
  await fs.writeFile(
    path.join(evidenceDir, 'geometry.json'),
    JSON.stringify({ scrollTarget, measured }, null, 2),
  );
});
