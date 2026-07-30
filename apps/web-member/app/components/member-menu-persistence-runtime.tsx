'use client';

import { useEffect, useRef } from 'react';

const PROFILE_TRIGGER = '.public-member-profile-trigger';
const PROFILE_MENU = '#public-member-profile-menu';
const CHILD_LAYER = '[data-member-layer-keeps-profile-open], [role="dialog"][aria-modal="true"]';
const KEEP_OPEN_WINDOW_MS = 1_200;

export default function MemberMenuPersistenceRuntime() {
  const keepOpenUntilRef = useRef(0);
  const ownReopenRef = useRef(false);

  useEffect(() => {
    const trigger = () => document.querySelector<HTMLButtonElement>(PROFILE_TRIGGER);

    const ensureProfileOpen = () => {
      if (Date.now() > keepOpenUntilRef.current) return;
      const button = trigger();
      if (!button || button.getAttribute('aria-expanded') === 'true') return;
      ownReopenRef.current = true;
      button.click();
      ownReopenRef.current = false;
    };

    const scheduleReopen = () => {
      window.setTimeout(ensureProfileOpen, 0);
      window.setTimeout(ensureProfileOpen, 60);
      window.setTimeout(ensureProfileOpen, 180);
    };

    const rememberMenuInteraction = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const menu = event.target.closest(PROFILE_MENU);
      if (!menu) return;
      const button = trigger();
      if (button?.getAttribute('aria-expanded') !== 'true') return;
      keepOpenUntilRef.current = Date.now() + KEEP_OPEN_WINDOW_MS;
      scheduleReopen();
    };

    const preserveDuringChildInteraction = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest(CHILD_LAYER)) return;
      keepOpenUntilRef.current = Date.now() + KEEP_OPEN_WINDOW_MS;
      scheduleReopen();
    };

    const blockLegacyProgrammaticClose = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest(PROFILE_TRIGGER)) return;
      if (ownReopenRef.current || event.isTrusted) return;
      const button = trigger();
      const shouldStayOpen = button?.getAttribute('aria-expanded') === 'true'
        && (Date.now() <= keepOpenUntilRef.current || Boolean(document.querySelector(CHILD_LAYER)));
      if (!shouldStayOpen) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    document.addEventListener('pointerdown', rememberMenuInteraction, true);
    document.addEventListener('pointerdown', preserveDuringChildInteraction, true);
    document.addEventListener('click', blockLegacyProgrammaticClose, true);

    return () => {
      document.removeEventListener('pointerdown', rememberMenuInteraction, true);
      document.removeEventListener('pointerdown', preserveDuringChildInteraction, true);
      document.removeEventListener('click', blockLegacyProgrammaticClose, true);
    };
  }, []);

  return null;
}
