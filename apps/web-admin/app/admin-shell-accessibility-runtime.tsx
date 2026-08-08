'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './admin-final-closure.css';

const CONDITIONAL_CONTROLS = [
  ['.admin-command-trigger', 'admin-command-dialog'],
  ['.admin-notification-trigger', 'admin-notification-menu'],
  ['.admin-sidebar-profile__trigger', 'admin-profile-menu'],
] as const;

export function AdminShellAccessibilityRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const synchronizeAccessibility = () => {
      for (const [selector, targetId] of CONDITIONAL_CONTROLS) {
        const trigger = document.querySelector<HTMLElement>(selector);
        if (!trigger) continue;
        if (document.getElementById(targetId)) trigger.setAttribute('aria-controls', targetId);
        else trigger.removeAttribute('aria-controls');
      }

      if (pathname === '/provider-credentials') {
        const providerSelect = document.querySelector<HTMLSelectElement>('.admin-content-shell .admin-ui-stack > select');
        if (
          providerSelect
          && !providerSelect.getAttribute('aria-label')
          && !providerSelect.getAttribute('aria-labelledby')
          && !providerSelect.getAttribute('title')
        ) {
          providerSelect.setAttribute('aria-label', 'เลือกค่ายเกม');
        }
      }
    };

    synchronizeAccessibility();
    const observer = new MutationObserver(synchronizeAccessibility);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
