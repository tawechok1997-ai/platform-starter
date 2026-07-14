import { test as base, expect, type Page, type Request, type Response } from '@playwright/test';

type BrowserFailure = {
  kind: 'console' | 'pageerror' | 'requestfailed' | 'http';
  message: string;
  url?: string;
};

const ignoredConsolePatterns = [
  /Download the React DevTools/i,
  /favicon\.ico/i,
];

function isIgnoredConsole(message: string) {
  return ignoredConsolePatterns.some((pattern) => pattern.test(message));
}

function shouldIgnoreRequest(request: Request) {
  const url = request.url();
  return url.startsWith('data:') || url.startsWith('blob:') || url.includes('favicon.ico');
}

function shouldFailResponse(response: Response) {
  return response.status() >= 500;
}

function attachBrowserFailureGate(page: Page, failures: BrowserFailure[]) {
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (!isIgnoredConsole(text)) failures.push({ kind: 'console', message: text });
  });

  page.on('pageerror', (error) => {
    failures.push({ kind: 'pageerror', message: error.message });
  });

  page.on('requestfailed', (request) => {
    if (shouldIgnoreRequest(request)) return;
    failures.push({
      kind: 'requestfailed',
      message: request.failure()?.errorText ?? 'request failed',
      url: request.url(),
    });
  });

  page.on('response', (response) => {
    if (!shouldFailResponse(response)) return;
    failures.push({
      kind: 'http',
      message: `HTTP ${response.status()} ${response.statusText()}`,
      url: response.url(),
    });
  });
}

export const test = base.extend<{ browserFailures: BrowserFailure[] }>({
  browserFailures: async ({ page }, use, testInfo) => {
    const failures: BrowserFailure[] = [];
    attachBrowserFailureGate(page, failures);
    await use(failures);

    if (failures.length) {
      await testInfo.attach('browser-failures.json', {
        body: Buffer.from(JSON.stringify(failures, null, 2)),
        contentType: 'application/json',
      });
    }

    expect(failures, 'Browser console/network failures must be empty').toEqual([]);
  },
});

export { expect };
