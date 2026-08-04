import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DESKTOP_PROJECTS = new Set(['1024x768', '1440x900']);

test('member home keeps the following sidebar left of the main feed', async ({ page }, testInfo) => {
  test.skip(
    !DESKTOP_PROJECTS.has(testInfo.project.name),
    'Desktop Home geometry only applies to desktop projects.',
  );

  await page.goto('http://127.0.0.1:3101/', { waitUntil: 'domcontentloaded' });
  const body = page.locator('.desktop-reference-home > .desktop-home__body');
  const main = page.locator('.desktop-reference-home .reference-main-column');
  const sidebar = page.locator('.desktop-reference-home .reference-sidebar[data-scroll-state="following"]');

  await expect(body).toBeVisible();
  await expect(main).toBeVisible();
  await expect(sidebar).toBeVisible();

  const geometry = await expect.poll(async () => page.evaluate(() => {
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
    };
  });

  expect(measured.sidebarWidth).toBeGreaterThan(180);
  expect(measured.mainWidth).toBeGreaterThan(measured.sidebarWidth);
  expect(Math.abs(measured.sidebarLeft - measured.bodyLeft)).toBeLessThanOrEqual(2);
  expect(measured.sidebarRight).toBeLessThanOrEqual(measured.mainLeft + 2);
  expect(Math.abs(measured.bodyRight - measured.mainRight)).toBeLessThanOrEqual(2);
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
    JSON.stringify(measured, null, 2),
  );
});
