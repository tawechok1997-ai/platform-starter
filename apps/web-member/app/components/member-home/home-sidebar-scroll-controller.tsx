'use client';

import { useLayoutEffect } from 'react';

const BODY_SELECTOR = '.desktop-reference-home > .desktop-home__body';
const SIDEBAR_SELECTOR = ':scope > .reference-sidebar';
const DEFAULT_FIXED_TOP = 124;
const VIEWPORT_GAP = 12;
const MANAGED_PROPERTIES = [
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
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

    const sidebarSnapshot = snapshotInlineStyles(sidebar);
    const fixedTop = readFixedTop(sidebar);
    const placeholder = document.createElement('div');
    placeholder.dataset.desktopSidebarPlaceholder = 'true';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.pointerEvents = 'none';
    placeholder.style.visibility = 'hidden';
    placeholder.style.minWidth = '0';
    placeholder.style.minHeight = '1px';
    sidebar.before(placeholder);

    let frame = 0;

    const syncGeometry = () => {
      frame = 0;
      if (!sidebar.isConnected || !placeholder.isConnected) return;

      const rect = placeholder.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : sidebarRect.width;
      const left = rect.left;

      if (!Number.isFinite(left) || !Number.isFinite(width) || width <= 0) return;

      sidebar.style.setProperty('left', `${left.toFixed(3)}px`, 'important');
      sidebar.style.setProperty('width', `${width.toFixed(3)}px`, 'important');
    };

    const scheduleGeometry = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncGeometry);
    };

    sidebar.style.setProperty('position', 'fixed', 'important');
    sidebar.style.setProperty('top', `${fixedTop}px`, 'important');
    sidebar.style.setProperty('right', 'auto', 'important');
    sidebar.style.setProperty('bottom', 'auto', 'important');
    sidebar.style.setProperty('margin', '0', 'important');
    sidebar.style.setProperty('transform', 'none', 'important');
    sidebar.style.setProperty('z-index', '120', 'important');
    sidebar.style.setProperty('will-change', 'auto', 'important');
    sidebar.style.setProperty('align-self', 'start', 'important');
    sidebar.style.setProperty(
      'max-height',
      `calc(100dvh - ${fixedTop + VIEWPORT_GAP}px)`,
      'important',
    );
    sidebar.style.setProperty('overflow-x', 'hidden', 'important');
    sidebar.style.setProperty('overflow-y', 'auto', 'important');
    sidebar.style.setProperty('overscroll-behavior', 'contain', 'important');
    sidebar.style.setProperty('scrollbar-gutter', 'stable', 'important');
    sidebar.dataset.scrollState = 'fixed';

    // Observe only the stable grid owner. Observing the placeholder while also
    // writing geometry derived from it can create a ResizeObserver feedback loop.
    const resizeObserver = new ResizeObserver(scheduleGeometry);
    resizeObserver.observe(body);
    window.addEventListener('resize', scheduleGeometry, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleGeometry, { passive: true });
    scheduleGeometry();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleGeometry);
      window.visualViewport?.removeEventListener('resize', scheduleGeometry);
      if (frame) window.cancelAnimationFrame(frame);
      placeholder.remove();
      delete sidebar.dataset.scrollState;
      restoreInlineStyles(sidebar, sidebarSnapshot);
    };
  }, []);

  return null;
}

function readFixedTop(sidebar: HTMLElement) {
  const value = Number.parseFloat(window.getComputedStyle(sidebar).top);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_FIXED_TOP;
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
