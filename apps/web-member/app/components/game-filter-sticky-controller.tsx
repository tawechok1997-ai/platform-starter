'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    if (!pathname?.startsWith('/browse')) return;

    const media = window.matchMedia(DESKTOP_QUERY);
    const originalStyles = new Map<HTMLElement, string | null>();
    const managed: ManagedFilter[] = [];
    let resizeObserver: ResizeObserver | null = null;
    let animationFrame = 0;
    let setupTimer = 0;

    const rememberStyle = (element: HTMLElement) => {
      if (!originalStyles.has(element)) originalStyles.set(element, element.getAttribute('style'));
    };

    const setImportant = (element: HTMLElement, property: string, value: string) => {
      element.style.setProperty(property, value, 'important');
    };

    const clearManagedPosition = ({ filter, placeholder }: ManagedFilter) => {
      placeholder.style.display = 'none';
      const original = originalStyles.get(filter);
      if (original === null) filter.removeAttribute('style');
      else if (original !== undefined) filter.setAttribute('style', original);
    };

    const restoreEverything = () => {
      managed.forEach(({ placeholder }) => placeholder.remove());
      managed.length = 0;
      originalStyles.forEach((style, element) => {
        if (style === null) element.removeAttribute('style');
        else element.setAttribute('style', style);
      });
      originalStyles.clear();
    };

    const prepareAncestors = (boundary: HTMLElement) => {
      let current: HTMLElement | null = boundary;
      while (current) {
        rememberStyle(current);
        setImportant(current, 'overflow-y', 'visible');
        setImportant(current, 'overflow-x', 'visible');
        setImportant(current, 'contain', 'none');
        if (current.classList.contains('public-game-shell__content')) break;
        current = current.parentElement;
      }

      setImportant(boundary, 'position', 'relative');
      setImportant(boundary, 'align-items', 'start');
    };

    const prepareFilter = (filter: HTMLElement) => {
      const boundary = filter.parentElement;
      if (!boundary || boundary.querySelector('[data-game-filter-placeholder="true"]')) return;

      rememberStyle(filter);
      prepareAncestors(boundary);

      const placeholder = document.createElement('div');
      placeholder.dataset.gameFilterPlaceholder = 'true';
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.style.pointerEvents = 'none';
      placeholder.style.visibility = 'hidden';
      placeholder.style.boxSizing = 'border-box';
      filter.before(placeholder);

      managed.push({ filter, boundary, placeholder });
      resizeObserver?.observe(boundary);
      resizeObserver?.observe(filter);
    };

    const updateFilter = (entry: ManagedFilter) => {
      const { filter, boundary, placeholder } = entry;

      if (!media.matches) {
        clearManagedPosition(entry);
        return;
      }

      const availableHeight = Math.max(320, window.innerHeight - STICKY_TOP_PX - VIEWPORT_BOTTOM_GAP_PX);

      setImportant(filter, 'max-height', `${availableHeight}px`);
      setImportant(filter, 'overflow-x', 'hidden');
      setImportant(filter, 'overflow-y', filter.scrollHeight > availableHeight ? 'auto' : 'visible');
      setImportant(filter, 'overscroll-behavior', 'contain');
      setImportant(filter, 'scrollbar-width', filter.scrollHeight > availableHeight ? 'thin' : 'none');
      setImportant(filter, 'height', 'fit-content');
      setImportant(filter, 'z-index', '40');

      const currentRect = filter.getBoundingClientRect();
      const computed = window.getComputedStyle(filter);
      const width = currentRect.width || Number.parseFloat(computed.width) || 345;
      const renderedHeight = Math.min(filter.scrollHeight || currentRect.height, availableHeight);

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

      setImportant(filter, 'width', `${placeholderRect.width || width}px`);
      setImportant(filter, 'min-width', `${placeholderRect.width || width}px`);
      setImportant(filter, 'max-width', `${placeholderRect.width || width}px`);
      setImportant(filter, 'margin', '0');

      if (desiredDocumentTop <= startDocumentTop || endDocumentTop <= startDocumentTop) {
        setImportant(filter, 'position', 'absolute');
        setImportant(filter, 'top', `${placeholder.offsetTop}px`);
        setImportant(filter, 'left', `${placeholder.offsetLeft}px`);
        filter.style.removeProperty('right');
        return;
      }

      if (desiredDocumentTop >= endDocumentTop) {
        setImportant(filter, 'position', 'absolute');
        setImportant(filter, 'top', `${Math.max(placeholder.offsetTop, boundary.offsetHeight - filterHeight)}px`);
        setImportant(filter, 'left', `${placeholder.offsetLeft}px`);
        filter.style.removeProperty('right');
        return;
      }

      setImportant(filter, 'position', 'fixed');
      setImportant(filter, 'top', `${STICKY_TOP_PX}px`);
      setImportant(filter, 'left', `${placeholderRect.left}px`);
      filter.style.removeProperty('right');
    };

    const updateAll = () => {
      animationFrame = 0;
      managed.forEach(updateFilter);
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateAll);
    };

    const setup = () => {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      document.querySelectorAll<HTMLElement>(FILTER_SELECTOR).forEach(prepareFilter);
      scheduleUpdate();
    };

    const handleMediaChange = () => {
      if (!media.matches) managed.forEach(clearManagedPosition);
      scheduleUpdate();
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
      resizeObserver?.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      restoreEverything();
    };
  }, [pathname, searchKey]);

  return null;
}
