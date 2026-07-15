import { expect, test, type Page, type TestInfo } from '@playwright/test';

type NetworkRecord = { method: string; url: string; status?: number; resourceType: string };

async function capturePage(
  page: Page,
  testInfo: TestInfo,
  target: { name: string; url: string; root: string },
) {
  const consoleMessages: Array<{ type: string; text: string }> = [];
  const network: NetworkRecord[] = [];

  page.on('console', (message) => consoleMessages.push({ type: message.type(), text: message.text() }));
  page.on('request', (request) => network.push({
    method: request.method(),
    url: request.url(),
    resourceType: request.resourceType(),
  }));
  page.on('response', (response) => {
    const match = network.findLast((entry) => entry.url === response.url() && entry.status === undefined);
    if (match) match.status = response.status();
  });

  await page.route('http://127.0.0.1:4000/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [], settings: [] }),
  }));

  await page.goto(target.url, { waitUntil: 'networkidle' });
  await expect(page.locator(target.root)).toBeVisible();

  const overflow = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    viewportHeight: window.innerHeight,
    bodyHeight: document.body.scrollHeight,
  }));
  expect(overflow.documentWidth, `${target.name} must not overflow horizontally`).toBeLessThanOrEqual(overflow.viewportWidth + 1);

  const screenshotPath = testInfo.outputPath(`${target.name}-${testInfo.project.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
  await testInfo.attach(`${target.name}-screenshot`, { path: screenshotPath, contentType: 'image/png' });
  await testInfo.attach(`${target.name}-layout`, {
    body: Buffer.from(JSON.stringify(overflow, null, 2)),
    contentType: 'application/json',
  });
  await testInfo.attach(`${target.name}-console`, {
    body: Buffer.from(JSON.stringify(consoleMessages, null, 2)),
    contentType: 'application/json',
  });
  await testInfo.attach(`${target.name}-network`, {
    body: Buffer.from(JSON.stringify(network, null, 2)),
    contentType: 'application/json',
  });
}

test('Admin login visual contract', async ({ page }, testInfo) => {
  await capturePage(page, testInfo, {
    name: 'admin-login',
    url: 'http://127.0.0.1:3100/login',
    root: '.admin-auth-card',
  });
});

test('Member login visual contract', async ({ page }, testInfo) => {
  await capturePage(page, testInfo, {
    name: 'member-login',
    url: 'http://127.0.0.1:3101/login',
    root: '.public-auth-card',
  });
});
