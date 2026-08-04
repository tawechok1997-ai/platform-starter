'use client';

import { useEffect } from 'react';
import MemberSearchOverlay from './member-search-overlay';
import MobileRelatedPopupStackRuntime from './mobile-related-popup-stack-runtime';

const DIALOGS = [
  { id: 'member-search-title', kind: 'search' },
  { id: 'daily-mission-title', kind: 'mission' },
] as const;

function markOverlay(overlay: HTMLElement, kind: string) {
  overlay.dataset.publicDialogOverlay = kind;
  overlay.classList.add('public-dialog-runtime-overlay');
}

function normalizeDialog(id: string, kind: string) {
  const dialog = document.querySelector<HTMLElement>(`section[role="dialog"][aria-labelledby="${id}"]`);
  if (!dialog) return;

  dialog.classList.add('public-dialog-runtime', `public-dialog-runtime--${kind}`);

  const overlay = dialog.parentElement;
  if (overlay instanceof HTMLElement) markOverlay(overlay, kind);

  dialog.querySelector<HTMLElement>(':scope > header')
    ?.classList.add('public-dialog-runtime-header');
  dialog.querySelector<HTMLButtonElement>('button[aria-label^="ปิด"], button[aria-label^="Close"]')
    ?.classList.add('public-dialog-runtime-close');
}

function normalizeAllDialogs() {
  for (const dialog of DIALOGS) normalizeDialog(dialog.id, dialog.kind);
}

function containsSupportedDialog(node: Node) {
  if (!(node instanceof Element)) return false;
  if (node.matches('section[role="dialog"][aria-labelledby="member-search-title"], section[role="dialog"][aria-labelledby="daily-mission-title"]')) return true;
  return Boolean(node.querySelector('section[role="dialog"][aria-labelledby="member-search-title"], section[role="dialog"][aria-labelledby="daily-mission-title"]'));
}

export default function PublicDialogRuntimeController() {
  useEffect(() => {
    let frame = 0;
    const root = document.body;

    const scheduleNormalize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(normalizeAllDialogs);
    };

    normalizeAllDialogs();
    const observer = new MutationObserver((records) => {
      if (!records.some((record) => Array.from(record.addedNodes).some(containsSupportedDialog))) return;
      scheduleNormalize();
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <MemberSearchOverlay />
      <MobileRelatedPopupStackRuntime />
    </>
  );
}
