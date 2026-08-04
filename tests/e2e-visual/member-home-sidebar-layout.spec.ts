import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const DESKTOP_PROJECTS = new Set(['1024x768', '1440x900']);

test('member home keeps the fixed sidebar left of the main feed', async ({ page }, testInfo) => {
  test.skip(!DESKTOP_PROJECTS.has(testInfo.project.name), 'Desktop Home geometry only applies to desktop projects.');

  await page.goto('http://127.0.0.1:3101/', { waitUntil: 'domcontentloaded' });
  await page.locator('.desktop-reference-home > .desktop-home__body').waitFor({ state: 'visible' });
  await page.locator('.desktop-reference-home .reference-main-column').waitFor({ state: 'visible' });
  await page.locator('.desktop-reference-home .reference-sidebar[data-scroll-state="fixed"]').waitFor({ state: 'visible' });
  await page.locator('[data-desktop-sidebar-placeholder="true"]').waitFor({ state: 'attached' });

  await expect.poll(async () => page.evaluate(() => {
    const body = document.querySelector<HTMLElement>('.desktop-reference-home > .desktop-home__body');
    const main = document.querySelector<HTMLElement>('.desktop-reference-home .reference-main-column');
    const sidebar = document.querySelector<HTMLElement>('.desktop-reference-home .reference-sidebar');
    const placeholder = document.querySelector<HTMLElement>('[data-desktop-sidebar-placeholder="true"]');
    if (!body || !main || !sidebar || !placeholder) return null;

    const bodyRect = body.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    const placeholderRect = placeholder.getBoundingClientRect();

    return {
      bodyRight: bodyRect.right,
      mainLeft: mainRect.left,
      mainRight: mainRect.right,
      placeholderLeft: placeholderRect.left,
      placeholderRight: placeholderRect.right,
      placeholderWidth: placeholderRect.width,
      sidebarLeft: sidebarRect.left,
      sidebarRight: sidebarRect.right,
      sidebarWidth: sidebarRect.width,
    };
  })).not.toBeNull();

  const geometry = await page.evaluate(() => {
    const body = document.querySelector<HTMLElement>('.desktop-reference-home > .desktop-home__body')!;
    const main = document.querySelector<HTMLElement>('.desktop-reference-home .reference-main-column')!;
    const sidebar = document.querySelector<HTMLElement>('.desktop-reference-home .reference-sidebar')!;
    const placeholder = document.querySelector<HTMLElement>('[data-desktop-sidebar-placeholder="true"]')!;
    const bodyRect = body.getBoundingClientRect();
    const mainRect = main.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();
    const placeholderRect = placeholder.getBoundingClientRect();

    return {
      bodyRight: bodyRect.right,
      mainLeft: mainRect.left,
      mainRight: mainRect.right,
      placeholderLeft: placeholderRect.left,
      placeholderRight: placeholderRect.right,
      placeholderWidth: placeholderRect.width,
      sidebarLeft: sidebarRect.left,
      sidebarRight: sidebarRect.right,
      sidebarWidth: sidebarRect.width,
    };
  });

  // The 1455px source canvas is scaled on compact desktop windows. A 310px
  // source sidebar is approximately 218px at a physical 1024px viewport.
  expect(geometry.placeholderWidth).toBeGreaterThan(180);
  expect(Math.abs(geometry.sidebarLeft - geometry.placeholderLeft)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.sidebarWidth - geometry.placeholderWidth)).toBeLessThanOrEqual(2);
  expect(geometry.sidebarRight).toBeLessThanOrEqual(geometry.mainLeft + 2);
  expect(geometry.placeholderRight).toBeLessThanOrEqual(geometry.mainLeft + 2);
  expect(Math.abs(geometry.bodyRight - geometry.mainRight)).toBeLessThanOrEqual(2);

  const evidenceDir = path.resolve('artifacts/r013-visual/runtime', testInfo.project.name, 'member-home-layout');
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: path.join(evidenceDir, 'page.png'), fullPage: false, animations: 'disabled' });
  await fs.writeFile(path.join(evidenceDir, 'geometry.json'), JSON.stringify(geometry, null, 2));
});