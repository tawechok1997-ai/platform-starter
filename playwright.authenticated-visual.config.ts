import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.AUTH_VISUAL_BASE_URL ?? process.env.MEMBER_WEB_URL ?? 'http://127.0.0.1:3000';
const usesSensitiveToken = Boolean(process.env.PROD_MEMBER_TOKEN?.trim());

export default defineConfig({
  testDir: './tests/authenticated-visual',
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report/authenticated-visual', open: 'never' }],
  ],
  outputDir: 'test-results/authenticated-visual',
  use: {
    baseURL,
    trace: usesSensitiveToken ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: usesSensitiveToken ? 'off' : 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
