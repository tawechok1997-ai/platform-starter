import { expect, test, type Page, type Route } from '@playwright/test';

const BASE_URL = process.env.MEMBER_HOME_URL ?? 'http://127.0.0.1:3000/';

test('Theme & layout settings change live Member tokens and desktop ownership', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== '1440x900', 'Theme propagation runs once at the reference desktop viewport');

  let settingsRequests = 0;
  let settings = settingsFixture({
    background: '#08111f',
    card: '#14233a',
    text: '#f7fbff',
    primary: '#29d3c2',
    desktopSidebarEnabled: true,
    bottomNavigationEnabled: true,
    gameGridColumns: 5,
  });

  await page.route('**/api/site-settings**', async (route) => {
    settingsRequests += 1;
    await fulfillJson(route, settings);
  });

  // Server rendering owns the first settings snapshot. After hydration the
  // provider must revalidate through the Member same-origin proxy, which is
  // the exact browser path used in Production and avoids cross-origin API drift.
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('html')).toHaveAttribute('data-member-theme-authority', 'true');
  await expect.poll(() => settingsRequests, { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  await expect.poll(async () => (await readThemeState(page)).runtimeBackground, { timeout: 10_000 }).toBe('#08111f');

  const first = await readThemeState(page);
  expect(first.aliasCanvas).toBe('#08111f');
  expect(first.runtimeColumns).toBe('5');
  expect(first.desktopSidebar).toBe('true');
  expect(first.bottomNavigation).toBe('true');

  settings = settingsFixture({
    background: '#f2f6fb',
    card: '#ffffff',
    text: '#102036',
    primary: '#7257ff',
    desktopSidebarEnabled: false,
    bottomNavigationEnabled: false,
    gameGridColumns: 4,
  });

  // Focus/visibility remain the long-lived synchronization path after the
  // initial hydration revalidation. Respect the provider's 1.5s throttle.
  await page.waitForTimeout(1_600);
  await refreshSettingsOnFocus(page);
  await expect.poll(() => settingsRequests, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
  await expect.poll(async () => (await readThemeState(page)).runtimeBackground, { timeout: 10_000 }).toBe('#f2f6fb');

  const second = await readThemeState(page);
  expect(second.aliasCanvas).toBe('#f2f6fb');
  expect(second.runtimeColumns).toBe('4');
  expect(second.desktopSidebar).toBe('false');
  expect(second.bottomNavigation).toBe('false');
  expect(second.bodyBackground).not.toBe(first.bodyBackground);

  const sidebar = page.locator('.desktop-reference-home .reference-sidebar').first();
  if (await sidebar.count()) await expect(sidebar).toBeHidden();
});

async function refreshSettingsOnFocus(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}

async function readThemeState(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    return {
      runtimeBackground: root.style.getPropertyValue('--member-runtime-background').trim(),
      runtimeColumns: root.style.getPropertyValue('--member-runtime-game-grid-columns').trim(),
      aliasCanvas: style.getPropertyValue('--member-canvas').trim(),
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      desktopSidebar: root.dataset.memberDesktopSidebar ?? '',
      bottomNavigation: root.dataset.memberBottomNavigation ?? '',
      heroBanner: root.dataset.memberHeroBanner ?? '',
      providerMenu: root.dataset.memberProviderMenu ?? '',
    };
  });
}

function settingsFixture(options: {
  background: string;
  card: string;
  text: string;
  primary: string;
  desktopSidebarEnabled: boolean;
  bottomNavigationEnabled: boolean;
  gameGridColumns: number;
}) {
  return {
    branding: {
      primary_color: options.primary,
      secondary_color: '#7c3aed',
      accent_color: options.primary,
      background_color: options.background,
      card_color: options.card,
      text_color: options.text,
      muted_text_color: '#64748b',
      border_color: '#c9d3e0',
      success_color: '#22c55e',
      warning_color: '#f59e0b',
      danger_color: '#ef4444',
      info_color: '#3b82f6',
    },
    theme: {
      animation_level: 'subtle',
      card_radius: 18,
      control_radius: 12,
      modal_radius: 22,
      section_gap_desktop: 24,
      section_gap_mobile: 16,
      card_gap_desktop: 14,
      card_gap_mobile: 10,
      game_grid_columns: options.gameGridColumns,
      hero_banner_enabled: true,
      provider_menu_enabled: true,
      show_promotion_banner: true,
      show_game_categories: true,
      show_popular_providers: true,
      show_recommended_games: true,
      bottom_navigation_enabled: options.bottomNavigationEnabled,
      desktop_sidebar_enabled: options.desktopSidebarEnabled,
      sticky_wallet_enabled: true,
      floating_deposit_button_enabled: true,
      show_balance_header: true,
      show_deposit_withdraw_buttons: true,
      show_provider_name: true,
      show_hot_badge: true,
      show_new_badge: true,
    },
  };
}

async function fulfillJson(route: Route, body: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(body),
  });
}
