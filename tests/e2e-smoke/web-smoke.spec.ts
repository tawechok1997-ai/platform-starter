import { expect, test } from '@playwright/test';

const adminUrl = process.env.ADMIN_WEB_URL || process.env.PLAYWRIGHT_ADMIN_URL || 'http://localhost:3001';
const memberUrl = process.env.MEMBER_WEB_URL || process.env.PLAYWRIGHT_MEMBER_URL || 'http://localhost:3000';

const adminPublicPages = [
  { name: 'admin login', path: '/login' },
];

const adminProtectedPages = [
  { name: 'admin dashboard', path: '/dashboard' },
  { name: 'admin topups', path: '/topups' },
  { name: 'admin withdrawals', path: '/withdrawals' },
  { name: 'admin reports', path: '/reports' },
  { name: 'admin activity', path: '/activity' },
  { name: 'admin security', path: '/security' },
];

const memberPublicPages = [
  { name: 'member login', path: '/login' },
  { name: 'member register', path: '/register' },
];

const memberProtectedPages = [
  { name: 'member home', path: '/' },
  { name: 'member deposit', path: '/deposit' },
  { name: 'member withdraw', path: '/withdraw' },
  { name: 'member transactions', path: '/transactions' },
];

test.describe('admin public smoke', () => {
  for (const pageDef of adminPublicPages) {
    test(`${pageDef.name} loads`, async ({ page }) => {
      const response = await page.goto(`${adminUrl}${pageDef.path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), pageDef.name).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('admin protected smoke', () => {
  for (const pageDef of adminProtectedPages) {
    test(`${pageDef.name} does not server-error when unauthenticated`, async ({ page }) => {
      const response = await page.goto(`${adminUrl}${pageDef.path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), pageDef.name).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
      await expect(page).toHaveURL(/login|dashboard|topups|withdrawals|reports|activity|security/);
    });
  }
});

test.describe('member public smoke', () => {
  for (const pageDef of memberPublicPages) {
    test(`${pageDef.name} loads`, async ({ page }) => {
      const response = await page.goto(`${memberUrl}${pageDef.path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), pageDef.name).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

test.describe('member protected smoke', () => {
  for (const pageDef of memberProtectedPages) {
    test(`${pageDef.name} does not server-error when unauthenticated`, async ({ page }) => {
      const response = await page.goto(`${memberUrl}${pageDef.path}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), pageDef.name).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
