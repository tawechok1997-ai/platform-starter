import { defineConfig } from '@playwright/test';

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

export default defineConfig({
  testDir: './tests/e2e-visual',
  timeout: 45_000,
  expect: { timeout: 10_000, toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.02 } },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-visual-report' }]] : 'list',
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    colorScheme: 'dark',
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
  },
  projects: viewports.map(({ name, width, height }) => ({
    name,
    use: { viewport: { width, height }, deviceScaleFactor: 1 },
  })),
});
