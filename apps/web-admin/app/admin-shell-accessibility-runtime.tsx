'use client';

import { useEffect } from 'react';

const CONDITIONAL_CONTROLS = [
  ['.admin-command-trigger', 'admin-command-dialog'],
  ['.admin-notification-trigger', 'admin-notification-menu'],
  ['.admin-sidebar-profile__trigger', 'admin-profile-menu'],
] as const;

export function AdminShellAccessibilityRuntime() {
  useEffect(() => {
    const synchronizeControls = () => {
      for (const [selector, targetId] of CONDITIONAL_CONTROLS) {
        const trigger = document.querySelector<HTMLElement>(selector);
        if (!trigger) continue;
        if (document.getElementById(targetId)) trigger.setAttribute('aria-controls', targetId);
        else trigger.removeAttribute('aria-controls');
      }
    };

    synchronizeControls();
    const observer = new MutationObserver(synchronizeControls);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
