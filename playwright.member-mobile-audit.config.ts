import { defineConfig } from '@playwright/test';

const viewports = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
];

export default defineConfig({
  testDir: './tests/e2e-visual',
  testMatch: /r013-member-mobile-full-audit\.spec\.ts/,
  outputDir: 'artifacts/member-mobile-audit/test-results',
  timeout: 180_000,
  expect: { timeout: 12_000 },
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'artifacts/member-mobile-audit/html-report' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    colorScheme: 'dark',
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    reducedMotion: 'reduce',
  },
  projects: viewports.map(({ name, width, height }) => ({
    name,
    use: {
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
    },
  })),
});
