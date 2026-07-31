import { defineConfig } from '@playwright/test';

const viewports = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'desktop-1024', width: 1024, height: 768, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];

export default defineConfig({
  testDir: './tests/e2e-kyc',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-kyc-report' }]]
    : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    colorScheme: 'dark',
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
  },
  projects: viewports.map(({ name, width, height, mobile }) => ({
    name,
    use: {
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: mobile,
      hasTouch: mobile,
    },
  })),
  webServer: [
    {
      command: 'pnpm --filter @platform/web-member exec next dev -p 3101',
      url: 'http://127.0.0.1:3101/kyc',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4000' },
    },
    {
      command: 'pnpm --filter @platform/web-admin exec next dev -p 3102',
      url: 'http://127.0.0.1:3102/login',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_API_URL: 'http://127.0.0.1:4000' },
    },
  ],
});
