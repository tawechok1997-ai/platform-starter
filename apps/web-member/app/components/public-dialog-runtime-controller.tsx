'use client';

import { useEffect } from 'react';
import MemberSearchOverlay from './member-search-overlay';

const DIALOGS = [
  { id: 'member-search-title', kind: 'search' },
  { id: 'daily-mission-title', kind: 'mission' },
] as const;

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

  return <MemberSearchOverlay />;
}
