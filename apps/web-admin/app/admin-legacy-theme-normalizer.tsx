'use client';

import { useEffect } from 'react';

const APPEARANCE_CHANGE_EVENT = 'admin:appearance-change';

const BACKGROUND_TOKENS = new Map<string, string>([
  ['#070b12', 'var(--color-canvas)'],
  ['rgb(7,11,18)', 'var(--color-canvas)'],
  ['#080808', 'var(--color-canvas)'],
  ['rgb(8,8,8)', 'var(--color-canvas)'],
  ['#080b0f', 'var(--color-canvas)'],
  ['rgb(8,11,15)', 'var(--color-canvas)'],
  ['#0b1220', 'var(--color-surface)'],
  ['rgb(11,18,32)', 'var(--color-surface)'],
  ['#0c1420', 'var(--color-surface)'],
  ['rgb(12,20,32)', 'var(--color-surface)'],
  ['#0f172a', 'var(--color-surface)'],
  ['rgb(15,23,42)', 'var(--color-surface)'],
  ['#11161d', 'var(--color-surface)'],
  ['rgb(17,22,29)', 'var(--color-surface)'],
  ['#111827', 'var(--color-surface-raised)'],
  ['rgb(17,24,39)', 'var(--color-surface-raised)'],
  ['#111c2a', 'var(--color-surface-raised)'],
  ['rgb(17,28,42)', 'var(--color-surface-raised)'],
  ['#172033', 'var(--color-surface-raised)'],
  ['rgb(23,32,51)', 'var(--color-surface-raised)'],
  ['#181818', 'var(--color-surface-raised)'],
  ['rgb(24,24,24)', 'var(--color-surface-raised)'],
  ['#181f28', 'var(--color-surface-raised)'],
  ['rgb(24,31,40)', 'var(--color-surface-raised)'],
  ['#172437', 'var(--color-surface-overlay)'],
  ['rgb(23,36,55)', 'var(--color-surface-overlay)'],
  ['#1e293b', 'var(--color-surface-overlay)'],
  ['rgb(30,41,59)', 'var(--color-surface-overlay)'],
  ['#202936', 'var(--color-surface-overlay)'],
  ['rgb(32,41,54)', 'var(--color-surface-overlay)'],
]);

const TEXT_TOKENS = new Map<string, string>([
  ['#ffffff', 'var(--color-text-primary)'],
  ['#fff', 'var(--color-text-primary)'],
  ['rgb(255,255,255)', 'var(--color-text-primary)'],
  ['#f7f9fc', 'var(--color-text-primary)'],
  ['rgb(247,249,252)', 'var(--color-text-primary)'],
  ['#e2e8f0', 'var(--color-text-primary)'],
  ['rgb(226,232,240)', 'var(--color-text-primary)'],
  ['#cbd5e1', 'var(--color-text-primary)'],
  ['rgb(203,213,225)', 'var(--color-text-primary)'],
  ['#94a3b8', 'var(--color-text-secondary)'],
  ['rgb(148,163,184)', 'var(--color-text-secondary)'],
  ['#9ca3af', 'var(--color-text-secondary)'],
  ['rgb(156,163,175)', 'var(--color-text-secondary)'],
  ['#9caac0', 'var(--color-text-secondary)'],
  ['rgb(156,170,192)', 'var(--color-text-secondary)'],
  ['#64748b', 'var(--color-text-secondary)'],
  ['rgb(100,116,139)', 'var(--color-text-secondary)'],
  ['#475569', 'var(--color-text-secondary)'],
  ['rgb(71,85,105)', 'var(--color-text-secondary)'],
  ['#0f172a', 'var(--color-text-primary)'],
  ['rgb(15,23,42)', 'var(--color-text-primary)'],
  ['#102036', 'var(--color-text-primary)'],
  ['rgb(16,32,54)', 'var(--color-text-primary)'],
]);

const BORDER_LITERALS = new Set<string>([
  '#1e293b',
  'rgb(30,41,59)',
  '#334155',
  'rgb(51,65,85)',
  '#475569',
  'rgb(71,85,105)',
  '#c9d3e0',
  'rgb(201,211,224)',
  '#dfe6ef',
  'rgb(223,230,239)',
]);

export function AdminLegacyThemeNormalizer() {
  useEffect(() => {
    const body = document.querySelector<HTMLElement>('body[data-app-surface="admin"]');
    if (!body) return;

    const normalizeTree = (root: ParentNode) => {
      if (root instanceof HTMLElement && root.hasAttribute('style')) normalizeElement(root);
      root.querySelectorAll<HTMLElement>('[style]').forEach(normalizeElement);
    };

    normalizeTree(body);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes') {
          if (record.target instanceof HTMLElement) normalizeElement(record.target);
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
      attributeFilter: ['style'],
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

function normalizeElement(element: HTMLElement) {
  const style = element.style;

  const backgroundToken = BACKGROUND_TOKENS.get(normalizeLiteral(style.backgroundColor));
  if (backgroundToken && style.backgroundColor !== backgroundToken) {
    style.backgroundColor = backgroundToken;
  }

  const textToken = TEXT_TOKENS.get(normalizeLiteral(style.color));
  if (textToken && style.color !== textToken) {
    style.color = textToken;
  }

  remapBorderColor(style, 'borderTopColor');
  remapBorderColor(style, 'borderRightColor');
  remapBorderColor(style, 'borderBottomColor');
  remapBorderColor(style, 'borderLeftColor');

  const outline = normalizeLiteral(style.outlineColor);
  if (BORDER_LITERALS.has(outline)) style.outlineColor = 'var(--color-border-strong)';
}

function remapBorderColor(
  style: CSSStyleDeclaration,
  property: 'borderTopColor' | 'borderRightColor' | 'borderBottomColor' | 'borderLeftColor',
) {
  const literal = normalizeLiteral(style[property]);
  if (BORDER_LITERALS.has(literal)) style[property] = 'var(--color-border-subtle)';
}

function normalizeLiteral(value: string) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}
