import { defineConfig } from '@playwright/test';

const baseURL = process.env.ADMIN_BASE_URL ?? 'https://platformweb-admin-production.up.railway.app';

export default defineConfig({
  testDir: './tests/e2e-smoke',
  testMatch: /admin-deployment-matrix\.spec\.ts/,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-admin' }]]
    : 'list',
  use: {
    baseURL,
    navigationTimeout: 30_000,
    actionTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false,
  },
  outputDir: 'test-results/admin-deployment',
  projects: [
    { name: 'admin-deployment-chromium', use: { browserName: 'chromium' } },
  ],
});
