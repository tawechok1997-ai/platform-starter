import { defineConfig } from '@playwright/test';

const viewports = [
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

export default defineConfig({
  testDir: './tests/e2e-visual',
  testMatch: /r013-member-desktop-.*audit\.spec\.ts/,
  outputDir: 'artifacts/member-desktop-audit/test-results',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'artifacts/member-desktop-audit/html-report' }],
  ],
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
      isMobile: false,
      hasTouch: false,
    },
  })),
});
