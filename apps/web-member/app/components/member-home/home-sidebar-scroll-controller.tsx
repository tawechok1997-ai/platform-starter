'use client';

import { useLayoutEffect } from 'react';

const BODY_SELECTOR = '.desktop-reference-home > .desktop-home__body';
const MAIN_SELECTOR = ':scope > .reference-main-column';
const SIDEBAR_SELECTOR = ':scope > .reference-sidebar';
const DEFAULT_PIN_TOP = 124;
const VIEWPORT_GAP = 12;
const MIN_VISIBLE_HEIGHT = 240;
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
  'grid-column',
  'grid-row',
] as const;
const BODY_MANAGED_PROPERTIES = [
  'position',
  'display',
  'grid-template-columns',
  'align-items',
  'gap',
  'overflow',
] as const;
const MAIN_MANAGED_PROPERTIES = ['grid-column', 'grid-row', 'min-width'] as const;

type InlineSnapshot = Record<(typeof MANAGED_PROPERTIES)[number], { value: string; priority: string }>;
type BodyInlineSnapshot = Record<(typeof BODY_MANAGED_PROPERTIES)[number], { value: string; priority: string }>;
type MainInlineSnapshot = Record<(typeof MAIN_MANAGED_PROPERTIES)[number], { value: string; priority: string }>;

export default function HomeSidebarScrollController() {
  useLayoutEffect(() => {
    const body = document.querySelector<HTMLElement>(BODY_SELECTOR);
    const main = body?.querySelector<HTMLElement>(MAIN_SELECTOR) ?? null;
    const sidebar = body?.querySelector<HTMLElement>(SIDEBAR_SELECTOR) ?? null;
    if (!body || !main || !sidebar) return;

    const bodySnapshot = snapshotBodyInlineStyles(body);
    const mainSnapshot = snapshotMainInlineStyles(main);
    const sidebarSnapshot = snapshotInlineStyles(sidebar);
    const pinTop = readPinTop(sidebar);
    const railWidth = sidebar.offsetWidth;
    let frame = 0;

    const syncGeometry = () => {
      frame = 0;
      if (!body.isConnected || !main.isConnected || !sidebar.isConnected) return;

      const bodyRect = body.getBoundingClientRect();
      const scale = resolveElementScale(body, bodyRect.width);
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const visibleHeight = Math.max(
        MIN_VISIBLE_HEIGHT,
        (viewportHeight - pinTop - VIEWPORT_GAP) / scale,
      );

      sidebar.style.setProperty('max-height', `${visibleHeight.toFixed(3)}px`, 'important');

      const followTop = Math.max(0, (pinTop - bodyRect.top) / scale);
      const maxTop = Math.max(0, body.scrollHeight - sidebar.offsetHeight);
      const top = Math.min(followTop, maxTop);

      sidebar.style.setProperty('top', `${top.toFixed(3)}px`, 'important');
    };

    const scheduleGeometry = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncGeometry);
    };

    // Own the complete two-column geometry at runtime. An absolutely positioned
    // grid child otherwise keeps its static grid area, so left: 0 can still mean
    // "the left edge of the right column". Explicit placement removes that trap.
    body.style.setProperty('position', 'relative', 'important');
    body.style.setProperty('display', 'grid', 'important');
    body.style.setProperty('grid-template-columns', '360px minmax(0, 1080px)', 'important');
    body.style.setProperty('align-items', 'start', 'important');
    body.style.setProperty('gap', '15px', 'important');
    body.style.setProperty('overflow', 'visible', 'important');

    main.style.setProperty('grid-column', '2', 'important');
    main.style.setProperty('grid-row', '1', 'important');
    main.style.setProperty('min-width', '0', 'important');

    sidebar.style.setProperty('grid-column', '1', 'important');
    sidebar.style.setProperty('grid-row', '1', 'important');
    sidebar.style.setProperty('position', 'absolute', 'important');
    sidebar.style.setProperty('top', '0px', 'important');
    sidebar.style.setProperty('right', 'auto', 'important');
    sidebar.style.setProperty('bottom', 'auto', 'important');
    sidebar.style.setProperty('left', '0px', 'important');
    if (railWidth > 0) sidebar.style.setProperty('width', `${railWidth}px`, 'important');
    sidebar.style.setProperty('margin', '0', 'important');
    sidebar.style.setProperty('transform', 'none', 'important');
    sidebar.style.setProperty('z-index', '20', 'important');
    sidebar.style.setProperty('will-change', 'top', 'important');
    sidebar.style.setProperty('align-self', 'start', 'important');
    sidebar.style.setProperty('overflow-x', 'hidden', 'important');
    sidebar.style.setProperty('overflow-y', 'auto', 'important');
    sidebar.style.setProperty('overscroll-behavior', 'contain', 'important');
    sidebar.style.setProperty('scrollbar-gutter', 'stable', 'important');
    sidebar.dataset.scrollState = 'following';

    const resizeObserver = new ResizeObserver(scheduleGeometry);
    resizeObserver.observe(body);
    window.addEventListener('scroll', scheduleGeometry, { passive: true });
    window.addEventListener('resize', scheduleGeometry, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleGeometry, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleGeometry, { passive: true });
    scheduleGeometry();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleGeometry);
      window.removeEventListener('resize', scheduleGeometry);
      window.visualViewport?.removeEventListener('scroll', scheduleGeometry);
      window.visualViewport?.removeEventListener('resize', scheduleGeometry);
      if (frame) window.cancelAnimationFrame(frame);
      delete sidebar.dataset.scrollState;
      restoreInlineStyles(sidebar, sidebarSnapshot);
      restoreMainInlineStyles(main, mainSnapshot);
      restoreBodyInlineStyles(body, bodySnapshot);
    };
  }, []);

  return null;
}

function readPinTop(sidebar: HTMLElement) {
  const value = Number.parseFloat(window.getComputedStyle(sidebar).top);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PIN_TOP;
}

function resolveElementScale(element: HTMLElement, renderedWidth: number) {
  const layoutWidth = element.offsetWidth;
  const scale = layoutWidth > 0 && renderedWidth > 0 ? renderedWidth / layoutWidth : 1;
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
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

function snapshotBodyInlineStyles(element: HTMLElement): BodyInlineSnapshot {
  return Object.fromEntries(BODY_MANAGED_PROPERTIES.map((property) => [
    property,
    {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    },
  ])) as BodyInlineSnapshot;
}

function snapshotMainInlineStyles(element: HTMLElement): MainInlineSnapshot {
  return Object.fromEntries(MAIN_MANAGED_PROPERTIES.map((property) => [
    property,
    {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property),
    },
  ])) as MainInlineSnapshot;
}

function restoreInlineStyles(element: HTMLElement, snapshot: InlineSnapshot) {
  MANAGED_PROPERTIES.forEach((property) => restoreInlineProperty(element, property, snapshot[property]));
}

function restoreBodyInlineStyles(element: HTMLElement, snapshot: BodyInlineSnapshot) {
  BODY_MANAGED_PROPERTIES.forEach((property) => restoreInlineProperty(element, property, snapshot[property]));
}

function restoreMainInlineStyles(element: HTMLElement, snapshot: MainInlineSnapshot) {
  MAIN_MANAGED_PROPERTIES.forEach((property) => restoreInlineProperty(element, property, snapshot[property]));
}

function restoreInlineProperty(
  element: HTMLElement,
  property: string,
  snapshot: { value: string; priority: string },
) {
  if (snapshot.value) element.style.setProperty(property, snapshot.value, snapshot.priority);
  else element.style.removeProperty(property);
}
