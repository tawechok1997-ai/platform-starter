'use client';

import { useEffect } from 'react';

const APPEARANCE_CHANGE_EVENT = 'admin:appearance-change';
const THEME_PRESERVE_SELECTOR = "[data-admin-theme-preserve='true'], [data-preview-viewport]";

const BACKGROUND_TOKENS = new Map<string, string>([
  ['#070b12', 'var(--color-canvas)'],
  ['rgb(7,11,18)', 'var(--color-canvas)'],
  ['#070b14', 'var(--color-canvas)'],
  ['rgb(7,11,20)', 'var(--color-canvas)'],
  ['#080808', 'var(--color-canvas)'],
  ['rgb(8,8,8)', 'var(--color-canvas)'],
  ['#080b0f', 'var(--color-canvas)'],
  ['rgb(8,11,15)', 'var(--color-canvas)'],
  ['#090f1a', 'var(--color-canvas)'],
  ['rgb(9,15,26)', 'var(--color-canvas)'],
  ['#0a101c', 'var(--color-surface)'],
  ['rgb(10,16,28)', 'var(--color-surface)'],
  ['#0b1220', 'var(--color-surface)'],
  ['rgb(11,18,32)', 'var(--color-surface)'],
  ['#0c1420', 'var(--color-surface)'],
  ['rgb(12,20,32)', 'var(--color-surface)'],
  ['#0f1726', 'var(--color-surface)'],
  ['rgb(15,23,38)', 'var(--color-surface)'],
  ['#0f172a', 'var(--color-surface)'],
  ['rgb(15,23,42)', 'var(--color-surface)'],
  ['#11161d', 'var(--color-surface)'],
  ['rgb(17,22,29)', 'var(--color-surface)'],
  ['#111827', 'var(--color-surface-raised)'],
  ['rgb(17,24,39)', 'var(--color-surface-raised)'],
  ['#111c2a', 'var(--color-surface-raised)'],
  ['rgb(17,28,42)', 'var(--color-surface-raised)'],
  ['#131e30', 'var(--color-surface-raised)'],
  ['rgb(19,30,48)', 'var(--color-surface-raised)'],
  ['#172033', 'var(--color-surface-raised)'],
  ['rgb(23,32,51)', 'var(--color-surface-raised)'],
  ['#181818', 'var(--color-surface-raised)'],
  ['rgb(24,24,24)', 'var(--color-surface-raised)'],
  ['#181f28', 'var(--color-surface-raised)'],
  ['rgb(24,31,40)', 'var(--color-surface-raised)'],
  ['#172437', 'var(--color-surface-overlay)'],
  ['rgb(23,36,55)', 'var(--color-surface-overlay)'],
  ['#18253a', 'var(--color-surface-overlay)'],
  ['rgb(24,37,58)', 'var(--color-surface-overlay)'],
  ['#1e293b', 'var(--color-surface-overlay)'],
  ['rgb(30,41,59)', 'var(--color-surface-overlay)'],
  ['#202936', 'var(--color-surface-overlay)'],
  ['rgb(32,41,54)', 'var(--color-surface-overlay)'],
  ['#f3f6fb', 'var(--color-canvas)'],
  ['rgb(243,246,251)', 'var(--color-canvas)'],
  ['#f7f9fc', 'var(--color-surface-overlay)'],
  ['rgb(247,249,252)', 'var(--color-surface-overlay)'],
  ['#ffffff', 'var(--color-surface-raised)'],
  ['#fff', 'var(--color-surface-raised)'],
  ['rgb(255,255,255)', 'var(--color-surface-raised)'],
]);

const TEXT_TOKENS = new Map<string, string>([
  ['#ffffff', 'var(--color-text-primary)'],
  ['#fff', 'var(--color-text-primary)'],
  ['rgb(255,255,255)', 'var(--color-text-primary)'],
  ['#f8fafc', 'var(--color-text-primary)'],
  ['rgb(248,250,252)', 'var(--color-text-primary)'],
  ['#f7f9fc', 'var(--color-text-primary)'],
  ['rgb(247,249,252)', 'var(--color-text-primary)'],
  ['#e2e8f0', 'var(--color-text-primary)'],
  ['rgb(226,232,240)', 'var(--color-text-primary)'],
  ['#cbd5e1', 'var(--color-text-primary)'],
  ['rgb(203,213,225)', 'var(--color-text-primary)'],
  ['#102036', 'var(--color-text-primary)'],
  ['rgb(16,32,54)', 'var(--color-text-primary)'],
  ['#0f172a', 'var(--color-text-primary)'],
  ['rgb(15,23,42)', 'var(--color-text-primary)'],
  ['#111827', 'var(--color-text-primary)'],
  ['rgb(17,24,39)', 'var(--color-text-primary)'],
  ['#1e293b', 'var(--color-text-primary)'],
  ['rgb(30,41,59)', 'var(--color-text-primary)'],
  ['#94a3b8', 'var(--color-text-secondary)'],
  ['rgb(148,163,184)', 'var(--color-text-secondary)'],
  ['#9ca3af', 'var(--color-text-secondary)'],
  ['rgb(156,163,175)', 'var(--color-text-secondary)'],
  ['#9caac0', 'var(--color-text-secondary)'],
  ['rgb(156,170,192)', 'var(--color-text-secondary)'],
  ['#8a98aa', 'var(--color-text-secondary)'],
  ['rgb(138,152,170)', 'var(--color-text-secondary)'],
  ['#64748b', 'var(--color-text-secondary)'],
  ['rgb(100,116,139)', 'var(--color-text-secondary)'],
  ['#5f6f84', 'var(--color-text-secondary)'],
  ['rgb(95,111,132)', 'var(--color-text-secondary)'],
  ['#475569', 'var(--color-text-secondary)'],
  ['rgb(71,85,105)', 'var(--color-text-secondary)'],
]);

const BORDER_TOKENS = new Map<string, string>([
  ['#1e293b', 'var(--color-border-subtle)'],
  ['rgb(30,41,59)', 'var(--color-border-subtle)'],
  ['#334155', 'var(--color-border-subtle)'],
  ['rgb(51,65,85)', 'var(--color-border-subtle)'],
  ['#475569', 'var(--color-border-strong)'],
  ['rgb(71,85,105)', 'var(--color-border-strong)'],
  ['#c9d3e0', 'var(--color-border-strong)'],
  ['rgb(201,211,224)', 'var(--color-border-strong)'],
  ['#dfe6ef', 'var(--color-border-subtle)'],
  ['rgb(223,230,239)', 'var(--color-border-subtle)'],
]);

const INJECTED = new WeakMap<HTMLElement, Map<string, { value: string; priority: string }>>();

export function AdminLegacyThemeNormalizer() {
  useEffect(() => {
    const body = document.querySelector<HTMLElement>('body[data-app-surface="admin"]');
    if (!body) return;

    const normalizeTree = (root: ParentNode) => {
      if (root instanceof HTMLElement) normalizeElement(root, body);
      root.querySelectorAll<HTMLElement>('*').forEach((element) => normalizeElement(element, body));
    };

    normalizeTree(body);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') {
          if (record.target instanceof HTMLElement) {
            restoreInjected(record.target);
            normalizeElement(record.target, body);
          }
          continue;
        }
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) normalizeTree(node);
        }
      }
    });

    observer.observe(body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    const normalizeCurrentTree = () => normalizeTree(body);
    window.addEventListener(APPEARANCE_CHANGE_EVENT, normalizeCurrentTree);

    return () => {
      observer.disconnect();
      window.removeEventListener(APPEARANCE_CHANGE_EVENT, normalizeCurrentTree);
    };
  }, []);

  return null;
}

function normalizeElement(element: HTMLElement, body: HTMLElement) {
  if (shouldPreserveTheme(element)) return;

  const computed = window.getComputedStyle(element);
  const backgroundToken = resolveBackgroundToken(computed.backgroundColor);
  if (backgroundToken) setThemeProperty(element, 'background-color', backgroundToken);

  if (isNeutralTextContext(element, body)) {
    const textToken = TEXT_TOKENS.get(normalizeLiteral(computed.color));
    if (textToken) setThemeProperty(element, 'color', textToken);
  }

  remapBorderColor(element, 'border-top-color', computed.borderTopColor);
  remapBorderColor(element, 'border-right-color', computed.borderRightColor);
  remapBorderColor(element, 'border-bottom-color', computed.borderBottomColor);
  remapBorderColor(element, 'border-left-color', computed.borderLeftColor);

  const outlineToken = BORDER_TOKENS.get(normalizeLiteral(computed.outlineColor));
  if (outlineToken) setThemeProperty(element, 'outline-color', outlineToken);
}

function remapBorderColor(element: HTMLElement, property: string, value: string) {
  const directToken = BORDER_TOKENS.get(normalizeLiteral(value));
  if (directToken) {
    setThemeProperty(element, property, directToken);
    return;
  }

  const alphaToken = resolveNeutralAlphaBorder(value);
  if (alphaToken) setThemeProperty(element, property, alphaToken);
}

function resolveBackgroundToken(value: string) {
  const normalized = normalizeLiteral(value);
  const direct = BACKGROUND_TOKENS.get(normalized);
  if (direct) return direct;

  const parsed = parseRgb(value);
  if (!parsed || parsed.alpha >= 0.98) return null;
  const rgb = `${parsed.red},${parsed.green},${parsed.blue}`;
  const percent = clampPercent(parsed.alpha * 100);

  if (rgb === '148,163,184' || rgb === '255,255,255') {
    return `color-mix(in srgb, var(--color-text-primary) ${percent}%, transparent)`;
  }
  if (rgb === '15,23,42' || rgb === '2,6,23' || rgb === '0,0,0') {
    return `color-mix(in srgb, var(--color-surface-overlay) ${Math.max(percent, 12)}%, transparent)`;
  }
  return null;
}

function resolveNeutralAlphaBorder(value: string) {
  const parsed = parseRgb(value);
  if (!parsed) return null;
  const rgb = `${parsed.red},${parsed.green},${parsed.blue}`;
  if (rgb !== '148,163,184' && rgb !== '203,213,225' && rgb !== '255,255,255') return null;
  return parsed.alpha >= 0.24 ? 'var(--color-border-strong)' : 'var(--color-border-subtle)';
}

function isNeutralTextContext(element: HTMLElement, body: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current) {
    if (current !== body && shouldPreserveTheme(current)) return false;
    const computed = window.getComputedStyle(current);
    if (current !== body && computed.backgroundImage && computed.backgroundImage !== 'none') return false;

    const background = normalizeLiteral(computed.backgroundColor);
    if (!isTransparent(background)) return Boolean(resolveBackgroundToken(computed.backgroundColor));
    if (current === body) return true;
    current = current.parentElement;
  }
  return true;
}

function shouldPreserveTheme(element: HTMLElement) {
  return Boolean(element.closest(THEME_PRESERVE_SELECTOR));
}

function setThemeProperty(element: HTMLElement, property: string, value: string) {
  const style = element.style;
  if (style.getPropertyValue(property).trim() === value && style.getPropertyPriority(property) === 'important') return;

  let originals = INJECTED.get(element);
  if (!originals) {
    originals = new Map();
    INJECTED.set(element, originals);
  }
  if (!originals.has(property)) {
    originals.set(property, {
      value: style.getPropertyValue(property),
      priority: style.getPropertyPriority(property),
    });
  }
  style.setProperty(property, value, 'important');
}

function restoreInjected(element: HTMLElement) {
  const originals = INJECTED.get(element);
  if (!originals) return;
  for (const [property, original] of originals) {
    if (original.value) element.style.setProperty(property, original.value, original.priority);
    else element.style.removeProperty(property);
  }
  INJECTED.delete(element);
}

function parseRgb(value: string) {
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

function clampPercent(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function isTransparent(value: string) {
  return value === 'transparent' || value === 'rgba(0,0,0,0)' || value === 'rgb(0,0,0,0)';
}

function normalizeLiteral(value: string) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}
