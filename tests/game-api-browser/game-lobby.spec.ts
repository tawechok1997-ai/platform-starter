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
  },
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: games,
          pagination: { page: 1, limit: 100, total: games.length, totalPages: 1 },
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

test.beforeEach(async ({ page }) => {
  await installApiMock(page);
  await page.goto('/games');
  await expect(page.getByRole('heading', { name: 'เกมทั้งหมด' })).toBeVisible();
});

test('filters the catalog by platform provider category and search', async ({ page }) => {
  await page.getByLabel('แพลตฟอร์ม').selectOption('pc');
  await expect(page.getByText('Neon Racer', { exact: true })).toBeVisible();
  await expect(page.getByText('Fortune Tiger', { exact: true })).toHaveCount(0);

  await page.getByLabel('แพลตฟอร์ม').selectOption('all');
  await page.getByLabel('ค่ายเกม').selectOption('pg-soft');
  await expect(page.getByText('Fortune Tiger', { exact: true })).toBeVisible();
  await expect(page.getByText('Neon Racer', { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: /สล็อต/ }).click();
  await page.getByLabel('ค้นหาเกม').fill('fortune');
  await expect(page.getByText('Fortune Tiger', { exact: true })).toBeVisible();
});

test('uses the fallback when a game image fails', async ({ page }) => {
  const card = page.locator('.game-lobby-card').filter({ hasText: 'Fortune Tiger' });
  await expect(card.locator('.game-lobby-fallback')).toHaveText('FO');
});

test('launches a game through the member launch contract', async ({ page }) => {
  const launchRequest = page.waitForRequest((request) => request.url().endsWith('/member/games/mobile-fortune-tiger/launch'));
  await page.getByRole('button', { name: 'เล่น Fortune Tiger' }).click();
  await launchRequest;
  await expect(page).toHaveURL(/\/games\/session\?session=session-browser-1/);
});
