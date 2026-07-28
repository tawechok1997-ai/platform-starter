'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const DESKTOP_BREAKPOINT = 1024;
const STICKY_TOP = 100;
const MAX_ATTACH_FRAMES = 180;

function setImportant(element: HTMLElement, property: string, value: string) {
  element.style.setProperty(property, value, 'important');
}

function clearManagedStyles(body: HTMLElement, sidebar: HTMLElement) {
  delete sidebar.dataset.scrollState;
  [
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'width',
    'min-width',
    'max-width',
    'height',
    'max-height',
    'margin',
    'transform',
    'z-index',
  ].forEach((property) => sidebar.style.removeProperty(property));

  ['position', 'overflow', 'overflow-x', 'overflow-y'].forEach((property) => body.style.removeProperty(property));
}

export default function HomeSidebarScrollController() {
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    if (pathname !== '/') return;

    let attachFrame = 0;
    let updateFrame = 0;
    let attachAttempts = 0;
    let detachCurrent = () => {};

    const attach = () => {
      detachCurrent();

      const body = document.querySelector<HTMLElement>('.desktop-reference-home > .desktop-home__body');
      const sidebar = body?.querySelector<HTMLElement>(':scope > .reference-sidebar') ?? null;

      if (!body || !sidebar) {
        if (attachAttempts < MAX_ATTACH_FRAMES) {
          attachAttempts += 1;
          attachFrame = window.requestAnimationFrame(attach);
        }
        return;
      }

      let disposed = false;

      const updateNow = () => {
        if (disposed) return;

        if (window.innerWidth < DESKTOP_BREAKPOINT) {
          clearManagedStyles(body, sidebar);
          return;
        }

        setImportant(body, 'position', 'relative');
        setImportant(body, 'overflow', 'visible');
        setImportant(body, 'overflow-x', 'visible');
        setImportant(body, 'overflow-y', 'visible');

        setImportant(sidebar, 'width', '360px');
        setImportant(sidebar, 'min-width', '360px');
        setImportant(sidebar, 'max-width', '360px');
        setImportant(sidebar, 'height', 'max-content');
        setImportant(sidebar, 'max-height', 'none');
        setImportant(sidebar, 'margin', '0');
        setImportant(sidebar, 'transform', 'none');
        setImportant(sidebar, 'z-index', '40');

        const bodyRect = body.getBoundingClientRect();
        const bodyTop = bodyRect.top + window.scrollY;
        const bodyHeight = body.offsetHeight;
        const sidebarHeight = sidebar.offsetHeight;
        const maxTop = Math.max(0, bodyHeight - sidebarHeight);
        const startScroll = bodyTop - STICKY_TOP;
        const stopScroll = bodyTop + maxTop - STICKY_TOP;

        if (maxTop <= 0 || window.scrollY <= startScroll) {
          sidebar.dataset.scrollState = 'start';
          setImportant(sidebar, 'position', 'absolute');
          setImportant(sidebar, 'top', '0');
          setImportant(sidebar, 'right', '0');
          setImportant(sidebar, 'bottom', 'auto');
          setImportant(sidebar, 'left', 'auto');
          return;
        }

        if (window.scrollY >= stopScroll) {
          sidebar.dataset.scrollState = 'end';
          setImportant(sidebar, 'position', 'absolute');
          setImportant(sidebar, 'top', `${Math.round(maxTop)}px`);
          setImportant(sidebar, 'right', '0');
          setImportant(sidebar, 'bottom', 'auto');
          setImportant(sidebar, 'left', 'auto');
          return;
        }

        const sidebarLeft = Math.max(bodyRect.left, bodyRect.right - sidebar.offsetWidth);
        sidebar.dataset.scrollState = 'fixed';
        setImportant(sidebar, 'position', 'fixed');
        setImportant(sidebar, 'top', `${STICKY_TOP}px`);
        setImportant(sidebar, 'right', 'auto');
        setImportant(sidebar, 'bottom', 'auto');
        setImportant(sidebar, 'left', `${Math.round(sidebarLeft)}px`);
      };

      const queueUpdate = () => {
        if (updateFrame) return;
        updateFrame = window.requestAnimationFrame(() => {
          updateFrame = 0;
          updateNow();
        });
      };

      const resizeObserver = new ResizeObserver(queueUpdate);
      resizeObserver.observe(body);
      resizeObserver.observe(sidebar);
      window.addEventListener('scroll', queueUpdate, { passive: true });
      window.addEventListener('resize', queueUpdate);
      window.addEventListener('load', queueUpdate);
      queueUpdate();

      detachCurrent = () => {
        disposed = true;
        resizeObserver.disconnect();
        window.removeEventListener('scroll', queueUpdate);
        window.removeEventListener('resize', queueUpdate);
        window.removeEventListener('load', queueUpdate);
        if (updateFrame) window.cancelAnimationFrame(updateFrame);
        updateFrame = 0;
        clearManagedStyles(body, sidebar);
      };
    };

    attachFrame = window.requestAnimationFrame(attach);

    return () => {
      if (attachFrame) window.cancelAnimationFrame(attachFrame);
      detachCurrent();
    };
  }, [pathname]);

  return null;
}
