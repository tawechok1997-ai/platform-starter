'use client';

import { useEffect } from 'react';

const STYLE_ID = 'member-legacy-theme-layout-authority';
const PRESERVE_SELECTOR = "[data-member-theme-preserve='true'], img, video, canvas, svg";

const LAYOUT_AUTHORITY_CSS = `
html[data-member-theme-authority='true'][data-member-motion='subtle'] {
  --member-motion-fast: 120ms;
  --member-motion-backdrop: 180ms;
  --member-motion-surface: 220ms;
  --member-motion-drawer: 260ms;
  --member-motion-exit: 140ms;
}

html[data-member-theme-authority='true'][data-member-motion='lively'] {
  --member-motion-fast: 180ms;
  --member-motion-backdrop: 240ms;
  --member-motion-surface: 320ms;
  --member-motion-drawer: 360ms;
  --member-motion-exit: 190ms;
}

@media (min-width: 901px) {
  html[data-member-theme-authority='true'] :where(
    .game-lobby-section,
    .member-home-section,
    [data-member-section]
  ) {
    margin-block-start: var(--member-runtime-section-gap-desktop) !important;
  }

  html[data-member-theme-authority='true'] :where(
    .game-lobby-grid,
    .member-game-grid,
    .game-grid,
    [data-member-game-grid]
  ) {
    grid-template-columns: repeat(var(--member-runtime-game-grid-columns), minmax(0, 1fr)) !important;
    gap: var(--member-runtime-card-gap-desktop) !important;
  }
}

@media (max-width: 900px) {
  html[data-member-theme-authority='true'] :where(
    .game-lobby-section,
    .member-home-section,
    [data-member-section]
  ) {
    margin-block-start: var(--member-runtime-section-gap-mobile) !important;
  }

  html[data-member-theme-authority='true'] :where(
    .game-lobby-grid,
    .member-game-grid,
    .game-grid,
    [data-member-game-grid]
  ) {
    gap: var(--member-runtime-card-gap-mobile) !important;
  }
}

html[data-member-theme-authority='true'] :where(
  .game-lobby-hero,
  .game-lobby-notice,
  .game-lobby-card,
  .game-lobby-empty,
  .member-card,
  [data-member-card]
) {
  border-radius: var(--member-runtime-card-radius) !important;
}

html[data-member-theme-authority='true'] :where(
  .game-lobby-search-row input,
  .game-lobby-search-row select,
  .game-lobby-card-body > button,
  input,
  select,
  textarea,
  button
) {
  border-radius: var(--member-runtime-control-radius);
}
`;

const BACKGROUNDS = new Map<string, string>([
  ['rgb(2,6,23)', 'var(--member-runtime-background)'],
  ['rgb(8,8,8)', 'var(--member-runtime-background)'],
  ['rgb(8,11,15)', 'var(--member-runtime-background)'],
  ['rgb(17,14,22)', 'var(--member-runtime-background)'],
  ['rgb(23,20,34)', 'var(--member-runtime-background)'],
  ['rgb(9,15,26)', 'var(--member-runtime-background)'],
  ['rgb(10,16,28)', 'var(--member-runtime-card)'],
  ['rgb(11,18,32)', 'var(--member-runtime-card)'],
  ['rgb(12,20,32)', 'var(--member-runtime-card)'],
  ['rgb(15,23,42)', 'var(--member-runtime-card)'],
  ['rgb(17,24,39)', 'var(--member-runtime-card)'],
  ['rgb(21,19,26)', 'var(--member-runtime-card)'],
  ['rgb(24,24,24)', 'var(--member-runtime-card)'],
  ['rgb(24,21,31)', 'var(--member-runtime-card)'],
  ['rgb(37,31,49)', 'color-mix(in srgb, var(--member-runtime-card) 82%, var(--member-runtime-text) 18%)'],
  ['rgb(38,38,38)', 'color-mix(in srgb, var(--member-runtime-card) 82%, var(--member-runtime-text) 18%)'],
  ['rgb(52,47,67)', 'color-mix(in srgb, var(--member-runtime-card) 78%, var(--member-runtime-text) 22%)'],
  ['rgb(63,59,75)', 'color-mix(in srgb, var(--member-runtime-card) 72%, var(--member-runtime-text) 28%)'],
]);

const BRAND_COLORS = new Set([
  'rgb(210,169,74)',
  'rgb(245,197,66)',
  'rgb(250,204,21)',
  'rgb(255,189,36)',
  'rgb(187,91,234)',
  'rgb(151,0,189)',
  'rgb(139,0,171)',
  'rgb(113,0,189)',
  'rgb(110,39,127)',
  'rgb(94,0,116)',
  'rgb(118,0,168)',
]);

const TEXT_MUTED = new Set([
  'rgb(133,139,149)',
  'rgb(148,163,184)',
  'rgb(156,163,175)',
  'rgb(183,187,195)',
  'rgb(203,213,225)',
]);

const TEXT_PRIMARY = new Set([
  'rgb(247,247,248)',
  'rgb(248,250,252)',
  'rgb(255,255,255)',
]);

const BORDER_NEUTRAL = new Set([
  'rgb(42,45,51)',
  'rgb(49,47,57)',
  'rgb(65,62,75)',
  'rgb(51,65,85)',
  'rgb(71,85,105)',
  'rgb(148,163,184)',
  'rgb(201,211,224)',
]);

export function MemberLegacyThemeNormalizer() {
  useEffect(() => {
    const body = document.body;
    if (!body) return;

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = LAYOUT_AUTHORITY_CSS;

    const normalizeTree = (root: ParentNode) => {
      if (root instanceof HTMLElement) normalizeElement(root);
      root.querySelectorAll<HTMLElement>('*').forEach(normalizeElement);
    };

    const run = () => window.requestAnimationFrame(() => normalizeTree(body));
    run();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) normalizeTree(node);
        }
        if (record.type === 'attributes' && record.target instanceof HTMLElement) normalizeElement(record.target);
      }
    });
    observer.observe(body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });

    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', run);
    return () => {
      observer.disconnect();
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', run);
    };
  }, []);

  return null;
}

function normalizeElement(element: HTMLElement) {
  if (element.matches(PRESERVE_SELECTOR) || element.closest('[data-member-theme-preserve="true"]')) return;
  const computed = getComputedStyle(element);

  const gradient = resolveGradient(computed.backgroundImage);
  if (gradient) {
    element.style.setProperty('background-image', gradient, 'important');
  }

  const background = classifyBackground(computed.backgroundColor);
  if (background) element.style.setProperty('background-color', background, 'important');

  const backgroundIsBrand = isBrand(computed.backgroundColor) || gradient?.includes('--member-runtime-primary');
  if (!backgroundIsBrand) {
    const color = normalizeRgb(computed.color);
    if (TEXT_PRIMARY.has(color)) element.style.setProperty('color', 'var(--member-runtime-text)', 'important');
    else if (TEXT_MUTED.has(color)) element.style.setProperty('color', 'var(--member-runtime-muted)', 'important');
    else if (BRAND_COLORS.has(color)) element.style.setProperty('color', 'var(--member-runtime-primary)', 'important');
  }

  normalizeBorder(element, 'border-top-color', computed.borderTopColor);
  normalizeBorder(element, 'border-right-color', computed.borderRightColor);
  normalizeBorder(element, 'border-bottom-color', computed.borderBottomColor);
  normalizeBorder(element, 'border-left-color', computed.borderLeftColor);
}

function classifyBackground(value: string) {
  const normalized = normalizeRgb(value);
  if (isTransparent(value)) return null;
  const neutral = BACKGROUNDS.get(normalized);
  if (neutral) return neutral;
  if (BRAND_COLORS.has(normalized)) return 'var(--member-runtime-primary)';
  const alpha = parseRgba(value);
  if (!alpha) return null;
  const rgb = `rgb(${alpha.red},${alpha.green},${alpha.blue})`;
  if ((rgb === 'rgb(2,6,23)' || rgb === 'rgb(8,8,8)' || rgb === 'rgb(15,23,42)') && alpha.alpha < 1) {
    return `color-mix(in srgb, var(--member-runtime-card) ${Math.max(18, Math.round(alpha.alpha * 100))}%, transparent)`;
  }
  if ((rgb === 'rgb(255,255,255)' || rgb === 'rgb(148,163,184)') && alpha.alpha < 0.35) {
    return `color-mix(in srgb, var(--member-runtime-text) ${Math.max(4, Math.round(alpha.alpha * 100))}%, transparent)`;
  }
  return null;
}

function normalizeBorder(element: HTMLElement, property: string, value: string) {
  const normalized = normalizeRgb(value);
  if (BRAND_COLORS.has(normalized)) {
    element.style.setProperty(property, 'var(--member-runtime-primary)', 'important');
    return;
  }
  if (BORDER_NEUTRAL.has(normalized)) {
    element.style.setProperty(property, 'var(--member-runtime-border)', 'important');
    return;
  }
  const rgba = parseRgba(value);
  if (!rgba || rgba.alpha >= 0.5) return;
  const rgb = `rgb(${rgba.red},${rgba.green},${rgba.blue})`;
  if (rgb === 'rgb(255,255,255)' || rgb === 'rgb(148,163,184)') {
    element.style.setProperty(property, 'color-mix(in srgb, var(--member-runtime-border) 72%, transparent)', 'important');
  }
}

function resolveGradient(value: string) {
  if (!value || value === 'none' || value.includes('url(') || !value.includes('gradient(')) return null;
  const colors = [...value.matchAll(/rgba?\([^)]*\)/gi)].map((match) => match[0]);
  if (!colors.length) return null;

  let hasBrand = false;
  for (const color of colors) {
    if (isTransparent(color)) continue;
    const normalized = normalizeRgb(color);
    if (BRAND_COLORS.has(normalized)) {
      hasBrand = true;
      continue;
    }
    if (BACKGROUNDS.has(normalized)) continue;
    const rgba = parseRgba(color);
    if (rgba && rgba.alpha < 0.35) continue;
    return null;
  }

  return hasBrand
    ? 'linear-gradient(180deg, color-mix(in srgb, var(--member-runtime-card) 82%, var(--member-runtime-primary) 18%), var(--member-runtime-background))'
    : 'linear-gradient(180deg, var(--member-runtime-card), var(--member-runtime-background))';
}

function isBrand(value: string) {
  return BRAND_COLORS.has(normalizeRgb(value));
}

function normalizeRgb(value: string) {
  const parsed = parseRgba(value);
  if (!parsed) return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
  return `rgb(${parsed.red},${parsed.green},${parsed.blue})`;
}

function parseRgba(value: string) {
  const match = String(value ?? '').trim().match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*(\d*\.?\d+)%?)?\s*\)$/i);
  if (!match) return null;
  const rawAlpha = match[4];
  const alpha = rawAlpha === undefined ? 1 : Number(rawAlpha) > 1 ? Number(rawAlpha) / 100 : Number(rawAlpha);
  return {
    red: Math.round(Number(match[1])),
    green: Math.round(Number(match[2])),
    blue: Math.round(Number(match[3])),
    alpha: Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : 1,
  };
}

function isTransparent(value: string) {
  const parsed = parseRgba(value);
  return Boolean(parsed && parsed.alpha === 0) || value === 'transparent';
}
