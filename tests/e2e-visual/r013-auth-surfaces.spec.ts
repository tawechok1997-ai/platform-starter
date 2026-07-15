import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

type NetworkRecord = {
  method: string;
  resourceType: string;
  status?: number;
  url: string;
};

for (const surface of [
  { name: 'admin-login', url: 'http://127.0.0.1:3100/login', ready: '.admin-auth-card' },
  { name: 'member-login', url: 'http://127.0.0.1:3101/login', ready: '.public-auth-card' },
] as const) {
  test(`${surface.name} visual baseline`, async ({ page }, testInfo) => {
    const consoleRecords: Array<{ type: string; text: string }> = [];
    const networkRecords: NetworkRecord[] = [];

    page.on('console', (message) => consoleRecords.push({ type: message.type(), text: message.text() }));
    page.on('request', (request) => networkRecords.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url: sanitizeUrl(request.url()),
    }));
    page.on('response', (response) => {
      const request = response.request();
      const record = [...networkRecords].reverse().find((item) => item.url === sanitizeUrl(request.url()) && item.method === request.method());
      if (record) record.status = response.status();
    });

    await page.goto(surface.url, { waitUntil: 'networkidle' });
    await page.locator(surface.ready).waitFor({ state: 'visible' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({ content: '*,*::before,*::after{caret-color:transparent!important}' });

    await expect(page).toHaveScreenshot(`${surface.name}.png`, { fullPage: true });
    await persistRuntimeEvidence(testInfo, surface.name, page, consoleRecords, networkRecords);
  });
}

async function persistRuntimeEvidence(
  testInfo: TestInfo,
  surface: string,
  page: Page,
  consoleRecords: Array<{ type: string; text: string }>,
  networkRecords: NetworkRecord[],
) {
  const evidenceDir = path.resolve('artifacts/r013-visual/runtime', testInfo.project.name, surface);
  await fs.mkdir(evidenceDir, { recursive: true });
  await page.screenshot({ path: path.join(evidenceDir, 'page.png'), fullPage: true, animations: 'disabled' });
  await fs.writeFile(path.join(evidenceDir, 'console.json'), JSON.stringify(consoleRecords, null, 2));
  await fs.writeFile(path.join(evidenceDir, 'network.json'), JSON.stringify(networkRecords, null, 2));
  await testInfo.attach('console', { body: JSON.stringify(consoleRecords, null, 2), contentType: 'application/json' });
  await testInfo.attach('network', { body: JSON.stringify(networkRecords, null, 2), contentType: 'application/json' });
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
}
