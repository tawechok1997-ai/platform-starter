import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Locator, type Page, type Route, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.MEMBER_HOME_URL
  ?? 'https://platformweb-member-production.up.railway.app/';

const PUBLIC_ROUTES = [
  ['home', '/'],
  ['login', '/login'],
  ['register', '/register'],
  ['browse-games', '/browse/games'],
  ['promotions', '/browse/promotions?view=promotion'],
  ['activities', '/browse/promotions?view=activity'],
  ['news', '/browse/promotions?view=news'],
  ['games', '/games'],
  ['search', '/search'],
  ['live', '/live'],
  ['guide', '/guide'],
  ['contact', '/contact'],
  ['legal', '/legal'],
  ['maintenance', '/maintenance'],
  ['session-expired', '/session-expired'],
  ['status', '/status'],
] as const;

const AUTHENTICATED_ROUTES = [
  ['home', '/'],
  ['deposit', '/deposit'],
  ['withdraw', '/withdraw'],
  ['bonus', '/bonus'],
  ['affiliate', '/affiliate'],
  ['support', '/support'],
  ['bank-accounts', '/bank-accounts'],
  ['profile', '/profile'],
  ['profile-avatar', '/profile/avatar'],
  ['notifications', '/notifications'],
  ['games', '/games'],
  ['search', '/search'],
  ['browse-games', '/browse/games'],
  ['promotions', '/browse/promotions?view=promotion'],
] as const;

const SHARED_POPUPS = ['all', 'promotion', 'activity', 'news', 'language'] as const;

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

type Finding = {
  severity: Severity;
  code: string;
  message: string;
  value?: unknown;
};

type RuntimeCapture = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: Array<{ method: string; resourceType: string; url: string; failure: string }>;
  badResponses: Array<{ status: number; url: string }>;
};

type RouteAudit = {
  key: string;
  requestedPath: string;
  finalUrl: string;
  status: number | null;
  contentType: string | null;
  title: string;
  metrics: Record<string, unknown>;
  findings: Finding[];
  runtime: RuntimeCapture;
  axe: Array<{ id: string; impact: string | null | undefined; help: string; nodes: number; targets: string[] }>;
};

test.describe('Member desktop full Production audit', () => {
  test('home geometry, columns, header, jackpot rail, footer and responsive ownership', async ({ page }, testInfo) => {
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'home-geometry');
    const runtime = captureRuntime(page);
    await installPerformanceCollectors(page);

    const response = await page.goto(resolveUrl('/'), {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await page.waitForTimeout(1_400);

    const report: Record<string, unknown> = {
      status: response?.status() ?? null,
      viewport: testInfo.project.use.viewport,
      top: await readPageMetrics(page),
      regions: await readLandmarkGeometry(page),
      columns: await inferDesktopColumns(page),
      headerNavigation: await readInteractive(page.locator('header, nav').first()),
      visibleText: normalizeText(await page.locator('body').innerText()).slice(0, 5_000),
    };

    await page.screenshot({
      path: path.join(evidenceDir, '01-top.png'),
      fullPage: false,
      animations: 'disabled',
    });

    const beforeScroll = await readStickyInventory(page);
    await page.evaluate(() => window.scrollTo({ top: Math.min(900, document.documentElement.scrollHeight / 3), behavior: 'auto' }));
    await page.waitForTimeout(220);
    report.beforeScroll = beforeScroll;
    report.afterScroll = await readStickyInventory(page);
    report.middle = await readPageMetrics(page);
    await page.screenshot({
      path: path.join(evidenceDir, '02-middle.png'),
      fullPage: false,
      animations: 'disabled',
    });

    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' }));
    await page.waitForTimeout(220);
    report.bottom = await readPageMetrics(page);
    report.footer = await readFooterGeometry(page);
    report.fixedAtBottom = await readStickyInventory(page);
    await page.screenshot({
      path: path.join(evidenceDir, '03-bottom.png'),
      fullPage: false,
      animations: 'disabled',
    });

    report.performance = await readPerformance(page);
    report.runtime = runtime.snapshot();
    await writeJson(path.join(evidenceDir, 'home-geometry.json'), report);
    console.log(`MEMBER_DESKTOP_HOME_AUDIT ${JSON.stringify(compactHomeSummary(report))}`);
  });

  test('guest route matrix: layout, runtime, assets, forms and WCAG', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '1440x900', 'Route matrix runs once at the reference desktop viewport');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'guest-routes');
    const audits: RouteAudit[] = [];

    for (const [key, routePath] of PUBLIC_ROUTES) {
      const page = await context.newPage();
      try {
        audits.push(await auditRoute(page, key, routePath, evidenceDir));
      } finally {
        await page.close();
      }
    }

    await writeRouteReport(evidenceDir, 'guest-routes', audits);
    console.log(`MEMBER_DESKTOP_GUEST_AUDIT ${JSON.stringify(summarizeRouteAudits(audits))}`);
  });

  test('guest game login, login/register modal cleanup and shared content popups', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== '1440x900', 'Desktop interaction audit runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'guest-interactions');
    const runtime = captureRuntime(page);

    await page.goto(resolveUrl('/'), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1_000);
    const initialMetrics = await readPageMetrics(page);
    const report: Record<string, unknown> = { initialMetrics };

    const gameAction = page.locator([
      '[data-public-game-action="login"]',
      '[data-game-id]',
      '[data-game-code]',
      '[data-game-name]',
      'a.source-highlight-game',
      'a.source-popular-card',
      '.reference-game-tile',
    ].join(',')).filter({ visible: true }).first();

    if (await gameAction.isVisible().catch(() => false)) {
      report.gameActionBefore = await readBounds(gameAction);
      await gameAction.click();
      await page.waitForTimeout(350);
      report.gameClick = {
        url: page.url(),
        dialogs: await readVisibleDialogs(page),
        bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
      };
      await page.screenshot({ path: path.join(evidenceDir, '01-game-login.png'), fullPage: false, animations: 'disabled' });
      await closeTopDialog(page);
      await page.waitForTimeout(160);
      report.afterGameLoginClose = {
        dialogs: await readVisibleDialogs(page),
        bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
        metrics: await readPageMetrics(page),
      };
    } else {
      report.gameClick = { skipped: true, reason: 'No visible game action found' };
    }

    await page.goto(resolveUrl('/?auth=login'), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(500);
    report.loginModal = {
      dialogs: await readVisibleDialogs(page),
      forms: await readForms(page),
      bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
    };
    await page.screenshot({ path: path.join(evidenceDir, '02-login-modal.png'), fullPage: false, animations: 'disabled' });
    await closeTopDialog(page);
    await page.waitForTimeout(150);
    report.loginModalAfterClose = {
      url: page.url(),
      dialogs: await readVisibleDialogs(page),
      bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
    };

    await page.goto(resolveUrl('/?auth=register'), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(500);
    report.registerModal = {
      dialogs: await readVisibleDialogs(page),
      forms: await readForms(page),
      bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
    };
    await page.screenshot({ path: path.join(evidenceDir, '03-register-modal.png'), fullPage: false, animations: 'disabled' });
    await closeTopDialog(page);

    await page.goto(resolveUrl('/'), { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(700);
    const popups: Array<Record<string, unknown>> = [];
    for (const kind of SHARED_POPUPS) {
      await closeAllDialogs(page);
      await page.evaluate((popupKind) => {
        window.dispatchEvent(new CustomEvent('member:open-shared-popup', { detail: { kind: popupKind } }));
      }, kind);
      await page.waitForTimeout(180);
      const dialog = page.locator('[role="dialog"]:visible').last();
      const visible = await dialog.isVisible().catch(() => false);
      const popup: Record<string, unknown> = { kind, visible };
      if (visible) {
        popup.bounds = await readBounds(dialog);
        popup.interactive = await readInteractive(dialog);
        popup.text = normalizeText(await dialog.textContent()).slice(0, 2_000);
        popup.bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
        await page.screenshot({
          path: path.join(evidenceDir, `popup-${kind}.png`),
          fullPage: false,
          animations: 'disabled',
        });
      }
      popups.push(popup);
    }
    report.sharedPopups = popups;
    report.runtime = runtime.snapshot();
    await writeJson(path.join(evidenceDir, 'guest-interactions.json'), report);
    console.log(`MEMBER_DESKTOP_GUEST_INTERACTIONS ${JSON.stringify({
      gameActionFound: !(report.gameClick as { skipped?: boolean }).skipped,
      popupCount: popups.length,
      missingPopups: popups.filter((popup) => popup.visible === false).map((popup) => popup.kind),
      outsideViewport: popups.filter((popup) => (popup.bounds as { insideViewport?: boolean } | undefined)?.insideViewport === false).map((popup) => popup.kind),
      pageErrors: runtime.snapshot().pageErrors.length,
      consoleErrors: runtime.snapshot().consoleErrors.length,
    })}`);
  });

  test('read-only authenticated route matrix and finance layout', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '1440x900', 'Authenticated route matrix runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-routes');
    await installReadOnlyMemberSession(context);
    const audits: RouteAudit[] = [];

    for (const [key, routePath] of AUTHENTICATED_ROUTES) {
      const page = await context.newPage();
      try {
        audits.push(await auditRoute(page, key, routePath, evidenceDir));
      } finally {
        await page.close();
      }
    }

    await writeRouteReport(evidenceDir, 'authenticated-routes', audits);
    console.log(`MEMBER_DESKTOP_AUTH_ROUTES ${JSON.stringify(summarizeRouteAudits(audits))}`);
  });

  test('authenticated header, account controls, finance actions and popup ownership', async ({ context }, testInfo) => {
    test.skip(testInfo.project.name !== '1440x900', 'Authenticated interaction audit runs once');
    const evidenceDir = await prepareEvidenceDirectory(testInfo, 'authenticated-interactions');
    await installReadOnlyMemberSession(context);
    const page = await context.newPage();
    const runtime = captureRuntime(page);

    try {
      await page.goto(resolveUrl('/'), { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(900);
      const report: Record<string, unknown> = {
        url: page.url(),
        metrics: await readPageMetrics(page),
        headerInteractive: await readInteractive(page.locator('header, nav').first()),
      };

      const controls = page.locator('header button:visible, header a:visible, nav button:visible, nav a:visible');
      report.headerControls = await controls.evaluateAll((elements) => elements.map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
        ariaLabel: element.getAttribute('aria-label'),
        href: element instanceof HTMLAnchorElement ? element.getAttribute('href') : null,
        width: Math.round(element.getBoundingClientRect().width),
        height: Math.round(element.getBoundingClientRect().height),
      })));

      const actions = [
        { key: 'deposit', pattern: /ฝากเงิน|deposit/i },
        { key: 'withdraw', pattern: /ถอนเงิน|withdraw/i },
        { key: 'profile', pattern: /โปรไฟล์|บัญชี|profile|account|NOA/i },
        { key: 'notification', pattern: /แจ้งเตือน|notification/i },
      ];
      const actionResults: Array<Record<string, unknown>> = [];
      for (const action of actions) {
        await closeAllDialogs(page);
        const candidates = page.getByRole('button', { name: action.pattern }).or(page.getByRole('link', { name: action.pattern }));
        const count = await candidates.count();
        let opened = false;
        for (let index = 0; index < count; index += 1) {
          const candidate = candidates.nth(index);
          if (!await candidate.isVisible().catch(() => false)) continue;
          await candidate.click().catch(() => undefined);
          await page.waitForTimeout(250);
          opened = true;
          break;
        }
        actionResults.push({
          key: action.key,
          found: count > 0,
          opened,
          url: page.url(),
          dialogs: await readVisibleDialogs(page),
          menus: await readVisibleMenus(page),
          bodyOverflow: await page.evaluate(() => getComputedStyle(document.body).overflow),
        });
        await page.screenshot({
          path: path.join(evidenceDir, `action-${action.key}.png`),
          fullPage: false,
          animations: 'disabled',
        });
      }

      report.actions = actionResults;
      report.runtime = runtime.snapshot();
      await writeJson(path.join(evidenceDir, 'authenticated-interactions.json'), report);
      console.log(`MEMBER_DESKTOP_AUTH_INTERACTIONS ${JSON.stringify({
        actions: actionResults.map((action) => ({ key: action.key, found: action.found, opened: action.opened })),
        pageErrors: runtime.snapshot().pageErrors.length,
        consoleErrors: runtime.snapshot().consoleErrors.length,
      })}`);
    } finally {
      await page.close();
    }
  });
});

async function auditRoute(page: Page, key: string, requestedPath: string, evidenceDir: string): Promise<RouteAudit> {
  const runtime = captureRuntime(page);
  await installPerformanceCollectors(page);
  const response = await page.goto(resolveUrl(requestedPath), {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  }).catch(() => null);
  await page.waitForTimeout(900);

  const metrics = await readPageMetrics(page);
  const findings = await collectFindings(page, metrics, response?.status() ?? null);
  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
    .then((result) => result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 10).flatMap((node) => node.target.map(String)),
    })))
    .catch((error: unknown) => [{
      id: 'axe-runtime-failure',
      impact: 'critical',
      help: error instanceof Error ? error.message : String(error),
      nodes: 0,
      targets: [],
    }]);

  for (const violation of axe) {
    findings.push({
      severity: violation.impact === 'critical' || violation.impact === 'serious' ? 'high' : 'medium',
      code: `axe:${violation.id}`,
      message: `${violation.help} (${violation.nodes} nodes)`,
      value: violation.targets,
    });
  }

  const captured = runtime.snapshot();
  for (const error of captured.pageErrors) findings.push({ severity: 'critical', code: 'page-error', message: error });
  for (const error of captured.consoleErrors) findings.push({ severity: 'high', code: 'console-error', message: error });
  for (const failed of captured.failedRequests) findings.push({ severity: 'medium', code: 'request-failed', message: `${failed.method} ${failed.url}: ${failed.failure}` });
  for (const bad of captured.badResponses) findings.push({ severity: bad.status >= 500 ? 'high' : 'medium', code: 'http-response', message: `${bad.status} ${bad.url}` });

  const routeDir = path.join(evidenceDir, sanitizeFileName(key));
  await fs.mkdir(routeDir, { recursive: true });
  await page.screenshot({ path: path.join(routeDir, 'viewport.png'), fullPage: false, animations: 'disabled' });

  const audit: RouteAudit = {
    key,
    requestedPath,
    finalUrl: page.url(),
    status: response?.status() ?? null,
    contentType: response?.headers()['content-type'] ?? null,
    title: await page.title(),
    metrics,
    findings,
    runtime: captured,
    axe,
  };
  await writeJson(path.join(routeDir, 'audit.json'), {
    ...audit,
    forms: await readForms(page),
    landmarks: await readLandmarkGeometry(page),
    performance: await readPerformance(page),
  });
  return audit;
}

async function collectFindings(page: Page, metrics: Record<string, unknown>, status: number | null) {
  const findings: Finding[] = [];
  const number = (key: string) => Number(metrics[key] ?? 0);

  if (status !== null && status >= 400) {
    findings.push({ severity: status >= 500 ? 'critical' : 'high', code: 'route-http-status', message: `Route returned HTTP ${status}` });
  }
  if (number('documentScrollWidth') > number('documentClientWidth') + 1) {
    findings.push({
      severity: 'high',
      code: 'horizontal-overflow',
      message: `Document width ${number('documentScrollWidth')} exceeds viewport ${number('documentClientWidth')}`,
    });
  }

  const dom = await page.evaluate(() => {
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
    const name = (element: Element) => {
      const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      return element.getAttribute('aria-label')?.trim()
        || element.getAttribute('title')?.trim()
        || text
        || element.querySelector('img')?.getAttribute('alt')?.trim()
        || '';
    };

    const interactive = Array.from(document.querySelectorAll('a,button,input,select,textarea,[role="button"],[role="tab"],[role="menuitem"]')).filter(visible);
    const tinyTargets = interactive.flatMap((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width < 32 || rect.height < 32
        ? [{ selector: describe(element), width: Math.round(rect.width), height: Math.round(rect.height), name: name(element) }]
        : [];
    }).slice(0, 120);
    const unnamed = interactive.flatMap((element) => name(element)
      ? []
      : [{ selector: describe(element), role: element.getAttribute('role') ?? element.tagName.toLowerCase() }]);
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
    const brokenImages = Array.from(document.images).filter(visible).flatMap((image) => (
      image.complete && image.naturalWidth === 0
        ? [{ selector: describe(image), src: image.currentSrc || image.src, alt: image.alt }]
        : []
    ));
    const outsideViewport = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.left >= -1 && rect.right <= window.innerWidth + 1) return [];
      const style = getComputedStyle(element);
      const owner = element.parentElement ? getComputedStyle(element.parentElement) : null;
      const intentionalRail = style.overflowX === 'auto'
        || owner?.overflowX === 'auto'
        || element.closest('[role="tablist"], [data-carousel], [data-horizontal-scroll], .swiper, .slick-slider');
      return intentionalRail ? [] : [{ selector: describe(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }];
    }).slice(0, 100);
    const clippedText = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      if (!(element instanceof HTMLElement) || element.children.length > 0) return [];
      const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text) return [];
      const clipped = element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
      if (!clipped) return [];
      const style = getComputedStyle(element);
      return [{
        selector: describe(element), text: text.slice(0, 120),
        scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight, clientHeight: element.clientHeight,
        overflow: `${style.overflowX}/${style.overflowY}`, textOverflow: style.textOverflow,
      }];
    }).slice(0, 100);
    const tinyText = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      if (!(element instanceof HTMLElement) || element.children.length > 0) return [];
      const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (!text) return [];
      const size = Number.parseFloat(getComputedStyle(element).fontSize);
      return size < 11 ? [{ selector: describe(element), text: text.slice(0, 100), fontSize: size }] : [];
    }).slice(0, 100);
    const duplicateIds = Array.from(document.querySelectorAll('[id]')).reduce<Record<string, number>>((result, element) => {
      result[element.id] = (result[element.id] ?? 0) + 1;
      return result;
    }, {});
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]')).filter(visible).map(describe);
    const fixedSticky = Array.from(document.querySelectorAll('body *')).filter(visible).flatMap((element) => {
      const style = getComputedStyle(element);
      if (style.position !== 'fixed' && style.position !== 'sticky') return [];
      const rect = element.getBoundingClientRect();
      return [{ selector: describe(element), position: style.position, top: Math.round(rect.top), bottom: Math.round(rect.bottom), zIndex: style.zIndex }];
    });
    return {
      tinyTargets,
      unnamed,
      unlabeledInputs,
      brokenImages,
      outsideViewport,
      clippedText,
      tinyText,
      duplicateIds: Object.entries(duplicateIds).filter(([, count]) => count > 1),
      dialogs,
      fixedSticky,
    };
  });

  if (dom.brokenImages.length) findings.push({ severity: 'high', code: 'broken-images', message: `${dom.brokenImages.length} visible images failed to load`, value: dom.brokenImages });
  if (dom.outsideViewport.length) findings.push({ severity: 'high', code: 'elements-outside-viewport', message: `${dom.outsideViewport.length} visible elements extend outside the viewport`, value: dom.outsideViewport });
  if (dom.unnamed.length) findings.push({ severity: 'high', code: 'unnamed-interactive', message: `${dom.unnamed.length} visible interactive elements have no accessible name`, value: dom.unnamed });
  if (dom.unlabeledInputs.length) findings.push({ severity: 'high', code: 'unlabeled-inputs', message: `${dom.unlabeledInputs.length} visible form controls have no programmatic label`, value: dom.unlabeledInputs });
  if (dom.tinyTargets.length) findings.push({ severity: 'medium', code: 'target-under-32', message: `${dom.tinyTargets.length} desktop targets are smaller than 32×32px`, value: dom.tinyTargets });
  if (dom.clippedText.length) findings.push({ severity: 'medium', code: 'clipped-text', message: `${dom.clippedText.length} text nodes are clipped`, value: dom.clippedText });
  if (dom.tinyText.length) findings.push({ severity: 'medium', code: 'text-under-11px', message: `${dom.tinyText.length} visible text nodes use font sizes below 11px`, value: dom.tinyText });
  if (dom.duplicateIds.length) findings.push({ severity: 'high', code: 'duplicate-ids', message: `${dom.duplicateIds.length} duplicate IDs detected`, value: dom.duplicateIds });
  findings.push({ severity: 'info', code: 'overlay-inventory', message: `${dom.dialogs.length} visible dialogs and ${dom.fixedSticky.length} fixed/sticky owners`, value: { dialogs: dom.dialogs, fixedSticky: dom.fixedSticky } });
  return findings;
}

async function readPageMetrics(page: Page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return {
      pathname: location.pathname,
      search: location.search,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentClientWidth: html.clientWidth,
      documentScrollWidth: html.scrollWidth,
      documentClientHeight: html.clientHeight,
      documentScrollHeight: html.scrollHeight,
      bodyClientWidth: body.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientHeight: body.clientHeight,
      bodyScrollHeight: body.scrollHeight,
      bodyOverflowX: getComputedStyle(body).overflowX,
      bodyOverflowY: getComputedStyle(body).overflowY,
      htmlOverflowX: getComputedStyle(html).overflowX,
      htmlOverflowY: getComputedStyle(html).overflowY,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      viewportMode: html.dataset.memberViewportMode ?? '',
      sessionReady: html.dataset.memberSessionReady ?? '',
      visibleDialogs: Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [aria-modal="true"]')).filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      }).length,
    };
  });
}

async function readLandmarkGeometry(page: Page) {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    return Array.from(document.querySelectorAll('header,nav,main,aside,footer,[role="banner"],[role="navigation"],[role="main"],[role="complementary"],[role="contentinfo"]'))
      .filter(visible)
      .slice(0, 80)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          id: element.id,
          className: String(element.className).slice(0, 200),
          left: Math.round(rect.left), top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom),
          width: Math.round(rect.width), height: Math.round(rect.height), position: style.position, zIndex: style.zIndex,
        };
      });
  });
}

async function inferDesktopColumns(page: Page) {
  return page.evaluate(() => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 100 && rect.height > 100 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const main = document.querySelector('main') ?? document.body;
    const mainRect = main.getBoundingClientRect();
    const candidates = Array.from(main.children).filter(visible).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        className: String(element.className).slice(0, 180),
        text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
        left: Math.round(rect.left), right: Math.round(rect.right), top: Math.round(rect.top),
        width: Math.round(rect.width), height: Math.round(rect.height),
      };
    });
    return {
      main: { left: Math.round(mainRect.left), right: Math.round(mainRect.right), width: Math.round(mainRect.width) },
      candidates,
      jackpotTextOwners: Array.from(document.querySelectorAll('body *')).filter((element) => /แจ็กพอต|jackpot/i.test(element.textContent ?? '') && element.children.length < 5).slice(0, 20).map((element) => {
        const rect = element.getBoundingClientRect();
        return { tag: element.tagName.toLowerCase(), className: String(element.className).slice(0, 180), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160) };
      }),
    };
  });
}

async function readFooterGeometry(page: Page) {
  const footer = page.locator('footer:visible').last();
  if (!await footer.isVisible().catch(() => false)) return null;
  return {
    bounds: await readBounds(footer),
    interactive: await readInteractive(footer),
    text: normalizeText(await footer.textContent()).slice(0, 3_000),
  };
}

async function readStickyInventory(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('body *')).flatMap((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if ((style.position !== 'fixed' && style.position !== 'sticky') || rect.width <= 0 || rect.height <= 0) return [];
    return [{
      tag: element.tagName.toLowerCase(), id: element.id, className: String(element.className).slice(0, 180),
      position: style.position, top: Math.round(rect.top), bottom: Math.round(rect.bottom),
      left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), height: Math.round(rect.height), zIndex: style.zIndex,
    }];
  }));
}

async function readBounds(locator: Locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: Math.round(rect.left), top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom),
      width: Math.round(rect.width), height: Math.round(rect.height), clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
      overflowX: style.overflowX, overflowY: style.overflowY, position: style.position, zIndex: style.zIndex,
      insideViewport: rect.left >= -1 && rect.top >= -1 && rect.right <= window.innerWidth + 1 && rect.bottom <= window.innerHeight + 1,
    };
  });
}

async function readInteractive(locator: Locator) {
  return locator.locator('a,button,input,select,textarea,[role="button"],[role="tab"],[role="menuitem"]').evaluateAll((elements) => elements.flatMap((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden') return [];
    return [{
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
      ariaLabel: element.getAttribute('aria-label'),
      role: element.getAttribute('role'),
      href: element instanceof HTMLAnchorElement ? element.getAttribute('href') : null,
      width: Math.round(rect.width), height: Math.round(rect.height),
      disabled: element instanceof HTMLButtonElement || element instanceof HTMLInputElement ? element.disabled : false,
    }];
  }));
}

async function readVisibleDialogs(page: Page) {
  const dialogs = page.locator('[role="dialog"]:visible, [aria-modal="true"]:visible');
  const result: Array<Record<string, unknown>> = [];
  for (let index = 0; index < await dialogs.count(); index += 1) {
    const dialog = dialogs.nth(index);
    result.push({
      bounds: await readBounds(dialog),
      text: normalizeText(await dialog.textContent()).slice(0, 1_200),
      interactive: await readInteractive(dialog),
    });
  }
  return result;
}

async function readVisibleMenus(page: Page) {
  const menus = page.locator('[role="menu"]:visible, [data-account-menu]:visible, [data-member-menu]:visible');
  const result: Array<Record<string, unknown>> = [];
  for (let index = 0; index < await menus.count(); index += 1) {
    const menu = menus.nth(index);
    result.push({ bounds: await readBounds(menu), text: normalizeText(await menu.textContent()).slice(0, 1_000), interactive: await readInteractive(menu) });
  }
  return result;
}

async function readForms(page: Page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('form')).map((form) => ({
    action: form.getAttribute('action'),
    method: form.getAttribute('method'),
    text: (form.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 500),
    controls: Array.from(form.querySelectorAll('input,select,textarea,button')).map((control) => ({
      tag: control.tagName.toLowerCase(),
      type: control.getAttribute('type'),
      name: control.getAttribute('name'),
      id: control.id,
      ariaLabel: control.getAttribute('aria-label'),
      placeholder: control.getAttribute('placeholder'),
      disabled: 'disabled' in control ? Boolean((control as HTMLInputElement).disabled) : false,
    })),
  })));
}

async function closeTopDialog(page: Page) {
  const dialogs = page.locator('[role="dialog"]:visible, [aria-modal="true"]:visible');
  if (await dialogs.count() === 0) return;
  const dialog = dialogs.last();
  const close = dialog.locator('button[aria-label*="ปิด"], button[aria-label*="close" i], button:has-text("ปิด"), button:has-text("ยกเลิก")').first();
  if (await close.isVisible().catch(() => false)) await close.click().catch(() => undefined);
  else await page.keyboard.press('Escape').catch(() => undefined);
}

async function closeAllDialogs(page: Page) {
  for (let round = 0; round < 6; round += 1) {
    if (await page.locator('[role="dialog"]:visible, [aria-modal="true"]:visible').count() === 0) return;
    await closeTopDialog(page);
    await page.waitForTimeout(80);
  }
}

function captureRuntime(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: RuntimeCapture['failedRequests'] = [];
  const badResponses: RuntimeCapture['badResponses'] = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/favicon|ERR_BLOCKED_BY_CLIENT/i.test(text)) return;
    consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push({
    method: request.method(), resourceType: request.resourceType(), url: sanitizeUrl(request.url()), failure: request.failure()?.errorText ?? 'unknown',
  }));
  page.on('response', (response) => {
    if (response.status() < 400) return;
    badResponses.push({ status: response.status(), url: sanitizeUrl(response.url()) });
  });

  return { snapshot: (): RuntimeCapture => ({ consoleErrors, pageErrors, failedRequests, badResponses }) };
}

async function installReadOnlyMemberSession(context: BrowserContext) {
  const accessToken = makeUnsignedJwt({
    sub: 'audit-member',
    username: 'NOA999999',
    role: 'member',
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  });
  const refreshToken = makeUnsignedJwt({
    sub: 'audit-member',
    type: 'refresh',
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  });

  await context.addInitScript(({ access, refresh }) => {
    localStorage.setItem('member_access_token', access);
    localStorage.setItem('member_refresh_token', refresh);
    sessionStorage.setItem('member_access_token', access);
    sessionStorage.setItem('member_refresh_token', refresh);
  }, { access: accessToken, refresh: refreshToken });

  await context.route('**/member/**', async (route) => {
    if (route.request().resourceType() === 'document') {
      await route.continue();
      return;
    }
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/member/auth/refresh') {
      await fulfill(route, { accessToken, refreshToken, expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() });
      return;
    }
    await fulfillReadOnly(route, {
      items: [], data: [], total: 0, page: 1, pageSize: 20,
      balance: '0.00', pendingCount: 0, methods: [],
    });
  });

  await context.route('**/member/wallet', (route) => fulfill(route, {
    currency: 'THB', balance: '12345.67', availableBalance: '12000.00', lockedBalance: '345.67', status: 'active',
  }));
  await context.route('**/member/auth/profile', (route) => fulfill(route, {
    id: 'audit-member', username: 'NOA999999', displayName: 'สมาชิกตรวจสอบเดสก์ท็อป',
    phone: '0890000000', email: 'audit@example.com', status: 'active', vipLevel: 'VIP 3',
    avatarUrl: '/images/avatar/7.webp', referralLink: '/affiliate?ref=audit-member',
  }));
  await context.route('**/member/auth/security**', (route) => fulfillReadOnly(route, { twoFactorEnabled: false }));
  await context.route('**/member/auth/sessions**', (route) => fulfillReadOnly(route, { items: [] }));
  await context.route('**/member/notifications**', (route) => fulfillReadOnly(route, { items: [], total: 0, pendingCount: 0 }));
  await context.route('**/member/bank-accounts**', (route) => fulfillReadOnly(route, { items: [] }));
  await context.route('**/member/receiving-bank-account**', (route) => fulfillReadOnly(route, { item: null }));
  await context.route('**/member/topups**', (route) => fulfillReadOnly(route, { items: [], total: 0 }));
  await context.route('**/member/withdrawals**', (route) => fulfillReadOnly(route, { items: [], total: 0 }));
  await context.route('**/member/bonus**', (route) => fulfillReadOnly(route, { items: [], balance: '0.00' }));
  await context.route('**/member/affiliate**', (route) => fulfillReadOnly(route, { items: [], balance: '0.00', referralLink: '/affiliate?ref=audit-member' }));
  await context.route('**/member/commission**', (route) => fulfillReadOnly(route, { items: [], balance: '0.00' }));
  await context.route('**/member/history**', (route) => fulfillReadOnly(route, { items: [], total: 0 }));
  await context.route('**/member/support**', (route) => fulfillReadOnly(route, { items: [], total: 0 }));
  await context.route('**/member/games/launch**', (route) => fulfillReadOnly(route, { launchUrl: 'https://example.invalid/audit-game' }));
}

async function fulfillReadOnly(route: Route, payload: Record<string, unknown>) {
  const method = route.request().method();
  await route.fulfill({
    status: method === 'GET' ? 200 : 422,
    contentType: 'application/json',
    body: JSON.stringify(method === 'GET' ? payload : { message: 'Blocked by read-only desktop audit' }),
  });
}

async function fulfill(route: Route, payload: Record<string, unknown>) {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
}

async function installPerformanceCollectors(page: Page) {
  await page.addInitScript(() => {
    const auditWindow = window as Window & { __memberDesktopAudit?: { cls: number; lcp: number; longTasks: number } };
    auditWindow.__memberDesktopAudit = { cls: 0, lcp: 0, longTasks: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!shift.hadRecentInput) auditWindow.__memberDesktopAudit!.cls += shift.value ?? 0;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) auditWindow.__memberDesktopAudit!.lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}
    try {
      new PerformanceObserver((list) => {
        auditWindow.__memberDesktopAudit!.longTasks += list.getEntries().length;
      }).observe({ type: 'longtask', buffered: true });
    } catch {}
  });
}

async function readPerformance(page: Page) {
  return page.evaluate(() => {
    const auditWindow = window as Window & { __memberDesktopAudit?: { cls: number; lcp: number; longTasks: number } };
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
      cls: auditWindow.__memberDesktopAudit?.cls ?? null,
      lcp: auditWindow.__memberDesktopAudit?.lcp ?? null,
      longTasks: auditWindow.__memberDesktopAudit?.longTasks ?? null,
    };
  });
}

async function writeRouteReport(evidenceDir: string, name: string, audits: RouteAudit[]) {
  await writeJson(path.join(evidenceDir, `${name}.json`), audits);
  const lines = [
    `# ${name}`,
    '',
    '| Route | HTTP | Final path | Critical | High | Medium | Axe | Network |',
    '|---|---:|---|---:|---:|---:|---:|---:|',
  ];
  for (const audit of audits) {
    const count = (severity: Severity) => audit.findings.filter((finding) => finding.severity === severity).length;
    lines.push(`| ${audit.requestedPath.replace(/\|/g, '%7C')} | ${audit.status ?? '-'} | ${new URL(audit.finalUrl).pathname.replace(/\|/g, '%7C')} | ${count('critical')} | ${count('high')} | ${count('medium')} | ${audit.axe.length} | ${audit.runtime.failedRequests.length + audit.runtime.badResponses.length} |`);
  }
  lines.push('', '## Findings', '');
  for (const audit of audits) {
    lines.push(`### ${audit.requestedPath}`);
    if (!audit.findings.length) lines.push('- No findings recorded.');
    for (const finding of audit.findings) lines.push(`- **${finding.severity.toUpperCase()} ${finding.code}**: ${finding.message}`);
    lines.push('');
  }
  await fs.writeFile(path.join(evidenceDir, `${name}.md`), lines.join('\n'), 'utf8');
}

function summarizeRouteAudits(audits: RouteAudit[]) {
  const findings = audits.flatMap((audit) => audit.findings.map((finding) => ({ route: audit.requestedPath, ...finding })));
  return {
    routes: audits.length,
    httpFailures: audits.filter((audit) => (audit.status ?? 200) >= 400).map((audit) => ({ route: audit.requestedPath, status: audit.status })),
    redirected: audits.filter((audit) => new URL(audit.finalUrl).pathname !== new URL(resolveUrl(audit.requestedPath)).pathname).map((audit) => ({ route: audit.requestedPath, final: new URL(audit.finalUrl).pathname })),
    critical: findings.filter((finding) => finding.severity === 'critical').length,
    high: findings.filter((finding) => finding.severity === 'high').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    topCodes: Object.entries(findings.reduce<Record<string, number>>((result, finding) => {
      result[finding.code] = (result[finding.code] ?? 0) + 1;
      return result;
    }, {})).sort((left, right) => right[1] - left[1]).slice(0, 15),
  };
}

function compactHomeSummary(report: Record<string, unknown>) {
  const top = report.top as Record<string, unknown>;
  const performance = report.performance as Record<string, unknown>;
  return {
    viewport: report.viewport,
    documentWidth: top.documentScrollWidth,
    clientWidth: top.documentClientWidth,
    scrollHeight: top.documentScrollHeight,
    columns: ((report.columns as { candidates?: unknown[] })?.candidates ?? []).length,
    jackpotOwners: ((report.columns as { jackpotTextOwners?: unknown[] })?.jackpotTextOwners ?? []).length,
    resources: performance.resourceCount,
    transfer: performance.resourceTransferSize,
    lcp: performance.lcp,
    cls: performance.cls,
    pageErrors: ((report.runtime as RuntimeCapture)?.pageErrors ?? []).length,
  };
}

async function prepareEvidenceDirectory(testInfo: TestInfo, section: string) {
  const directory = path.resolve('artifacts/member-desktop-audit', testInfo.project.name, section);
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

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'route';
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

function makeUnsignedJwt(payload: Record<string, unknown>) {
  const encode = (value: Record<string, unknown>) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
}
