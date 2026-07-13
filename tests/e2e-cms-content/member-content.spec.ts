import { expect, test } from '@playwright/test';

const pixel = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDEyMDAgNDgwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjNTgxYzg3Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMTIxMjEyIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNDgwIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

function settings(maintenance = false) {
  return {
    website: {
      site_name: 'Platform Visual Test',
      site_description: 'สมาชิกและโปรโมชั่นจาก CMS',
      registration_enabled: true,
      login_enabled: true,
      maintenance_mode: false,
    },
    branding: {
      primary_color: '#f5c542',
      background_color: '#080808',
      card_color: '#181818',
      text_color: '#ffffff',
      success_color: '#22c55e',
      danger_color: '#ef4444',
    },
    theme: {
      show_balance_header: true,
      show_deposit_withdraw_buttons: true,
      show_promotion_banner: true,
      show_game_categories: true,
      show_popular_providers: true,
      show_recommended_games: true,
      animation_level: 'none',
    },
    maintenance: {
      enabled: maintenance,
      member_enabled: maintenance,
      message: 'ระบบกำลังปรับปรุงตามแผน กรุณากลับมาอีกครั้ง',
    },
    features: {
      registration_enabled: true,
      login_enabled: true,
      deposit_enabled: true,
      withdraw_enabled: true,
      promotion_enabled: true,
      bonus_enabled: true,
      affiliate_enabled: true,
      support_enabled: true,
      kyc_enabled: true,
      game_lobby_enabled: true,
      profile_enabled: true,
      notification_enabled: true,
      cms_content: {
        assets: [],
        banners: [
          { title: 'โบนัสต้อนรับสมาชิกใหม่', subtitle: 'โปรโมชั่นแนะนำ', imageUrl: pixel, href: '/promotions', enabled: true },
          { title: 'กิจกรรมประจำสัปดาห์', subtitle: 'ร่วมสนุก', imageUrl: pixel, href: '/promotions', enabled: true },
          { title: 'คืนยอดเสียรายวัน', subtitle: 'สิทธิพิเศษ', imageUrl: pixel, href: '/promotions', enabled: true },
        ],
        popup: { title: 'ประกาศสำคัญ', message: 'อ่านเงื่อนไขก่อนร่วมรายการ', ctaLabel: 'ดูรายละเอียด', href: '/promotions', enabled: false, version: 'visual-v1' },
        announcements: [
          { title: 'ระบบพร้อมใช้งาน', message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ', enabled: true },
        ],
        faqs: [],
      },
    },
  };
}

async function mockMemberApi(page: import('@playwright/test').Page, maintenance = false) {
  await page.addInitScript(() => {
    window.localStorage.setItem('member_access_token', 'e2e-member-token');
    window.localStorage.setItem('member_refresh_token', 'e2e-member-refresh-token');
  });

  await page.route('http://127.0.0.1:4000/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/public/site-settings') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(settings(maintenance)) });
      return;
    }

    if (url.pathname === '/member/auth/me' || url.pathname === '/member/profile') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '22222222-2222-4222-8222-222222222222',
          username: 'cms-visual-member',
          phone: '0890000000',
          email: 'cms@example.test',
        }),
      });
      return;
    }

    if (url.pathname === '/member/auth/refresh') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'e2e-member-token', refreshToken: 'e2e-member-refresh-token' }),
      });
      return;
    }

    if (url.pathname.includes('games')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], providers: [], categories: [] }) });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) });
  });
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
}

test.describe('Member CMS content visual regression', () => {
  test('renders banners announcements and promotion slots without overflow', async ({ page }, testInfo) => {
    await mockMemberApi(page, false);
    await page.goto('http://127.0.0.1:3101/');

    await expect(page).toHaveURL('http://127.0.0.1:3101/');
    await expect(page.getByText('Platform Visual Test').first()).toBeVisible();
    await expect(page.getByRole('status')).toContainText('ฝาก ถอน และเกมเปิดให้บริการตามปกติ');
    await expect(page.getByText('โบนัสต้อนรับสมาชิกใหม่').first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'โปรโมชั่นแนะนำ' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await testInfo.attach(`member-cms-content-${testInfo.project.name}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  test('renders maintenance fallback safely without content leakage', async ({ page }, testInfo) => {
    await mockMemberApi(page, true);
    await page.goto('http://127.0.0.1:3101/');

    await expect(page).toHaveURL('http://127.0.0.1:3101/');
    await expect(page.getByRole('heading', { name: 'Platform Visual Test' })).toBeVisible();
    await expect(page.getByText('ระบบกำลังปรับปรุงตามแผน กรุณากลับมาอีกครั้ง')).toBeVisible();
    await expect(page.getByText('โบนัสต้อนรับสมาชิกใหม่')).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    await testInfo.attach(`member-cms-maintenance-${testInfo.project.name}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});