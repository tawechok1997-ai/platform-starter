'use client';

import { useEffect } from 'react';

const DIALOGS = [
  { id: 'member-search-title', kind: 'search' },
  { id: 'daily-mission-title', kind: 'mission' },
] as const;

const SEARCH_TRIGGER_SELECTOR = [
  '.public-home-search',
  '[aria-label="ค้นหาเกม"]',
  '[aria-label="Search games"]',
].join(',');

const DIALOG_TRIGGER_SELECTOR = [
  SEARCH_TRIGGER_SELECTOR,
  '.public-home-mission',
  '[aria-haspopup="dialog"][href="#daily-mission"]',
].join(',');

function forceOverlayAboveChrome(overlay: HTMLElement, kind: string) {
  if (overlay.dataset.publicDialogOverlay === kind) return;

  overlay.dataset.publicDialogOverlay = kind;
  overlay.classList.add('public-dialog-runtime-overlay');
  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('z-index', '2147483647', 'important');
  overlay.style.setProperty('isolation', 'isolate', 'important');
  overlay.style.setProperty('width', '100vw', 'important');
  overlay.style.setProperty('height', '100dvh', 'important');
  overlay.style.setProperty('margin', '0', 'important');
  overlay.style.setProperty('overflow', 'hidden', 'important');
  overlay.style.setProperty('opacity', '1', 'important');
  overlay.style.setProperty('visibility', 'visible', 'important');
  overlay.style.setProperty('pointer-events', 'auto', 'important');
  overlay.style.setProperty('transform', 'none', 'important');
  overlay.style.setProperty('filter', 'none', 'important');
}

function normalizeDialog(id: string, kind: string) {
  const dialog = document.querySelector<HTMLElement>(`section[role="dialog"][aria-labelledby="${id}"]`);
  if (!dialog) return;

  dialog.classList.add('public-dialog-runtime', `public-dialog-runtime--${kind}`);
  dialog.style.setProperty('position', 'relative', 'important');
  dialog.style.setProperty('z-index', '1', 'important');

  const overlay = dialog.parentElement;
  if (overlay instanceof HTMLElement) forceOverlayAboveChrome(overlay, kind);

  dialog.querySelector<HTMLElement>(':scope > header')
    ?.classList.add('public-dialog-runtime-header');
  dialog.querySelector<HTMLButtonElement>('button[aria-label^="ปิด"], button[aria-label^="Close"]')
    ?.classList.add('public-dialog-runtime-close');
}

function normalizeAllDialogs() {
  for (const dialog of DIALOGS) normalizeDialog(dialog.id, dialog.kind);
}

export default function PublicDialogRuntimeController() {
  useEffect(() => {
    let frame = 0;

    const normalizeAfterOpen = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>(DIALOG_TRIGGER_SELECTOR);
      if (!trigger) return;

      if (trigger.matches(SEARCH_TRIGGER_SELECTOR)) event.preventDefault();
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(normalizeAllDialogs);
    };

    normalizeAllDialogs();
    document.addEventListener('click', normalizeAfterOpen, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('click', normalizeAfterOpen, true);
    };
  }, []);

  return null;
}
