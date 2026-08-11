'use client';

import { useEffect } from 'react';

const PASSWORD_EYE_OFF = `
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 3l14 14M8.1 5.3A8.9 8.9 0 0 1 10 5c5.4 0 8.2 5 8.2 5a13 13 0 0 1-2.1 2.8M12.2 14.7A8.8 8.8 0 0 1 10 15c-5.4 0-8.2-5-8.2-5a13 13 0 0 1 2.3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <path d="M7.9 7.9A3 3 0 0 0 12.1 12.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  </svg>`;

const PASSWORD_EYE_ON = `
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M1.8 10s2.8-5 8.2-5 8.2 5 8.2 5-2.8 5-8.2 5-8.2-5-8.2-5Z" stroke="currentColor" stroke-width="1.5" />
    <circle cx="10" cy="10" r="2.4" stroke="currentColor" stroke-width="1.5" />
  </svg>`;

export default function AuthFieldRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.auth-reference-scope');
    if (!root) return;

    const runtimeButtons = new Set<HTMLButtonElement>();
    const forwardEmbeddedEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || window.parent === window) return;
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: 'member-auth-close' }, window.location.origin);
    };

    document.addEventListener('keydown', forwardEmbeddedEscape, true);

    const enhanceFields = () => {
      root.querySelectorAll<HTMLLabelElement>('label.public-auth-field').forEach((field) => {
        const label = field.querySelector<HTMLElement>('.public-auth-field-label')?.textContent?.trim() ?? '';
        const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
        if (!control) return;

        if (label && !control.getAttribute('aria-label')) control.setAttribute('aria-label', label);
        if (control instanceof HTMLInputElement && !control.placeholder && control.type !== 'radio' && control.type !== 'checkbox') {
          control.placeholder = label;
        }

        if (!(control instanceof HTMLInputElement) || control.type !== 'password') return;
        control.dataset.authPasswordEnhanced = 'true';

        const existingToggle = field.querySelector<HTMLButtonElement>('.public-auth-eye, .source-login-eye, .auth-runtime-password-eye');
        if (existingToggle) {
          existingToggle.dataset.authPasswordToggle = 'true';
          return;
        }

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'auth-runtime-password-eye';
        toggle.dataset.authPasswordToggle = 'true';
        toggle.setAttribute('aria-label', 'แสดงรหัสผ่าน');
        toggle.setAttribute('title', 'แสดงรหัสผ่าน');
        toggle.innerHTML = PASSWORD_EYE_OFF;

        const handleToggle = () => {
          const reveal = control.type === 'password';
          control.type = reveal ? 'text' : 'password';
          const actionLabel = reveal ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน';
          toggle.setAttribute('aria-label', actionLabel);
          toggle.setAttribute('title', actionLabel);
          toggle.dataset.visible = reveal ? 'true' : 'false';
          toggle.innerHTML = reveal ? PASSWORD_EYE_ON : PASSWORD_EYE_OFF;
          control.focus({ preventScroll: true });
        };

        toggle.addEventListener('click', handleToggle);
        toggle.dataset.cleanupKey = 'auth-password-toggle';
        field.append(toggle);
        runtimeButtons.add(toggle);
      });
    };

    enhanceFields();
    const observer = new MutationObserver(enhanceFields);
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('keydown', forwardEmbeddedEscape, true);
      observer.disconnect();
      runtimeButtons.forEach((button) => button.remove());
      runtimeButtons.clear();
    };
  }, []);

  return null;
}
