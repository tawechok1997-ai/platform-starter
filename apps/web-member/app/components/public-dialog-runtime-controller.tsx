'use client';

import { useEffect } from 'react';

const DIALOGS = [
  { id: 'member-search-title', kind: 'search' },
  { id: 'daily-mission-title', kind: 'mission' },
  { id: 'usage-guide-title', kind: 'guide' },
] as const;

const SEARCH_TRIGGER_SELECTOR = [
  '.public-home-search',
  '[aria-label="ค้นหาเกม"]',
  '[aria-label="Search games"]',
].join(',');

function normalizeDialog(id: string, kind: string) {
  const dialog = document.querySelector<HTMLElement>(`section[role="dialog"][aria-labelledby="${id}"]`);
  if (!dialog) return;

  dialog.classList.add('public-dialog-runtime', `public-dialog-runtime--${kind}`);

  const overlay = dialog.parentElement;
  if (overlay instanceof HTMLElement) {
    overlay.classList.add('public-dialog-runtime-overlay');
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
      // Do not stop propagation. MemberSearchOverlay owns opening the existing
      // search dialog from this same click; this guard only removes navigation.
    };

    document.addEventListener('click', preventSearchNavigation, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('click', preventSearchNavigation, true);
    };
  }, []);

  return null;
}
