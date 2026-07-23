import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.ADMIN_WEB_URL ?? 'https://platformweb-admin-production.up.railway.app';

export default defineConfig({
  testDir: './tests/admin-browser-matrix',
  timeout: 120_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/admin-browser-matrix', open: 'never' }],
  ],
  outputDir: 'test-results/admin-browser-matrix',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'desktop-1440x900',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet-834x1112',
      use: { ...devices['Desktop Chrome'], viewport: { width: 834, height: 1112 } },
    },
    {
      name: 'mobile-390x844',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
});
