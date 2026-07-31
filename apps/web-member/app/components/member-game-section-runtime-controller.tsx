'use client';

import { useLayoutEffect } from 'react';
import { useMemberRuntime } from '../member-runtime-provider';

const CARD_SELECTOR = [
  '.source-highlight-game',
  '.v47-mobile-game-grid > a',
  '.reference-game-tile',
  '[data-game-card]',
  '.member-game-card',
].join(',');

export default function MemberGameSectionRuntimeController() {
  const { gameSections } = useMemberRuntime();

  useLayoutEffect(() => {
    let frame = 0;
    const mobile = window.matchMedia('(max-width: 900px)');

    const sync = () => {
      frame = 0;
      for (const section of gameSections) {
        document.querySelectorAll<HTMLElement>(`[data-section-kind="${section.id}"]`).forEach((root) => {
          const limit = mobile.matches ? section.mobileLimit : section.desktopLimit;
          root.dataset.runtimeLimit = String(limit);
          root.dataset.runtimeCategory = section.category ?? '';
          root.hidden = !section.enabled;
          root.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach((card, index) => {
            const runtimeHidden = index >= limit;
            card.dataset.runtimeLimitHidden = runtimeHidden ? 'true' : 'false';
            if (runtimeHidden) card.hidden = true;
            else if (card.dataset.runtimeSourceHidden !== 'true') card.hidden = false;
          });
          const action = root.querySelector<HTMLAnchorElement>('header a, [data-section-action]');
          if (action && section.href && action.href !== absolute(section.href)) action.href = section.href;
        });
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    mobile.addEventListener?.('change', schedule);
    return () => {
      observer.disconnect();
      mobile.removeEventListener?.('change', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [gameSections]);

  return null;
}

function absolute(value: string) {
  try {
    return new URL(value, window.location.origin).href;
  } catch {
    return value;
  }
}
