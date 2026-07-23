import { expect, test, type Page, type Route } from '@playwright/test';

const games = [
  {
    id: 'mobile-fortune-tiger',
    providerGameCode: 'fortune-tiger',
    code: 'mobile-fortune-tiger',
    name: 'Fortune Tiger',
    category: 'slot',
    platform: 'mobile',
    provider: { code: 'pg-soft', name: 'PG Soft', status: 'ACTIVE' },
    status: 'ACTIVE',
    imageUrl: 'http://127.0.0.1:4000/broken/fortune-tiger.png',
    isFeatured: true,
    isPopular: true,
    isNew: false,
  },
  {
    id: 'pc-neon-racer',
    providerGameCode: 'neon-racer',
    code: 'pc-neon-racer',
    name: 'Neon Racer',
    category: 'arcade',
    platform: 'pc',
    provider: { code: 'nova-pc', name: 'Nova PC', status: 'ACTIVE' },
    status: 'ACTIVE',
    iconUrl: 'http://127.0.0.1:4000/icons/neon-racer.svg',
    isFeatured: false,
    isPopular: false,
    isNew: true,
  },
  {
    id: 'shared-royal-baccarat',
    providerGameCode: 'royal-baccarat',
    code: 'shared-royal-baccarat',
    name: 'Royal Baccarat',
    category: 'casino',
    platform: 'both',
    provider: { code: 'royal-live', name: 'Royal Live', status: 'ACTIVE' },
    status: 'ACTIVE',
    isFeatured: false,
    isPopular: false,
    isNew: false,
  },
];

const providers = [
  { code: 'pg-soft', name: 'PG Soft' },
  { code: 'nova-pc', name: 'Nova PC' },
  { code: 'royal-live', name: 'Royal Live' },
];

async function installApiMock(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('member_access_token', 'browser-regression-token');
  });

  await page.route('http://127.0.0.1:4000/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === '/member/wallet') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ balance: '1250.00', currency: 'THB' }),
      });
      return;
    }

    if (path === '/member/games') {
      const platform = url.searchParams.get('platform');
      const provider = url.searchParams.get('provider');
      const category = url.searchParams.get('category');
      const query = url.searchParams.get('query')?.toLowerCase();
      const filtered = games.filter((game) => {
        if (platform && game.platform !== platform && game.platform !== 'both') return false;
        if (provider && game.provider.code !== provider) return false;
        if (category && game.category !== category) return false;
        if (query && !`${game.name} ${game.provider.name}`.toLowerCase().includes(query)) return false;
        return true;
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          items: filtered,
          categories: ['slot', 'arcade', 'casino'],
          providers,
          featured: filtered.filter((game) => game.isFeatured),
          newest: filtered.filter((game) => game.isNew),
          popular: filtered.filter((game) => game.isPopular),
          pagination: { page: 1, limit: 24, total: filtered.length, totalPages: 1, hasMore: false },
          counts: {
            total: filtered.length,
            database: filtered.length,
            catalogOnly: 0,
            mobile: filtered.filter((game) => game.platform === 'mobile' || game.platform === 'both').length,
            pc: filtered.filter((game) => game.platform === 'pc' || game.platform === 'both').length,
          },
        }),
      });
      return;
    }

    if (path === '/member/games/mobile-fortune-tiger/launch') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          launchUrl: 'https://game.example.test/launch/mobile-fortune-tiger',
          session: { id: 'session-browser-1' },
        }),
      });
      return;
    }

    if (path === '/broken/fortune-tiger.png') {
      await route.fulfill({ status: 404, body: 'missing' });
      return;
    }

    if (path === '/icons/neon-racer.svg') {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>',
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

function catalog(page: Page) {
  return page.locator('#game-catalog');
}

function catalogCard(page: Page, gameName: string) {
  return catalog(page).locator('.game-lobby-card').filter({ hasText: gameName });
}

test.beforeEach(async ({ page }) => {
  await installApiMock(page);
  await page.goto('/games');
  await expect(page.getByRole('heading', { name: 'เกมทั้งหมด', exact: true })).toBeVisible();
});

test('filters the catalog by platform provider category and search', async ({ page }) => {
  await page.getByRole('button', { name: '💻 PC', exact: true }).click();
  await expect(catalog(page).getByText('Neon Racer', { exact: true })).toBeVisible();
  await expect(catalog(page).getByText('Fortune Tiger', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'ทั้งหมด', exact: true }).click();
  await page.getByLabel('ค่ายเกม').selectOption('pg-soft');
  await expect(catalog(page).getByText('Fortune Tiger', { exact: true })).toBeVisible();
  await expect(catalog(page).getByText('Neon Racer', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'สล็อต', exact: true }).click();
  await page.getByRole('textbox', { name: 'ค้นหาเกม', exact: true }).fill('fortune');
  await expect(catalog(page).getByText('Fortune Tiger', { exact: true })).toBeVisible();
});

test('uses the fallback when a game image fails', async ({ page }) => {
  const card = catalogCard(page, 'Fortune Tiger');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('.game-lobby-fallback')).toHaveText('FO');
});

test('launches a game through the member launch contract', async ({ page }) => {
  const card = catalogCard(page, 'Fortune Tiger');
  const launchButton = card.locator('.game-lobby-cover-button');
  await expect(launchButton).toBeVisible();
  const launchRequest = page.waitForRequest((request) => request.url().endsWith('/member/games/mobile-fortune-tiger/launch'));
  await launchButton.click();
  await launchRequest;
  await expect(page).toHaveURL(/\/games\/session\?session=session-browser-1/);
});
