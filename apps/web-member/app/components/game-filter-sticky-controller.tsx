'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const FILTER_SELECTOR = '.public-game-shell__content aside[aria-label^="ตัวกรอง"]';
const DESKTOP_QUERY = '(min-width: 901px)';
const STICKY_TOP_PX = 124;
const VIEWPORT_BOTTOM_GAP_PX = 20;

type ManagedFilter = {
  filter: HTMLElement;
  boundary: HTMLElement;
  placeholder: HTMLDivElement;
};

export default function GameFilterStickyController() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith('/browse')) return;

    const media = window.matchMedia(DESKTOP_QUERY);
    const originalStyles = new Map<HTMLElement, string | null>();
    const managed: ManagedFilter[] = [];
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let animationFrame = 0;
    let setupTimer = 0;

    const rememberStyle = (element: HTMLElement) => {
      if (!originalStyles.has(element)) originalStyles.set(element, element.getAttribute('style'));
    };

    const restoreStyle = (element: HTMLElement) => {
      const original = originalStyles.get(element);
      if (original === null) element.removeAttribute('style');
      else if (original !== undefined) element.setAttribute('style', original);
    };

    const setImportant = (element: HTMLElement, property: string, value: string) => {
      element.style.setProperty(property, value, 'important');
    };

    const removeManagedEntry = (entry: ManagedFilter) => {
      resizeObserver?.unobserve(entry.boundary);
      resizeObserver?.unobserve(entry.filter);
      entry.placeholder.remove();
      restoreStyle(entry.filter);
    };

    const restoreEverything = () => {
      managed.splice(0).forEach(removeManagedEntry);
      originalStyles.forEach((_style, element) => restoreStyle(element));
      originalStyles.clear();
    };

    const prepareAncestors = (boundary: HTMLElement) => {
      let current: HTMLElement | null = boundary;
      while (current) {
        rememberStyle(current);
        setImportant(current, 'overflow', 'visible');
        setImportant(current, 'overflow-x', 'visible');
        setImportant(current, 'overflow-y', 'visible');
        setImportant(current, 'contain', 'none');
        if (current.classList.contains('public-game-shell__content')) break;
        current = current.parentElement;
      }

      setImportant(boundary, 'position', 'relative');
      setImportant(boundary, 'align-items', 'start');
    };

    const prepareFilter = (filter: HTMLElement) => {
      if (!media.matches) return;
      const boundary = filter.parentElement;
      if (!boundary || boundary.querySelector(':scope > [data-game-filter-placeholder="true"]')) return;

      rememberStyle(filter);
      prepareAncestors(boundary);

      const placeholder = document.createElement('div');
      placeholder.dataset.gameFilterPlaceholder = 'true';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.style.pointerEvents = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.style.boxSizing = 'border-box';
      filter.before(placeholder);

      const entry = { filter, boundary, placeholder };
      managed.push(entry);
      resizeObserver?.observe(boundary);
      resizeObserver?.observe(filter);
    };

    const updateFilter = ({ filter, boundary, placeholder }: ManagedFilter) => {
      if (!filter.isConnected || !boundary.isConnected || !placeholder.isConnected || !media.matches) return;

      const availableHeight = Math.max(320, window.innerHeight - STICKY_TOP_PX - VIEWPORT_BOTTOM_GAP_PX);
      const fullContentHeight = filter.scrollHeight;

      setImportant(filter, 'max-height', `${availableHeight}px`);
      setImportant(filter, 'overflow-x', 'hidden');
      setImportant(filter, 'overflow-y', fullContentHeight > availableHeight ? 'auto' : 'visible');
      setImportant(filter, 'overscroll-behavior', 'contain');
      setImportant(filter, 'scrollbar-width', fullContentHeight > availableHeight ? 'thin' : 'none');
      setImportant(filter, 'height', 'fit-content');
      setImportant(filter, 'z-index', '40');

      const currentRect = filter.getBoundingClientRect();
      const computed = window.getComputedStyle(filter);
      const width = currentRect.width || Number.parseFloat(computed.width) || 345;
      const renderedHeight = Math.min(fullContentHeight || currentRect.height, availableHeight);

      placeholder.style.display = 'block';
      placeholder.style.width = `${width}px`;
      placeholder.style.minWidth = `${width}px`;
      placeholder.style.maxWidth = `${width}px`;
      placeholder.style.height = `${renderedHeight}px`;
      placeholder.style.flex = `0 0 ${width}px`;

      const placeholderRect = placeholder.getBoundingClientRect();
      const boundaryRect = boundary.getBoundingClientRect();
      const filterHeight = Math.min(filter.getBoundingClientRect().height || renderedHeight, availableHeight);
      const startDocumentTop = placeholderRect.top + window.scrollY;
      const boundaryDocumentTop = boundaryRect.top + window.scrollY;
      const endDocumentTop = boundaryDocumentTop + boundary.offsetHeight - filterHeight;
      const desiredDocumentTop = window.scrollY + STICKY_TOP_PX;
      const fixedWidth = placeholderRect.width || width;

      setImportant(filter, 'width', `${fixedWidth}px`);
      setImportant(filter, 'min-width', `${fixedWidth}px`);
      setImportant(filter, 'max-width', `${fixedWidth}px`);
      setImportant(filter, 'margin', '0');
      setImportant(filter, 'right', 'auto');

      if (desiredDocumentTop <= startDocumentTop || endDocumentTop <= startDocumentTop) {
        setImportant(filter, 'position', 'absolute');
        setImportant(filter, 'top', `${placeholder.offsetTop}px`);
        setImportant(filter, 'left', `${placeholder.offsetLeft}px`);
        return;
      }

      if (desiredDocumentTop >= endDocumentTop) {
        setImportant(filter, 'position', 'absolute');
        setImportant(filter, 'top', `${Math.max(placeholder.offsetTop, boundary.offsetHeight - filterHeight)}px`);
        setImportant(filter, 'left', `${placeholder.offsetLeft}px`);
        return;
      }

      setImportant(filter, 'position', 'fixed');
      setImportant(filter, 'top', `${STICKY_TOP_PX}px`);
      setImportant(filter, 'left', `${placeholderRect.left}px`);
    };

    const updateAll = () => {
      animationFrame = 0;
      for (let index = managed.length - 1; index >= 0; index -= 1) {
        const entry = managed[index];
        if (!entry || !entry.filter.isConnected || !entry.boundary.isConnected) {
          if (entry) removeManagedEntry(entry);
          managed.splice(index, 1);
          continue;
        }
        updateFilter(entry);
      }
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateAll);
    };

    const syncFilters = () => {
      if (!media.matches) return;
      document.querySelectorAll<HTMLElement>(FILTER_SELECTOR).forEach(prepareFilter);
      scheduleUpdate();
    };

    const handleMediaChange = () => {
      if (media.matches) syncFilters();
      else restoreEverything();
    };

    const setup = () => {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      mutationObserver = new MutationObserver(syncFilters);
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      syncFilters();
    };

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    media.addEventListener('change', handleMediaChange);
    setupTimer = window.setTimeout(setup, 0);

    return () => {
      window.clearTimeout(setupTimer);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      media.removeEventListener('change', handleMediaChange);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      restoreEverything();
    };
  }, [pathname]);

  return null;
}
