import { defineConfig, devices } from '@playwright/test';

const deployedBaseURL = process.env.ADMIN_WEB_URL?.trim();
const baseURL = deployedBaseURL || 'http://127.0.0.1:3001';
const p8TestMatch = /admin-p8-.*\.spec\.ts/;

export default defineConfig({
  testDir: './tests/admin-browser-matrix',
  timeout: 120_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/admin-browser-matrix', open: 'never' }],
  ],
  outputDir: 'test-results/admin-browser-matrix',
  webServer: deployedBaseURL ? undefined : {
    command: 'pnpm --filter @platform/web-admin build && pnpm --filter @platform/web-admin start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
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
    {
      name: 'p8-firefox-desktop',
      testMatch: p8TestMatch,
      use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'p8-webkit-desktop',
      testMatch: p8TestMatch,
      use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
