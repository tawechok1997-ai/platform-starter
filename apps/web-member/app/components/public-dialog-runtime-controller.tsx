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

function forceOverlayAboveChrome(overlay: HTMLElement, kind: string) {
  overlay.dataset.publicDialogOverlay = kind;
  overlay.classList.add('public-dialog-runtime-overlay');

  overlay.style.setProperty('position', 'fixed', 'important');
  overlay.style.setProperty('inset', '0', 'important');
  overlay.style.setProperty('top', '0', 'important');
  overlay.style.setProperty('right', '0', 'important');
  overlay.style.setProperty('bottom', '0', 'important');
  overlay.style.setProperty('left', '0', 'important');
  overlay.style.setProperty('z-index', '2147483647', 'important');
  overlay.style.setProperty('isolation', 'isolate', 'important');
  overlay.style.setProperty('width', '100vw', 'important');
  overlay.style.setProperty('min-width', '100vw', 'important');
  overlay.style.setProperty('max-width', '100vw', 'important');
  overlay.style.setProperty('height', '100dvh', 'important');
  overlay.style.setProperty('min-height', '100dvh', 'important');
  overlay.style.setProperty('max-height', '100dvh', 'important');
  overlay.style.setProperty('margin', '0', 'important');
  overlay.style.setProperty('overflow', 'hidden', 'important');
  overlay.style.setProperty('opacity', '1', 'important');
  overlay.style.setProperty('visibility', 'visible', 'important');
  overlay.style.setProperty('pointer-events', 'auto', 'important');
  overlay.style.setProperty('transform', 'none', 'important');
  overlay.style.setProperty('filter', 'none', 'important');
}

function normalizeDialog(id: string, kind: string) {
  const dialog = document.querySelector<HTMLElement>(
    `section[role="dialog"][aria-labelledby="${id}"]`,
  );
  if (!dialog) return;

  dialog.classList.add('public-dialog-runtime', `public-dialog-runtime--${kind}`);
  dialog.style.setProperty('position', 'relative', 'important');
  dialog.style.setProperty('z-index', '1', 'important');

  const overlay = dialog.parentElement;
  if (overlay instanceof HTMLElement) {
    forceOverlayAboveChrome(overlay, kind);
  }

  const header = dialog.querySelector<HTMLElement>(':scope > header');
  header?.classList.add('public-dialog-runtime-header');

  const closeButton = dialog.querySelector<HTMLButtonElement>(
    'button[aria-label^="ปิด"], button[aria-label^="Close"]',
  );
  closeButton?.classList.add('public-dialog-runtime-close');
}

function normalizeAllDialogs() {
  for (const dialog of DIALOGS) normalizeDialog(dialog.id, dialog.kind);
}

export default function PublicDialogRuntimeController() {
  useEffect(() => {
    normalizeAllDialogs();

    const observer = new MutationObserver(() => normalizeAllDialogs());
    observer.observe(document.body, { childList: true, subtree: true });

    const preventSearchNavigation = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trigger = event.target.closest<HTMLElement>(SEARCH_TRIGGER_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
    };

    document.addEventListener('click', preventSearchNavigation, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', preventSearchNavigation, true);
    };
  }, []);

  return null;
}
