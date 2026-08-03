'use client';

import { useLayoutEffect } from 'react';

const BODY_SELECTOR = '.desktop-reference-home > .desktop-home__body';
const SIDEBAR_SELECTOR = ':scope > .reference-sidebar';
const DEFAULT_STICKY_TOP = 124;
const VIEWPORT_GAP = 12;
const MANAGED_PROPERTIES = [
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'margin',
  'transform',
  'z-index',
  'will-change',
  'align-self',
  'max-height',
  'overflow-x',
  'overflow-y',
  'overscroll-behavior',
  'scrollbar-gutter',
] as const;

type InlineSnapshot = Record<(typeof MANAGED_PROPERTIES)[number], { value: string; priority: string }>;

export default function HomeSidebarScrollController() {
  useLayoutEffect(() => {
    const body = document.querySelector<HTMLElement>(BODY_SELECTOR);
    const sidebar = body?.querySelector<HTMLElement>(SIDEBAR_SELECTOR) ?? null;
    if (!body || !sidebar) return;

    const bodyOverflow = {
      value: body.style.getPropertyValue('overflow'),
      priority: body.style.getPropertyPriority('overflow'),
    };
    const sidebarSnapshot = snapshotInlineStyles(sidebar);
    const stickyTop = readStickyTop(sidebar);

    body.style.setProperty('overflow', 'visible', 'important');
    sidebar.style.setProperty('position', 'sticky', 'important');
    sidebar.style.setProperty('top', `${stickyTop}px`, 'important');
    sidebar.style.setProperty('right', 'auto', 'important');
    sidebar.style.setProperty('bottom', 'auto', 'important');
    sidebar.style.setProperty('left', 'auto', 'important');
    sidebar.style.setProperty('margin', '0', 'important');
    sidebar.style.setProperty('transform', 'none', 'important');
    sidebar.style.setProperty('z-index', '20', 'important');
    sidebar.style.setProperty('will-change', 'auto', 'important');
    sidebar.style.setProperty('align-self', 'start', 'important');
    sidebar.style.setProperty(
      'max-height',
      `calc(100dvh - ${stickyTop + VIEWPORT_GAP}px)`,
      'important',
    );
    sidebar.style.setProperty('overflow-x', 'hidden', 'important');
    sidebar.style.setProperty('overflow-y', 'auto', 'important');
    sidebar.style.setProperty('overscroll-behavior', 'contain', 'important');
    sidebar.style.setProperty('scrollbar-gutter', 'stable', 'important');
    sidebar.dataset.scrollState = 'pinned';

    return () => {
      delete sidebar.dataset.scrollState;
      restoreInlineStyles(sidebar, sidebarSnapshot);
      restoreInlineProperty(body, 'overflow', bodyOverflow);
    };
  }, []);

  return null;
}

function readStickyTop(sidebar: HTMLElement) {
  const value = Number.parseFloat(window.getComputedStyle(sidebar).top);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_STICKY_TOP;
}

function snapshotInlineStyles(element: HTMLElement): InlineSnapshot {
  return Object.fromEntries(MANAGED_PROPERTIES.map((property) => [
    property,
    {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    },
  ])) as InlineSnapshot;
}

function restoreInlineStyles(element: HTMLElement, snapshot: InlineSnapshot) {
  MANAGED_PROPERTIES.forEach((property) => restoreInlineProperty(element, property, snapshot[property]));
}

function restoreInlineProperty(
  element: HTMLElement,
  property: string,
  snapshot: { value: string; priority: string },
) {
  if (snapshot.value) element.style.setProperty(property, snapshot.value, snapshot.priority);
  else element.style.removeProperty(property);
}
