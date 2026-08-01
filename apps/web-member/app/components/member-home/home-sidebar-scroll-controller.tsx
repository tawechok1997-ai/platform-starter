'use client';

import { useLayoutEffect } from 'react';

const BODY_SELECTOR = '.desktop-reference-home > .desktop-home__body';
const SIDEBAR_SELECTOR = ':scope > .reference-sidebar';
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
] as const;

type InlineSnapshot = Record<(typeof MANAGED_PROPERTIES)[number], { value: string; priority: string }>;

export default function HomeSidebarScrollController() {
  useLayoutEffect(() => {
    const body = document.querySelector<HTMLElement>(BODY_SELECTOR);
    const sidebar = body?.querySelector<HTMLElement>(SIDEBAR_SELECTOR) ?? null;
    if (!body || !sidebar) return;

    const bodyPosition = {
      value: body.style.getPropertyValue('position'),
      priority: body.style.getPropertyPriority('position'),
    };
    const bodyOverflow = {
      value: body.style.getPropertyValue('overflow'),
      priority: body.style.getPropertyPriority('overflow'),
    };
    const sidebarSnapshot = snapshotInlineStyles(sidebar);
    const stickyTopCss = readStickyTop(sidebar);

    let frame = 0;
    let lastTop = Number.NaN;

    body.style.setProperty('position', 'relative', 'important');
    body.style.setProperty('overflow', 'visible', 'important');
    sidebar.style.setProperty('position', 'absolute', 'important');
    sidebar.style.setProperty('right', '0', 'important');
    sidebar.style.setProperty('bottom', 'auto', 'important');
    sidebar.style.setProperty('left', 'auto', 'important');
    sidebar.style.setProperty('margin', '0', 'important');
    sidebar.style.setProperty('transform', 'none', 'important');
    sidebar.style.setProperty('z-index', '20', 'important');
    sidebar.style.setProperty('will-change', 'top', 'important');
    sidebar.dataset.scrollState = 'managed';

    const updateNow = () => {
      frame = 0;
      if (!sidebar.isConnected || !body.isConnected) return;

      const bodyRect = body.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const scale = readRenderedScale(sidebar, sidebarRect);
      const stickyTopPhysical = stickyTopCss * scale;
      const maxTopPhysical = Math.max(0, bodyRect.height - sidebarRect.height);
      const desiredTopPhysical = stickyTopPhysical - bodyRect.top;
      const clampedTopPhysical = Math.min(maxTopPhysical, Math.max(0, desiredTopPhysical));
      const nextTop = clampedTopPhysical / scale;

      if (!Number.isFinite(nextTop)) return;
      if (Number.isFinite(lastTop) && Math.abs(lastTop - nextTop) < 0.25) return;

      lastTop = nextTop;
      sidebar.style.setProperty('top', `${nextTop.toFixed(3)}px`, 'important');
      sidebar.dataset.scrollState = clampedTopPhysical <= 0.5
        ? 'start'
        : clampedTopPhysical >= maxTopPhysical - 0.5
          ? 'end'
          : 'following';
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateNow);
    };

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(body);
    resizeObserver.observe(sidebar);

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener('scroll', scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('resize', scheduleUpdate);
      window.visualViewport?.removeEventListener('scroll', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      delete sidebar.dataset.scrollState;
      restoreInlineStyles(sidebar, sidebarSnapshot);
      restoreInlineProperty(body, 'position', bodyPosition);
      restoreInlineProperty(body, 'overflow', bodyOverflow);
    };
  }, []);

  return null;
}

function readStickyTop(sidebar: HTMLElement) {
  const value = Number.parseFloat(window.getComputedStyle(sidebar).top);
  return Number.isFinite(value) ? value : 124;
}

function readRenderedScale(sidebar: HTMLElement, rect: DOMRect) {
  const layoutWidth = sidebar.offsetWidth;
  if (layoutWidth > 0 && rect.width > 0) {
    const measured = rect.width / layoutWidth;
    if (Number.isFinite(measured) && measured > 0) return measured;
  }
  return 1;
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
