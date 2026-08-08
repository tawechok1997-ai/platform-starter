import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { canAccessPath } from '../../apps/web-admin/app/(admin)/admin-nav';
import {
  buildP8Tier0Matrix,
  type P8Browser,
  type P8MatrixCase,
  type P8PersonaId,
  type P8Viewport,
} from '../../apps/web-admin/src/features/admin-modernization/p8-release-matrix';

const baseUrl = process.env.PR3_ADMIN_URL?.trim() || 'http://127.0.0.1:3001';
const personaPassword = process.env.PR3_PERSONA_PASSWORD?.trim();
const manifestPath = process.env.PR3_PERSONA_MANIFEST?.trim() || 'test-results/admin-pr3-personas.json';

const EXPECTED_ROLES: Record<P8PersonaId, readonly string[]> = {
  finance: ['finance'],
  'deposit-withdrawal': ['deposit_withdrawal'],
  marketing: ['marketing'],
  manager: ['manager'],
  'system-admin': ['system_admin'],
  'multi-role': ['finance', 'marketing'],
  'explicit-deny': ['system_admin'],
};

type AdminProfile = {
  username: string;
  roles: Array<{ code: string; name?: string }>;
  permissions: string[];
};

type AccessibilityViolation = {
  id: string;
  impact: string | null;
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string | null;
  }>;
};

type RouteEvidence = {
  route: string;
  persona: P8PersonaId;
  browser: P8Browser;
  viewport: P8Viewport;
  expectedAllowed: boolean;
  renderedDenied: boolean;
  overflow: number;
  brokenImages: string[];
  pageErrors: string[];
  serverErrors: Array<{ url: string; status: number }>;
  accessibilityViolations?: AccessibilityViolation[];
  performance?: {
    domContentLoadedMs: number;
    loadMs: number;
    totalTransferBytes: number;
    scriptTransferBytes: number;
  };
};

type PersonaManifest = {
  accounts: Array<{
    persona: P8PersonaId;
    username: string;
    roleCodes: string[];
    denyAll: boolean;
    password?: unknown;
  }>;
};

function projectTarget(name: string): { browser: P8Browser; viewport: P8Viewport; width: number; height: number } {
  const targets = {
    'chromium-desktop': { browser: 'chromium', viewport: 'desktop', width: 1440, height: 900 },
    'chromium-tablet': { browser: 'chromium', viewport: 'tablet', width: 834, height: 1112 },
    'chromium-mobile': { browser: 'chromium', viewport: 'mobile', width: 390, height: 844 },
    'firefox-desktop': { browser: 'firefox', viewport: 'desktop', width: 1440, height: 900 },
    'webkit-desktop': { browser: 'webkit', viewport: 'desktop', width: 1440, height: 900 },
  } as const;
  const target = targets[name as keyof typeof targets];
  if (!target) throw new Error(`Unsupported PR-3 project: ${name}`);
  return target;
}

function usernameFor(persona: P8PersonaId) {
  return `pr3-${persona}`;
}

async function login(page: Page, persona: P8PersonaId) {
  if (!personaPassword) throw new Error('PR3_PERSONA_PASSWORD is required');
  const username = usernameFor(persona);
  await page.addInitScript(() => {
    window.localStorage.setItem('admin_locale', 'th');
  });
  await page.goto(new URL('/login', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  const identity = page.locator('input[autocomplete="username"]');
  const password = page.locator('input[autocomplete="current-password"]');
  await expect(identity).toBeVisible();
  await expect(password).toBeVisible();
  await identity.click();
  await identity.pressSequentially(username, { delay: 12 });
  await expect(identity).toHaveValue(username);
  await password.click();
  await password.pressSequentially(personaPassword, { delay: 4 });
  await expect(password).toHaveValue(personaPassword);
  const submit = page.locator('button[type="submit"], input[type="submit"]').first();
  await Promise.all([
    page.waitForURL((url) => !/\/login(?:[/?#]|$)/.test(url.pathname), { timeout: 30_000 }),
    submit.click(),
  ]);
  await expect(page.locator('.admin-content-shell')).toBeVisible({ timeout: 15_000 });
  const token = await page.evaluate(() => window.sessionStorage.getItem('admin_access_token'));
  if (!token) throw new Error(`Admin access token was not stored for ${persona}`);
  return token;
}

async function readProfile(context: BrowserContext, token: string) {
  const response = await context.request.get(new URL('/api/admin/auth/me', baseUrl).toString(), {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  expect(response.status(), 'authenticated profile must load').toBe(200);
  return response.json() as Promise<AdminProfile>;
}

async function logout(context: BrowserContext, token: string) {
  const response = await context.request.post(new URL('/api/admin/auth/logout', baseUrl).toString(), {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  expect([200, 201, 204]).toContain(response.status());
}

async function auditRoute(
  page: Page,
  matrixCase: P8MatrixCase,
  permissions: readonly string[],
  runDeepAcceptance: boolean,
): Promise<RouteEvidence> {
  const pageErrors: string[] = [];
  const serverErrors: Array<{ url: string; status: number }> = [];
  const onPageError = (error: Error) => pageErrors.push(error.message);
  const onResponse = (response: { status(): number; url(): string }) => {
    if (response.status() >= 500) serverErrors.push({ url: response.url(), status: response.status() });
  };
  page.on('pageerror', onPageError);
  page.on('response', onResponse);

  try {
    await page.goto(new URL(matrixCase.route, baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
    await expect(page.locator('.admin-content-shell')).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(250);

    const expectedAllowed = canAccessPath(matrixCase.route, permissions);
    const deniedState = page.locator('.admin-access-denied');
    const renderedDenied = await deniedState.isVisible().catch(() => false);
    if (expectedAllowed) {
      await expect(deniedState, `${matrixCase.persona} should access ${matrixCase.route}`).toHaveCount(0);
      await expect(page.locator('.admin-content-shell')).toBeVisible();
    } else {
      await expect(deniedState, `${matrixCase.persona} should be denied ${matrixCase.route}`).toBeVisible();
    }

    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      brokenImages: Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
    }));
    expect(layout.overflow, `${matrixCase.route} must not overflow horizontally`).toBeLessThanOrEqual(2);
    expect(layout.brokenImages, `${matrixCase.route} must not render broken images`).toEqual([]);
    expect(pageErrors, `${matrixCase.route} must not raise page errors`).toEqual([]);
    expect(serverErrors, `${matrixCase.route} must not return server errors`).toEqual([]);

    const evidence: RouteEvidence = {
      route: matrixCase.route,
      persona: matrixCase.persona,
      browser: matrixCase.browser,
      viewport: matrixCase.viewport,
      expectedAllowed,
      renderedDenied,
      overflow: layout.overflow,
      brokenImages: layout.brokenImages,
      pageErrors,
      serverErrors,
    };

    if (runDeepAcceptance && expectedAllowed) {
      await page.waitForLoadState('load', { timeout: 8_000 }).catch(() => undefined);
      const accessibility = await new AxeBuilder({ page }).analyze();
      const serious = accessibility.violations.filter((violation) =>
        violation.impact === 'serious' || violation.impact === 'critical',
      );
      evidence.accessibilityViolations = serious.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target.map(String),
          html: node.html,
          failureSummary: node.failureSummary ?? null,
        })),
      }));
      expect(
        evidence.accessibilityViolations,
        `${matrixCase.route} must have no serious accessibility violations: ${JSON.stringify(evidence.accessibilityViolations)}`,
      ).toEqual([]);

      const performance = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return {
          domContentLoadedMs: Math.round(navigation?.domContentLoadedEventEnd ?? 0),
          loadMs: Math.round(navigation?.loadEventEnd ?? 0),
          totalTransferBytes: resources.reduce((total, item) => total + Math.max(0, item.transferSize || 0), 0),
          scriptTransferBytes: resources
            .filter((item) => item.initiatorType === 'script')
            .reduce((total, item) => total + Math.max(0, item.transferSize || 0), 0),
        };
      });
      evidence.performance = performance;
      expect(performance.domContentLoadedMs).toBeGreaterThan(0);
      expect(performance.loadMs).toBeGreaterThan(0);
      expect(performance.domContentLoadedMs).toBeLessThanOrEqual(5_000);
      expect(performance.loadMs).toBeLessThanOrEqual(8_000);
      expect(performance.scriptTransferBytes).toBeLessThanOrEqual(2_500_000);
      expect(performance.totalTransferBytes).toBeLessThanOrEqual(5_000_000);
    }

    return evidence;
  } finally {
    page.off('pageerror', onPageError);
    page.off('response', onResponse);
  }
}

async function verifyReversibleMutation(context: BrowserContext, token: string) {
  const url = new URL('/api/admin/preferences/dashboard-widget-layout-v1', baseUrl).toString();
  const headers = { Authorization: `Bearer ${token}`, accept: 'application/json' };
  const baselineResponse = await context.request.get(url, { headers });
  expect(baselineResponse.status()).toBe(200);
  const baseline = await baselineResponse.json() as { value: Record<string, unknown> | null; version: number };
  const marker = `pr3-${Date.now()}`;
  let restoredValue: Record<string, unknown> | null = null;

  try {
    const mutationResponse = await context.request.patch(url, {
      headers,
      data: { value: { pr3Acceptance: marker, widgets: [] } },
    });
    expect(mutationResponse.status()).toBe(200);
    const mutated = await mutationResponse.json() as { value: Record<string, unknown>; version: number };
    expect(mutated.value.pr3Acceptance).toBe(marker);
    expect(mutated.version).toBeGreaterThan(baseline.version);

    const persistedResponse = await context.request.get(url, { headers });
    expect(persistedResponse.status()).toBe(200);
    const persisted = await persistedResponse.json() as { value: Record<string, unknown> };
    expect(persisted.value.pr3Acceptance).toBe(marker);
  } finally {
    const restoreResponse = await context.request.patch(url, {
      headers,
      data: { value: baseline.value ?? {} },
    });
    expect(restoreResponse.status()).toBe(200);
    const restored = await restoreResponse.json() as { value: Record<string, unknown> };
    expect(restored.value).toEqual(baseline.value ?? {});
    restoredValue = restored.value;
  }

  return { marker, baselineVersion: baseline.version, restoredValue };
}

test('PR-3 real persona, mutation, accessibility, performance, and route acceptance', async ({ browser }, testInfo) => {
  const target = projectTarget(testInfo.project.name);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as PersonaManifest;
  expect(manifest.accounts).toHaveLength(7);
  expect(manifest.accounts.some((account) => Object.hasOwn(account, 'password'))).toBe(false);

  const projectCases = buildP8Tier0Matrix().filter((item) =>
    item.browser === target.browser && item.viewport === target.viewport,
  );
  expect(projectCases.length).toBeGreaterThan(0);
  const evidence: RouteEvidence[] = [];
  let mutationEvidence: Record<string, unknown> | null = null;

  for (const persona of [...new Set(projectCases.map((item) => item.persona))]) {
    const context = await browser.newContext({
      viewport: { width: target.width, height: target.height },
      locale: 'th-TH',
      reducedMotion: 'reduce',
      ...(target.viewport === 'mobile' ? { isMobile: true, hasTouch: true } : {}),
    });
    const page = await context.newPage();
    let token = '';
    try {
      token = await login(page, persona);
      const profile = await readProfile(context, token);
      expect(profile.username).toBe(usernameFor(persona));
      expect(profile.roles.map((role) => role.code).sort()).toEqual([...EXPECTED_ROLES[persona]].sort());
      if (persona === 'explicit-deny') expect(profile.permissions).toEqual([]);
      if (persona === 'multi-role') {
        expect(profile.permissions).toContain('wallet.view');
        expect(profile.permissions).toContain('promotion.view');
      }

      for (const matrixCase of projectCases.filter((item) => item.persona === persona)) {
        evidence.push(await auditRoute(
          page,
          matrixCase,
          profile.permissions,
          target.browser === 'chromium' && target.viewport === 'desktop' && persona === 'system-admin',
        ));
      }

      if (target.browser === 'chromium' && target.viewport === 'desktop' && persona === 'system-admin') {
        mutationEvidence = await verifyReversibleMutation(context, token);
        await page.goto(new URL('/system-settings', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
        await page.screenshot({
          path: testInfo.outputPath('admin-pr3-system-admin.png'),
          fullPage: true,
          animations: 'disabled',
        });
      }
    } finally {
      if (token) await logout(context, token).catch(() => undefined);
      await context.close();
    }
  }

  const expectedProjectCases = buildP8Tier0Matrix().filter((item) =>
    item.browser === target.browser && item.viewport === target.viewport,
  ).length;
  expect(evidence).toHaveLength(expectedProjectCases);
  const payload = {
    project: testInfo.project.name,
    target,
    matrixCases: evidence.length,
    allowedCases: evidence.filter((item) => item.expectedAllowed).length,
    deniedCases: evidence.filter((item) => !item.expectedAllowed).length,
    mutationEvidence,
    evidence,
  };
  const output = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(testInfo.outputPath('admin-pr3-staging-acceptance.json'), output, 'utf8');
  await testInfo.attach('admin-pr3-staging-acceptance', {
    body: Buffer.from(output),
    contentType: 'application/json',
  });
});