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
    let body: HTMLElement | null = null;
    let main: HTMLElement | null = null;
    let sidebar: HTMLElement | null = null;
    let bodySnapshot: BodyInlineSnapshot | null = null;
    let mainSnapshot: MainInlineSnapshot | null = null;
    let sidebarSnapshot: InlineSnapshot | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let frame = 0;
    let disposed = false;

    const syncGeometry = () => {
      frame = 0;
      if (disposed) return;

      if (!body?.isConnected || !main?.isConnected || !sidebar?.isConnected) {
        attachOwners();
      }
      if (!body || !main || !sidebar) return;

      const bodyRect = body.getBoundingClientRect();
      const scale = resolveElementScale(body, bodyRect.width);
      const pinTop = readPinTop(sidebar);
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const visibleHeight = Math.max(
        MIN_VISIBLE_HEIGHT,
        (viewportHeight - pinTop - VIEWPORT_GAP) / scale,
      );

      // Re-assert the runtime owner on every geometry pass. Several legacy
      // stylesheets still declare sticky rules for this rail; inline important
      // keeps one owner in charge instead of letting the cascade hold elections.
      sidebar.style.setProperty('position', 'absolute', 'important');
      sidebar.style.setProperty('right', '0px', 'important');
      sidebar.style.setProperty('left', 'auto', 'important');
      sidebar.style.setProperty('bottom', 'auto', 'important');
      sidebar.style.setProperty('transform', 'none', 'important');
      sidebar.style.setProperty('max-height', `${visibleHeight.toFixed(3)}px`, 'important');

      const followTop = Math.max(0, (pinTop - bodyRect.top) / scale);
      const maxTop = Math.max(0, body.scrollHeight - sidebar.offsetHeight);
      const top = Math.min(followTop, maxTop);
      sidebar.style.setProperty('top', `${top.toFixed(3)}px`, 'important');
      sidebar.dataset.scrollState = top <= 0.5
        ? 'start'
        : top >= maxTop - 0.5
          ? 'end'
          : 'following';
    };

    const scheduleGeometry = () => {
      if (disposed || frame) return;
      frame = window.requestAnimationFrame(syncGeometry);
    };

    const attachOwners = () => {
      const nextBody = document.querySelector<HTMLElement>(BODY_SELECTOR);
      const nextMain = nextBody?.querySelector<HTMLElement>(MAIN_SELECTOR) ?? null;
      const nextSidebar = nextBody?.querySelector<HTMLElement>(SIDEBAR_SELECTOR) ?? null;
      if (!nextBody || !nextMain || !nextSidebar) return;
      if (body === nextBody && main === nextMain && sidebar === nextSidebar) return;

      if (body && bodySnapshot) restoreBodyInlineStyles(body, bodySnapshot);
      if (main && mainSnapshot) restoreMainInlineStyles(main, mainSnapshot);
      if (sidebar && sidebarSnapshot) restoreInlineStyles(sidebar, sidebarSnapshot);
      resizeObserver?.disconnect();

      body = nextBody;
      main = nextMain;
      sidebar = nextSidebar;
      bodySnapshot = snapshotBodyInlineStyles(body);
      mainSnapshot = snapshotMainInlineStyles(main);
      sidebarSnapshot = snapshotInlineStyles(sidebar);

      body.style.setProperty('position', 'relative', 'important');
      body.style.setProperty('display', 'grid', 'important');
      body.style.setProperty('grid-template-columns', 'minmax(0, 1080px) 360px', 'important');
      body.style.setProperty('align-items', 'start', 'important');
      body.style.setProperty('gap', '15px', 'important');
      body.style.setProperty('overflow', 'visible', 'important');

      main.style.setProperty('grid-column', '1', 'important');
      main.style.setProperty('grid-row', '1', 'important');
      main.style.setProperty('min-width', '0', 'important');

      sidebar.style.setProperty('grid-column', '2', 'important');
      sidebar.style.setProperty('grid-row', '1', 'important');
      sidebar.style.setProperty('position', 'absolute', 'important');
      sidebar.style.setProperty('top', '0px', 'important');
      sidebar.style.setProperty('right', '0px', 'important');
      sidebar.style.setProperty('bottom', 'auto', 'important');
      sidebar.style.setProperty('left', 'auto', 'important');
      if (sidebar.offsetWidth > 0) {
        sidebar.style.setProperty('width', `${sidebar.offsetWidth}px`, 'important');
      }
      sidebar.style.setProperty('margin', '0', 'important');
      sidebar.style.setProperty('transform', 'none', 'important');
      sidebar.style.setProperty('z-index', '20', 'important');
      sidebar.style.setProperty('will-change', 'top', 'important');
      sidebar.style.setProperty('align-self', 'start', 'important');
      sidebar.style.setProperty('overflow-x', 'hidden', 'important');
      sidebar.style.setProperty('overflow-y', 'auto', 'important');
      sidebar.style.setProperty('overscroll-behavior', 'contain', 'important');
      sidebar.style.setProperty('scrollbar-gutter', 'stable', 'important');
      sidebar.dataset.homeSidebarOwner = 'runtime';

      resizeObserver = new ResizeObserver(scheduleGeometry);
      resizeObserver.observe(body);
      resizeObserver.observe(main);
      resizeObserver.observe(sidebar);
    };

    attachOwners();
    mutationObserver = new MutationObserver(() => {
      attachOwners();
      scheduleGeometry();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Capture scroll events from window and any nested scroll owner. The old
    // implementation listened only to window, which left the rail frozen when
    // a parent became the actual scroller at a desktop breakpoint.
    document.addEventListener('scroll', scheduleGeometry, true);
    window.addEventListener('scroll', scheduleGeometry, { passive: true });
    window.addEventListener('resize', scheduleGeometry, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleGeometry, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleGeometry, { passive: true });
    scheduleGeometry();

    return () => {
      disposed = true;
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener('scroll', scheduleGeometry, true);
      window.removeEventListener('scroll', scheduleGeometry);
      window.removeEventListener('resize', scheduleGeometry);
      window.visualViewport?.removeEventListener('scroll', scheduleGeometry);
      window.visualViewport?.removeEventListener('resize', scheduleGeometry);
      if (frame) window.cancelAnimationFrame(frame);
      if (sidebar) delete sidebar.dataset.homeSidebarOwner;
      if (sidebar && sidebarSnapshot) restoreInlineStyles(sidebar, sidebarSnapshot);
      if (main && mainSnapshot) restoreMainInlineStyles(main, mainSnapshot);
      if (body && bodySnapshot) restoreBodyInlineStyles(body, bodySnapshot);
    };
  }, []);

  return null;
}

function readPinTop(sidebar: HTMLElement) {
  const configured = Number.parseFloat(
    window.getComputedStyle(document.documentElement).getPropertyValue('--member-desktop-sidebar-pin-top'),
  );
  if (Number.isFinite(configured) && configured > 0) return configured;

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
