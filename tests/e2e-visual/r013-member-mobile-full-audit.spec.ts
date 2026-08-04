import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.MEMBER_HOME_URL
  ?? 'https://platformweb-member-production.up.railway.app/';

const GUEST_ROUTES = [
  ['home', '/'],
  ['login', '/login'],
  ['register', '/register'],
  ['browse-games', '/browse/games'],
  ['guide', '/guide'],
  ['contact', '/contact'],
  ['legal', '/legal'],
  ['maintenance', '/maintenance'],
  ['session-expired', '/session-expired'],
  ['mobile-vip', '/mobile/member/vip'],
  ['mobile-live', '/mobile/member/live'],
  ['mobile-promotions', '/mobile/member/promotions'],
  ['mobile-news', '/mobile/member/news'],
  ['mobile-activity', '/mobile/member/activity'],
  ['mobile-guide', '/mobile/member/guide'],
] as const;

const AUTHENTICATED_ROUTES = [
  ['mobile-vip', '/mobile/member/vip'],
  ['mobile-commission', '/mobile/member/commission'],
  ['mobile-affiliate', '/mobile/member/affiliate'],
  ['mobile-bonus', '/mobile/member/bonus'],
  ['mobile-live', '/mobile/member/live'],
  ['mobile-promotions', '/mobile/member/promotions'],
  ['mobile-news', '/mobile/member/news'],
  ['mobile-activity', '/mobile/member/activity'],
  ['mobile-history', '/mobile/member/history'],
  ['mobile-notifications', '/mobile/member/notifications'],
  ['mobile-guide', '/mobile/member/guide'],
  ['profile-avatar', '/profile/avatar'],
] as const;

const POPUP_KINDS = [
  'menu',
  'contact',
  'password',
  'deposit',
  'withdraw',
  'network-income',
  'commission-income',
  'coupon',
  'language',
  'video',
] as const;

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

type Finding = {
  severity: Severity;
  code: string;
  message: string;
  selector?: string;
  value?: unknown;
};

type RouteAudit = {
  key: string;
  requestedPath: string;
  finalUrl: string;
  status: number | null;
  title: string;
  viewport: { width: number; height: number };
  metrics: Record<string, unknown>;
  findings: Finding[];
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: Array<{ method: string; resourceType: string; url: string; failure: string }>;
  badResponses: Array<{ status: number; url: string }>;
  axeViolations: Array<{
    id: string;
    impact: string | null | undefined;
    help: string;
    nodes: number;
    targets: string[];
  }>;
};

test.describe('Member mobile full audit', () => {
  test('home geometry, sticky chrome, drawer, tabs, categories, footer and safe-area', async ({ page }, testInfo) => {
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'home-interactions');
    const capture = attachRuntimeCapture(page);
    await installPerformanceCollectors(page);

    await page.goto(resolveUrl('/'), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const root = page.locator('[data-mobile-home-root="true"]');
    await expect(root).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1_500);

    const report: Record<string, unknown> = {
      viewport: testInfo.project.use.viewport,
      top: await collectLayoutAudit(page),
    };

    await page.screenshot({ path: path.join(evidenceDir, '01-top.png'), fullPage: false, animations: 'disabled' });

    const header = page.locator('[data-mobile-section-owner="header"]');
    const rail = page.locator('[data-mobile-section-owner="category-menu"]');
    await rail.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy({ top: 520, behavior: 'auto' }));
    await page.waitForTimeout(250);

    const stickyMetrics = await page.evaluate(() => {
      const header = document.querySelector<HTMLElement>('[data-mobile-section-owner="header"]');
      const rail = document.querySelector<HTMLElement>('[data-mobile-section-owner="category-menu"]');
      const footer = document.querySelector<HTMLElement>('[data-mobile-section-owner="footer"]');
      return {
        scrollY: window.scrollY,
        headerPosition: header ? getComputedStyle(header).position : '',
        headerTop: header?.getBoundingClientRect().top ?? null,
        headerBottom: header?.getBoundingClientRect().bottom ?? null,
        railPosition: rail ? getComputedStyle(rail).position : '',
        railTop: rail?.getBoundingClientRect().top ?? null,
        railBottom: rail?.getBoundingClientRect().bottom ?? null,
        footerTop: footer?.getBoundingClientRect().top ?? null,
      };
    });
    report.sticky = stickyMetrics;
    await page.screenshot({ path: path.join(evidenceDir, '02-sticky.png'), fullPage: false, animations: 'disabled' });

    const categoryResults: Array<Record<string, unknown>> = [];
    const categoryButtons = page.locator('button[data-mobile-category-id]');
    for (let index = 0; index < await categoryButtons.count(); index += 1) {
      const button = categoryButtons.nth(index);
      const id = await button.getAttribute('data-mobile-category-id');
      await button.click();
      await page.waitForTimeout(120);
      categoryResults.push({
        id,
        selected: await button.getAttribute('aria-selected'),
        activeCategory: await root.getAttribute('data-mobile-active-category'),
      });
    }
    report.categories = categoryResults;

    const tabResults: Array<Record<string, unknown>> = [];
    const tabs = page.locator('[data-mobile-section-owner="highlight-tabs"] [role="tab"]');
    for (let index = 0; index < await tabs.count(); index += 1) {
      const tab = tabs.nth(index);
      await tab.click();
      await page.waitForTimeout(100);
      tabResults.push({
        text: normalizeText(await tab.textContent()),
        selected: await tab.getAttribute('aria-selected'),
      });
    }
    report.highlightTabs = tabResults;

    const menuButton = page.locator('button[aria-label="เปิดเมนูสมาชิก"]');
    await menuButton.click();
    const drawer = page.locator('#mobile-home-drawer');
    await expect(drawer).toBeVisible();
    await page.waitForTimeout(150);
    report.drawerOpen = await collectOverlayAudit(page, drawer);
    report.bodyOverflowWhileDrawerOpen = await page.evaluate(() => getComputedStyle(document.body).overflow);
    report.drawerNavigation = await drawer.locator('a,button').evaluateAll((elements) => elements.map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
      href: element instanceof HTMLAnchorElement ? element.getAttribute('href') : null,
      ariaLabel: element.getAttribute('aria-label'),
      popup: element instanceof HTMLElement ? element.dataset.mobileMemberPopup ?? null : null,
    })));
    await page.screenshot({ path: path.join(evidenceDir, '03-drawer.png'), fullPage: false, animations: 'disabled' });

    await page.locator('#mobile-home-drawer button[aria-label="ปิดเมนู"]').click();
    await expect(drawer).not.toBeVisible();
    report.bodyOverflowAfterDrawerClose = await page.evaluate(() => getComputedStyle(document.body).overflow);

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' }));
    await page.waitForTimeout(250);
    report.bottom = await collectLayoutAudit(page);
    report.bottomFixedElements = await collectFixedElements(page);
    await page.screenshot({ path: path.join(evidenceDir, '04-bottom.png'), fullPage: false, animations: 'disabled' });

    report.runtime = capture.snapshot();
    report.performance = await readPerformance(page);
    await writeJson(path.join(evidenceDir, 'home-interactions.json'), report);
    console.log(`MEMBER_MOBILE_HOME_AUDIT ${JSON.stringify(compactHomeSummary(report))}`);
  });

  test('guest route matrix: layout, network, broken images, touch targets and accessibility', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Route matrix runs once at the reference phone viewport');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'guest-routes');
    const audits: RouteAudit[] = [];

    for (const [key, routePath] of GUEST_ROUTES) {
      const page = await context.newPage();
      try {
        audits.push(await auditRoute(page, testInfo, key, routePath, evidenceDir));
      } finally {
        await page.close();
      }
    }

    await writeRouteReport(evidenceDir, 'guest-routes', audits);
    console.log(`MEMBER_MOBILE_GUEST_AUDIT ${JSON.stringify(summarizeRouteAudits(audits))}`);
  });

  test('authenticated shell, bottom navigation and every popup with safe API mocks', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Authenticated popup audit runs once at the reference phone viewport');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-popups');
    await installMockMemberSession(context);
    const page = await context.newPage();
    const capture = attachRuntimeCapture(page);
    await installPerformanceCollectors(page);

    try {
      await page.goto(resolveUrl('/'), { waitUntil: 'domcontentloaded', timeout: 45_000 });
      const root = page.locator('[data-mobile-home-root="true"]');
      await expect(root).toBeVisible({ timeout: 30_000 });
      await expect(root).toHaveAttribute('data-mobile-authenticated', 'true', { timeout: 20_000 });
      await page.waitForTimeout(800);

      const report: Record<string, unknown> = {
        viewport: testInfo.project.use.viewport,
        shell: await collectLayoutAudit(page),
        headerAuthenticatedControls: await page.locator('[data-mobile-section-owner="header"] a, [data-mobile-section-owner="header"] button').evaluateAll((elements) => elements.map((element) => ({
          text: (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
          href: element instanceof HTMLAnchorElement ? element.getAttribute('href') : null,
          ariaLabel: element.getAttribute('aria-label'),
          width: Math.round(element.getBoundingClientRect().width),
          height: Math.round(element.getBoundingClientRect().height),
        }))),
        bottomNavigation: await collectBottomNavigation(page),
      };

      await page.locator('button[aria-label="เปิดเมนูสมาชิก"]').click();
      const drawer = page.locator('#mobile-home-drawer');
      await expect(drawer).toBeVisible();
      report.authenticatedDrawer = await collectOverlayAudit(page, drawer);
      report.authenticatedDrawerText = normalizeText(await drawer.textContent());
      await page.locator('#mobile-home-drawer button[aria-label="ปิดเมนู"]').click();

      const popupAudits: Array<Record<string, unknown>> = [];
      for (const kind of POPUP_KINDS) {
        await page.evaluate((popupKind) => {
          window.dispatchEvent(new CustomEvent('member:mobile-popup-open', { detail: { kind: popupKind } }));
        }, kind);
        const dialog = page.locator('[role="dialog"]:visible').last();
        const visible = await dialog.isVisible().catch(() => false);
        if (!visible) {
          popupAudits.push({ kind, visible: false, finding: 'Popup event did not render a visible dialog' });
          continue;
        }

        await page.waitForTimeout(120);
        const popupAudit: Record<string, unknown> = {
          kind,
          visible: true,
          overlay: await collectOverlayAudit(page, dialog),
          layout: await collectLayoutAudit(page),
          interactive: await collectInteractiveAudit(dialog),
        };

        if (kind === 'language') {
          const languageButtons = dialog.locator('button');
          popupAudit.languageOptions = await languageButtons.evaluateAll((buttons) => buttons.map((button) => ({
            text: (button.textContent ?? '').replace(/\s+/g, ' ').trim(),
            disabled: (button as HTMLButtonElement).disabled,
          })));
          const unsupported = languageButtons.filter({ hasText: 'Tagalog' });
          if (await unsupported.count()) {
            const before = normalizeText(await dialog.textContent());
            await unsupported.first().click();
            await page.waitForTimeout(120);
            popupAudit.unsupportedLanguageClick = {
              dialogStillVisible: await dialog.isVisible().catch(() => false),
              contentUnchanged: normalizeText(await dialog.textContent()) === before,
            };
          }
        }

        await page.screenshot({
          path: path.join(evidenceDir, `popup-${kind}.png`),
          fullPage: false,
          animations: 'disabled',
        });
        popupAudits.push(popupAudit);
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible({ timeout: 4_000 }).catch(() => undefined);
        await page.waitForTimeout(80);
      }

      report.popups = popupAudits;
      report.runtime = capture.snapshot();
      report.performance = await readPerformance(page);
      await writeJson(path.join(evidenceDir, 'authenticated-popups.json'), report);
      console.log(`MEMBER_MOBILE_AUTH_POPUP_AUDIT ${JSON.stringify(compactPopupSummary(popupAudits))}`);
    } finally {
      await page.close();
    }
  });

  test('authenticated mobile route matrix with read-only API mocks', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '390x844', 'Authenticated route matrix runs once at the reference phone viewport');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-routes');
    await installMockMemberSession(context);
    const audits: RouteAudit[] = [];

    for (const [key, routePath] of AUTHENTICATED_ROUTES) {
      const page = await context.newPage();
      try {
        audits.push(await auditRoute(page, testInfo, key, routePath, evidenceDir));
      } finally {
        await page.close();
      }
    }

    await writeRouteReport(evidenceDir, 'authenticated-routes', audits);
    console.log(`MEMBER_MOBILE_AUTH_ROUTE_AUDIT ${JSON.stringify(summarizeRouteAudits(audits))}`);
  });
});

async function auditRoute(
  page: Page,
  testInfo: TestInfo,
  key: string,
  requestedPath: string,
  evidenceDir: string,
): Promise<RouteAudit> {
  const capture = attachRuntimeCapture(page);
  await installPerformanceCollectors(page);
  const response = await page.goto(resolveUrl(requestedPath), {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  }).catch(() => null);
  await page.waitForTimeout(1_000);

  const metrics = await collectLayoutAudit(page);
  const findings = await collectFindings(page, metrics, response?.status() ?? null);
  const axeViolations = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
    .then((result) => result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 8).flatMap((node) => node.target.map(String)),
    })))
    .catch((error: unknown) => [{
      id: 'axe-runtime-failure',
      impact: 'critical',
      help: error instanceof Error ? error.message : String(error),
      nodes: 0,
      targets: [],
    }]);

  for (const violation of axeViolations) {
    findings.push({
      severity: violation.impact === 'critical' || violation.impact === 'serious' ? 'high' : 'medium',
      code: `axe:${violation.id}`,
      message: `${violation.help} (${violation.nodes} nodes)`,
      value: violation.targets,
    });
  }

  const runtime = capture.snapshot();
  for (const error of runtime.pageErrors) {
    findings.push({ severity: 'critical', code: 'page-error', message: error });
  }
  for (const error of runtime.consoleErrors) {
    findings.push({ severity: 'high', code: 'console-error', message: error });
  }
  for (const bad of runtime.badResponses) {
    findings.push({ severity: bad.status >= 500 ? 'high' : 'medium', code: 'http-response', message: `${bad.status} ${bad.url}` });
  }

  const routeDir = path.join(evidenceDir, sanitizeFileName(key));
  await fs.mkdir(routeDir, { recursive: true });
  await page.screenshot({ path: path.join(routeDir, 'viewport.png'), fullPage: false, animations: 'disabled' });
  await writeJson(path.join(routeDir, 'audit.json'), {
    key,
    requestedPath,
    finalUrl: page.url(),
    status: response?.status() ?? null,
    title: await page.title(),
    viewport: testInfo.project.use.viewport,
    metrics,
    findings,
    runtime,
    axeViolations,
    performance: await readPerformance(page),
  });

  return {
    key,
    requestedPath,
    finalUrl: page.url(),
    status: response?.status() ?? null,
    title: await page.title(),
    viewport: testInfo.project.use.viewport as { width: number; height: number },
    metrics,
    findings,
    consoleErrors: runtime.consoleErrors,
    pageErrors: runtime.pageErrors,
    failedRequests: runtime.failedRequests,
    badResponses: runtime.badResponses,
    axeViolations,
  };
}

async function collectFindings(page: Page, metrics: Record<string, unknown>, status: number | null) {
  const findings: Finding[] = [];
  const numeric = (key: string) => Number(metrics[key] ?? 0);

  if (status !== null && status >= 400) {
    findings.push({ severity: status >= 500 ? 'critical' : 'high', code: 'route-http-status', message: `Route returned HTTP ${status}` });
  }
  if (numeric('documentScrollWidth') > numeric('documentClientWidth') + 1) {
    findings.push({
      severity: 'high',
      code: 'horizontal-overflow',
      message: `Document width ${numeric('documentScrollWidth')} exceeds viewport ${numeric('documentClientWidth')}`,
    });
  }

  const domFindings = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const visible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || 1) > 0
        && rect.width > 0
        && rect.height > 0;
    };
    const describe = (element: Element) => {
      const id = element.id ? `#${element.id}` : '';
      const classes = element instanceof HTMLElement && element.classList.length
        ? `.${Array.from(element.classList).slice(0, 4).join('.')}`
        : '';
      return `${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const accessibleName = (element: Element) => {
      const aria = element.getAttribute('aria-label')?.trim();
      const title = element.getAttribute('title')?.trim();
      const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      const imageAlt = element.querySelector('img')?.getAttribute('alt')?.trim();
      return aria || title || text || imageAlt || '';
    };

    const interactive = Array.from(document.querySelectorAll('a,button,input,select,textarea,[role="button"],[role="tab"]'))
      .filter(visible);
    const tinyTargets = interactive.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width >= 44 && rect.height >= 44) return [];
      return [{ selector: describe(element), width: Math.round(rect.width), height: Math.round(rect.height), name: accessibleName(element) }];
    });
    const unnamed = interactive.flatMap((element) => accessibleName(element)
      ? []
      : [{ selector: describe(element), role: element.getAttribute('role') ?? element.tagName.toLowerCase() }]);
    const overflow = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.right <= viewportWidth + 1 && rect.left >= -1) return [];
      return [{ selector: describe(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }];
    }).slice(0, 80);
    const brokenImages = Array.from(document.images).filter(visible).flatMap((image) => (
      image.complete && image.naturalWidth === 0
        ? [{ selector: describe(image), src: image.currentSrc || image.src, alt: image.alt }]
        : []
    ));
    const unlabeledInputs = Array.from(document.querySelectorAll('input,select,textarea')).filter(visible).flatMap((element) => {
      const id = element.id;
      const hasLabel = Boolean(
        element.getAttribute('aria-label')
        || element.getAttribute('aria-labelledby')
        || element.closest('label')
        || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
      );
      return hasLabel ? [] : [{ selector: describe(element), type: element.getAttribute('type') ?? element.tagName.toLowerCase() }];
    });
    const clippedText = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      if (!(element instanceof HTMLElement)) return [];
      const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text || element.children.length > 0) return [];
      const style = getComputedStyle(element);
      const clipped = element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
      if (!clipped) return [];
      return [{
        selector: describe(element),
        text: text.slice(0, 100),
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        overflow: `${style.overflowX}/${style.overflowY}`,
        textOverflow: style.textOverflow,
      }];
    }).slice(0, 80);
    const tinyText = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      if (!(element instanceof HTMLElement) || element.children.length > 0) return [];
      const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text) return [];
      const size = Number.parseFloat(getComputedStyle(element).fontSize);
      return size < 11 ? [{ selector: describe(element), text: text.slice(0, 100), fontSize: size }] : [];
    }).slice(0, 80);
    const fixedOrSticky = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      const style = getComputedStyle(element);
      if (style.position !== 'fixed' && style.position !== 'sticky') return [];
      const rect = element.getBoundingClientRect();
      return [{
        selector: describe(element),
        position: style.position,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        zIndex: style.zIndex,
        intersectsViewport: rect.bottom > 0 && rect.top < viewportHeight,
      }];
    });
    const duplicateIds = Array.from(document.querySelectorAll('[id]')).reduce<Record<string, number>>((result, element) => {
      result[element.id] = (result[element.id] ?? 0) + 1;
      return result;
    }, {});

    return {
      tinyTargets,
      unnamed,
      overflow,
      brokenImages,
      unlabeledInputs,
      clippedText,
      tinyText,
      fixedOrSticky,
      duplicateIds: Object.entries(duplicateIds).filter(([, count]) => count > 1),
    };
  });

  if (domFindings.overflow.length) findings.push({ severity: 'high', code: 'elements-outside-viewport', message: `${domFindings.overflow.length} visible elements extend outside the viewport`, value: domFindings.overflow });
  if (domFindings.brokenImages.length) findings.push({ severity: 'high', code: 'broken-images', message: `${domFindings.brokenImages.length} visible images failed to load`, value: domFindings.brokenImages });
  if (domFindings.unnamed.length) findings.push({ severity: 'high', code: 'unnamed-interactive', message: `${domFindings.unnamed.length} visible interactive elements have no accessible name`, value: domFindings.unnamed });
  if (domFindings.unlabeledInputs.length) findings.push({ severity: 'high', code: 'unlabeled-inputs', message: `${domFindings.unlabeledInputs.length} visible form controls have no programmatic label`, value: domFindings.unlabeledInputs });
  if (domFindings.tinyTargets.length) findings.push({ severity: 'medium', code: 'touch-target-under-44', message: `${domFindings.tinyTargets.length} visible touch targets are smaller than 44×44px`, value: domFindings.tinyTargets });
  if (domFindings.clippedText.length) findings.push({ severity: 'medium', code: 'clipped-text', message: `${domFindings.clippedText.length} text nodes are clipped`, value: domFindings.clippedText });
  if (domFindings.tinyText.length) findings.push({ severity: 'medium', code: 'text-under-11px', message: `${domFindings.tinyText.length} visible text nodes use font sizes below 11px`, value: domFindings.tinyText });
  if (domFindings.duplicateIds.length) findings.push({ severity: 'high', code: 'duplicate-ids', message: `${domFindings.duplicateIds.length} duplicate IDs detected`, value: domFindings.duplicateIds });
  findings.push({ severity: 'info', code: 'fixed-sticky-inventory', message: `${domFindings.fixedOrSticky.length} visible fixed/sticky elements`, value: domFindings.fixedOrSticky });

  return findings;
}

async function collectLayoutAudit(page: Page) {
  return page.evaluate(() => {
    const documentElement = document.documentElement;
    const body = document.body;
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    const rootRect = root?.getBoundingClientRect();
    return {
      pathname: location.pathname,
      search: location.search,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentClientWidth: documentElement.clientWidth,
      documentScrollWidth: documentElement.scrollWidth,
      documentClientHeight: documentElement.clientHeight,
      documentScrollHeight: documentElement.scrollHeight,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyOverflowX: getComputedStyle(body).overflowX,
      bodyOverflowY: getComputedStyle(body).overflowY,
      htmlOverflowX: getComputedStyle(documentElement).overflowX,
      htmlOverflowY: getComputedStyle(documentElement).overflowY,
      scrollingElement: document.scrollingElement?.tagName.toLowerCase() ?? '',
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      rootLeft: rootRect?.left ?? null,
      rootRight: rootRect?.right ?? null,
      rootWidth: rootRect?.width ?? null,
      mobileViewportMode: documentElement.dataset.memberViewportMode ?? '',
      mobileSessionReady: documentElement.dataset.memberSessionReady ?? '',
      mobileMemberNav: documentElement.dataset.mobileMemberNav ?? '',
      visibleDialogs: Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      }).length,
    };
  });
}

async function collectOverlayAudit(page: Page, locator: ReturnType<Page['locator']>) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      position: style.position,
      zIndex: style.zIndex,
      insideViewport: rect.left >= -1
        && rect.top >= -1
        && rect.right <= window.innerWidth + 1
        && rect.bottom <= window.innerHeight + 1,
    };
  });
}

async function collectInteractiveAudit(locator: ReturnType<Page['locator']>) {
  return locator.locator('a,button,input,select,textarea,[role="button"],[role="tab"]').evaluateAll((elements) => elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  }).map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
      ariaLabel: element.getAttribute('aria-label'),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      disabled: element instanceof HTMLButtonElement || element instanceof HTMLInputElement ? element.disabled : false,
    };
  }));
}

async function collectBottomNavigation(page: Page) {
  const navCandidates = page.locator('nav:visible').filter({ has: page.locator('[data-mobile-member-popup]') });
  const candidateCount = await navCandidates.count();
  const nav = candidateCount ? navCandidates.last() : page.locator('body');
  return {
    candidateCount,
    bounds: candidateCount ? await collectOverlayAudit(page, nav) : null,
    items: candidateCount ? await collectInteractiveAudit(nav) : [],
  };
}

async function collectFixedElements(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('body *')).flatMap((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if ((style.position !== 'fixed' && style.position !== 'sticky') || rect.width <= 0 || rect.height <= 0) return [];
    return [{
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      position: style.position,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      zIndex: style.zIndex,
    }];
  }));
}

function attachRuntimeCapture(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: Array<{ method: string; resourceType: string; url: string; failure: string }> = [];
  const badResponses: Array<{ status: number; url: string }> = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|ERR_BLOCKED_BY_CLIENT/i.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({
    method: request.method(),
    resourceType: request.resourceType(),
    url: sanitizeUrl(request.url()),
    failure: request.failure()?.errorText ?? 'unknown',
  }));
  page.on('response', (response) => {
    if (response.status() < 400) return;
    badResponses.push({ status: response.status(), url: sanitizeUrl(response.url()) });
  });

  return {
    snapshot: () => ({ consoleErrors, pageErrors, failedRequests, badResponses }),
  };
}

async function installPerformanceCollectors(page: Page) {
  await page.addInitScript(() => {
    const auditWindow = window as Window & {
      __memberMobileAudit?: { cls: number; lcp: number; longTasks: number };
    };
    auditWindow.__memberMobileAudit = { cls: 0, lcp: 0, longTasks: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!shift.hadRecentInput) auditWindow.__memberMobileAudit!.cls += shift.value ?? 0;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries.at(-1);
        if (last) auditWindow.__memberMobileAudit!.lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        auditWindow.__memberMobileAudit!.longTasks += list.getEntries().length;
      }).observe({ type: 'longtask', buffered: true });
    } catch {}
  });
}

async function readPerformance(page: Page) {
  return page.evaluate(() => {
    const auditWindow = window as Window & {
      __memberMobileAudit?: { cls: number; lcp: number; longTasks: number };
    };
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {
      domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd) : null,
      loadEvent: navigation ? Math.round(navigation.loadEventEnd) : null,
      responseEnd: navigation ? Math.round(navigation.responseEnd) : null,
      transferSize: navigation?.transferSize ?? null,
      resourceCount: resources.length,
      resourceTransferSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
      imageResources: resources.filter((resource) => resource.initiatorType === 'img').length,
      scriptResources: resources.filter((resource) => resource.initiatorType === 'script').length,
      cssResources: resources.filter((resource) => resource.initiatorType === 'css' || resource.initiatorType === 'link').length,
      cls: auditWindow.__memberMobileAudit?.cls ?? null,
      lcp: auditWindow.__memberMobileAudit?.lcp ?? null,
      longTasks: auditWindow.__memberMobileAudit?.longTasks ?? null,
    };
  });
}

async function installMockMemberSession(context: BrowserContext) {
  await context.addInitScript(() => {
    localStorage.setItem('member_access_token', 'mobile-audit-access-token');
    localStorage.setItem('member_refresh_token', 'mobile-audit-refresh-token');
  });

  await context.route('**/member/wallet', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        currency: 'THB',
        balance: '12345.67',
        availableBalance: '12000.00',
        lockedBalance: '345.67',
        status: 'active',
      }),
    });
  });
  await context.route('**/member/auth/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'audit-member',
        username: 'NOA***999',
        displayName: 'สมาชิกตรวจสอบมือถือ',
        phone: '0890000000',
        email: 'audit@example.com',
        status: 'active',
        vipLevel: 'VIP 3',
        avatarUrl: '/images/avatar/7.webp',
        referralLink: '/affiliate?ref=audit-member',
      }),
    });
  });
  await context.route('**/member/auth/security', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ twoFactorEnabled: false }) });
  });
  await context.route('**/member/auth/sessions**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
  });
  await context.route('**/member/notifications**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, pendingCount: 0 }) });
  });
  await context.route('**/member/bank-accounts**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
  });
  await context.route('**/member/bonus**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], balance: '0.00' }) });
  });
  await context.route('**/member/affiliate**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], balance: '0.00', referralLink: '/affiliate?ref=audit-member' }) });
  });
  await context.route('**/member/commission**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], balance: '0.00' }) });
  });
  await context.route('**/member/history**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0 }) });
  });
  await context.route('**/member/deposit**', async (route) => {
    const method = route.request().method();
    await route.fulfill({
      status: method === 'GET' ? 200 : 422,
      contentType: 'application/json',
      body: JSON.stringify(method === 'GET' ? { items: [], methods: [] } : { message: 'Blocked by read-only mobile audit' }),
    });
  });
  await context.route('**/member/withdraw**', async (route) => {
    const method = route.request().method();
    await route.fulfill({
      status: method === 'GET' ? 200 : 422,
      contentType: 'application/json',
      body: JSON.stringify(method === 'GET' ? { items: [], methods: [] } : { message: 'Blocked by read-only mobile audit' }),
    });
  });
}

async function writeRouteReport(evidenceDir: string, name: string, audits: RouteAudit[]) {
  await writeJson(path.join(evidenceDir, `${name}.json`), audits);
  const lines = [
    `# ${name}`,
    '',
    '| Route | Status | Final URL | Critical | High | Medium | Axe | Broken/Network |',
    '|---|---:|---|---:|---:|---:|---:|---:|',
  ];
  for (const audit of audits) {
    const count = (severity: Severity) => audit.findings.filter((finding) => finding.severity === severity).length;
    lines.push(`| ${audit.requestedPath} | ${audit.status ?? '-'} | ${audit.finalUrl.replace(/\|/g, '%7C')} | ${count('critical')} | ${count('high')} | ${count('medium')} | ${audit.axeViolations.length} | ${audit.failedRequests.length + audit.badResponses.length} |`);
  }
  lines.push('', '## Findings', '');
  for (const audit of audits) {
    lines.push(`### ${audit.requestedPath}`);
    if (!audit.findings.length) lines.push('- No findings recorded.');
    for (const finding of audit.findings) {
      lines.push(`- **${finding.severity.toUpperCase()} ${finding.code}**: ${finding.message}`);
    }
    lines.push('');
  }
  await fs.writeFile(path.join(evidenceDir, `${name}.md`), lines.join('\n'), 'utf8');
}

function summarizeRouteAudits(audits: RouteAudit[]) {
  const findings = audits.flatMap((audit) => audit.findings.map((finding) => ({ route: audit.requestedPath, ...finding })));
  return {
    routes: audits.length,
    httpFailures: audits.filter((audit) => (audit.status ?? 200) >= 400).map((audit) => ({ route: audit.requestedPath, status: audit.status })),
    redirected: audits.filter((audit) => new URL(audit.finalUrl).pathname !== audit.requestedPath).map((audit) => ({ route: audit.requestedPath, final: new URL(audit.finalUrl).pathname })),
    critical: findings.filter((finding) => finding.severity === 'critical').length,
    high: findings.filter((finding) => finding.severity === 'high').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    topCodes: Object.entries(findings.reduce<Record<string, number>>((result, finding) => {
      result[finding.code] = (result[finding.code] ?? 0) + 1;
      return result;
    }, {})).sort((left, right) => right[1] - left[1]).slice(0, 12),
  };
}

function compactHomeSummary(report: Record<string, unknown>) {
  const top = report.top as Record<string, unknown>;
  const sticky = report.sticky as Record<string, unknown>;
  return {
    viewportWidth: top.viewportWidth,
    documentWidth: top.documentScrollWidth,
    headerTop: sticky.headerTop,
    railTop: sticky.railTop,
    categories: Array.isArray(report.categories) ? report.categories.length : 0,
    tabs: Array.isArray(report.highlightTabs) ? report.highlightTabs.length : 0,
    bodyOverflowAfterDrawerClose: report.bodyOverflowAfterDrawerClose,
  };
}

function compactPopupSummary(popups: Array<Record<string, unknown>>) {
  return {
    total: popups.length,
    missing: popups.filter((popup) => popup.visible === false).map((popup) => popup.kind),
    outsideViewport: popups.filter((popup) => {
      const overlay = popup.overlay as Record<string, unknown> | undefined;
      return overlay?.insideViewport === false;
    }).map((popup) => popup.kind),
    unsupportedLanguage: popups.find((popup) => popup.kind === 'language')?.unsupportedLanguageClick ?? null,
  };
}

async function prepareEvidenceDirectory(testInfo: TestInfo, section: string) {
  const directory = path.resolve('artifacts/member-mobile-audit', testInfo.project.name, section);
  await fs.mkdir(directory, { recursive: true });
  return directory;
}

async function writeJson(filePath: string, value: unknown) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function resolveUrl(routePath: string) {
  return new URL(routePath, BASE_URL).toString();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
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

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'route';
}
