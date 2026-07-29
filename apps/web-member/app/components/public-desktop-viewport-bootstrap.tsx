'use client';

import { useLayoutEffect } from 'react';

const DESKTOP_DESIGN_WIDTH = 1455;
const WIDTH_CONDITION = /\(\s*(min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)/gi;

type BodySnapshot = {
  width: string;
  minWidth: string;
  maxWidth: string;
  margin: string;
  zoom: string;
  overflowX: string;
  htmlOverflowX: string;
};

type WidthCondition = {
  kind: 'min' | 'max';
  boundary: number;
};

const mediaRuleSources = new Map<CSSMediaRule, string>();
let nativeMatchMedia: typeof window.matchMedia | null = null;
let matchMediaPatched = false;

export default function PublicDesktopViewportBootstrap() {
  useLayoutEffect(() => {
    nativeMatchMedia ??= window.matchMedia.bind(window);
    installVirtualMatchMedia();

    const bodySnapshot: BodySnapshot = {
      width: document.body.style.width,
      minWidth: document.body.style.minWidth,
      maxWidth: document.body.style.maxWidth,
      margin: document.body.style.margin,
      zoom: document.body.style.getPropertyValue('zoom'),
      overflowX: document.body.style.overflowX,
      htmlOverflowX: document.documentElement.style.overflowX,
    };

    let frame = 0;
    let observer: MutationObserver | null = null;

    const syncViewport = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (isMobileOnlyDevice()) {
          restoreMediaRules();
          restoreBody(bodySnapshot);
          document.documentElement.dataset.memberViewportMode = 'mobile';
          return;
        }

        document.documentElement.dataset.memberViewportMode = 'desktop';
        const viewportWidth = Math.max(1, document.documentElement.clientWidth || window.innerWidth);

        if (viewportWidth < DESKTOP_DESIGN_WIDTH) {
          rewriteMediaRulesForDesktopCanvas();
          const scale = Math.max(0.05, viewportWidth / DESKTOP_DESIGN_WIDTH);
          document.body.style.width = `${DESKTOP_DESIGN_WIDTH}px`;
          document.body.style.minWidth = `${DESKTOP_DESIGN_WIDTH}px`;
          document.body.style.maxWidth = `${DESKTOP_DESIGN_WIDTH}px`;
          document.body.style.margin = '0';
          document.body.style.setProperty('zoom', scale.toFixed(6));
          document.body.style.overflowX = 'hidden';
          document.documentElement.style.overflowX = 'hidden';
          document.body.dataset.memberDesktopScaled = 'true';
          return;
        }

        restoreMediaRules();
        restoreBody(bodySnapshot);
        document.body.dataset.memberDesktopScaled = 'false';
      });
    };

    syncViewport();
    window.addEventListener('resize', syncViewport, { passive: true });
    window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });

    observer = new MutationObserver(() => {
      if (!isMobileOnlyDevice() && document.documentElement.clientWidth < DESKTOP_DESIGN_WIDTH) {
        rewriteMediaRulesForDesktopCanvas();
      }
    });
    observer.observe(document.head, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', syncViewport);
      window.visualViewport?.removeEventListener('resize', syncViewport);
      observer?.disconnect();
      restoreMediaRules();
      restoreBody(bodySnapshot);
      delete document.documentElement.dataset.memberViewportMode;
      delete document.body.dataset.memberDesktopScaled;
    };
  }, []);

  return null;
}

function installVirtualMatchMedia() {
  if (matchMediaPatched || !nativeMatchMedia) return;
  matchMediaPatched = true;

  window.matchMedia = ((query: string) => {
    const nativeList = nativeMatchMedia!(query);
    const virtualMatch = evaluateMediaWidth(query, DESKTOP_DESIGN_WIDTH);
    if (virtualMatch === null) return nativeList;

    return new Proxy(nativeList, {
      get(target, property) {
        if (property === 'matches' && !isMobileOnlyDevice()) {
          return evaluateMediaWidth(query, DESKTOP_DESIGN_WIDTH) ?? target.matches;
        }

        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }) as typeof window.matchMedia;
}

function isMobileOnlyDevice() {
  if (!nativeMatchMedia) return false;
  const hasDesktopPointer = nativeMatchMedia('(any-hover: hover), (any-pointer: fine)').matches;
  const coarsePrimary = nativeMatchMedia('(hover: none) and (pointer: coarse)').matches;
  return coarsePrimary && !hasDesktopPointer;
}

function rewriteMediaRulesForDesktopCanvas() {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      rewriteRuleList(sheet.cssRules);
    } catch {
      // Cross-origin or browser-owned stylesheets cannot be edited. Local Next.js
      // styles remain editable and contain the member responsive contracts.
    }
  }
}

function rewriteRuleList(rules: CSSRuleList) {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      if (!mediaRuleSources.has(rule)) mediaRuleSources.set(rule, rule.media.mediaText);
      const source = mediaRuleSources.get(rule)!;
      const virtualized = virtualizeMediaText(source, DESKTOP_DESIGN_WIDTH);
      if (virtualized !== null && rule.media.mediaText !== virtualized) {
        rule.media.mediaText = virtualized;
      }
      rewriteRuleList(rule.cssRules);
      continue;
    }

    const nested = (rule as CSSRule & { cssRules?: CSSRuleList }).cssRules;
    if (nested) rewriteRuleList(nested);
  }
}

function restoreMediaRules() {
  for (const [rule, source] of mediaRuleSources) {
    try {
      if (rule.media.mediaText !== source) rule.media.mediaText = source;
    } catch {
      // The stylesheet may have been replaced during a route transition.
    }
  }
  mediaRuleSources.clear();
}

function virtualizeMediaText(mediaText: string, width: number) {
  const branches = splitMediaBranches(mediaText);
  let changed = false;

  const virtualized = branches.map((branch) => {
    const conditions = extractWidthConditions(branch);
    if (!conditions.length) return branch.trim();
    changed = true;

    const matches = conditions.every((condition) => (
      condition.kind === 'min' ? width >= condition.boundary : width <= condition.boundary
    ));

    if (!matches) return 'not all';

    const remainder = branch
      .replace(WIDTH_CONDITION, '')
      .replace(/^\s*and\s*|\s*and\s*$/gi, '')
      .replace(/\s+and\s+and\s+/gi, ' and ')
      .trim();
    WIDTH_CONDITION.lastIndex = 0;

    return remainder || 'all';
  });

  return changed ? virtualized.join(', ') : null;
}

function evaluateMediaWidth(mediaText: string, width: number): boolean | null {
  const branches = splitMediaBranches(mediaText);
  let foundWidth = false;

  const matches = branches.some((branch) => {
    const conditions = extractWidthConditions(branch);
    if (!conditions.length) return false;
    foundWidth = true;

    return conditions.every((condition) => (
      condition.kind === 'min' ? width >= condition.boundary : width <= condition.boundary
    ));
  });

  return foundWidth ? matches : null;
}

function extractWidthConditions(mediaText: string): WidthCondition[] {
  const conditions: WidthCondition[] = [];
  const expression = new RegExp(WIDTH_CONDITION.source, 'gi');
  let match: RegExpExecArray | null = expression.exec(mediaText);

  while (match) {
    const kind = match[1]?.toLowerCase();
    const boundary = Number(match[2]);
    if ((kind === 'min' || kind === 'max') && Number.isFinite(boundary)) {
      conditions.push({ kind, boundary });
    }
    match = expression.exec(mediaText);
  }

  return conditions;
}

function splitMediaBranches(mediaText: string) {
  const branches: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < mediaText.length; index += 1) {
    const character = mediaText[index];
    if (character === '(') depth += 1;
    else if (character === ')') depth = Math.max(0, depth - 1);
    else if (character === ',' && depth === 0) {
      branches.push(mediaText.slice(start, index));
      start = index + 1;
    }
  }

  branches.push(mediaText.slice(start));
  return branches;
}

function restoreBody(snapshot: BodySnapshot) {
  document.body.style.width = snapshot.width;
  document.body.style.minWidth = snapshot.minWidth;
  document.body.style.maxWidth = snapshot.maxWidth;
  document.body.style.margin = snapshot.margin;
  document.body.style.overflowX = snapshot.overflowX;
  document.documentElement.style.overflowX = snapshot.htmlOverflowX;

  if (snapshot.zoom) document.body.style.setProperty('zoom', snapshot.zoom);
  else document.body.style.removeProperty('zoom');
}
