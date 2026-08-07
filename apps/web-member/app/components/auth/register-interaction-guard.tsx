'use client';

import { useEffect } from 'react';

const INTERACTIVE_SELECTOR = [
  '.source-register-submit',
  '.source-register-back',
  '.source-register-card input',
  '.source-register-card select',
  '.source-register-card button',
].join(', ');

export default function RegisterInteractionGuard() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.auth-reference-scope');
    if (!root) return;

    let frame = 0;

    const releaseDocument = (targetDocument: Document) => {
      const elements = [targetDocument.documentElement, targetDocument.body].filter(Boolean);
      elements.forEach((element) => {
        element.style.removeProperty('pointer-events');
        element.style.removeProperty('overflow');
        element.style.removeProperty('overscroll-behavior');
        element.style.removeProperty('touch-action');
      });
    };

    const releaseAll = () => {
      releaseDocument(document);
      try {
        if (window.parent !== window && window.parent.location.origin === window.location.origin) {
          releaseDocument(window.parent.document);
        }
      } catch {
        // Embedded auth still works when the parent cannot be inspected.
      }
    };

    const releaseForFrames = () => {
      if (frame) window.cancelAnimationFrame(frame);
      let remaining = 12;
      const tick = () => {
        releaseAll();
        remaining -= 1;
        if (remaining > 0) frame = window.requestAnimationFrame(tick);
      };
      tick();
    };

    const handleInteraction = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(INTERACTIVE_SELECTOR)) return;
      releaseForFrames();
    };

    const observer = new MutationObserver(() => releaseForFrames());
    const registerCard = root.querySelector('.source-register-card');
    if (registerCard) observer.observe(registerCard, { childList: true, subtree: true });

    releaseAll();
    root.addEventListener('pointerdown', handleInteraction, true);
    root.addEventListener('click', handleInteraction, true);
    root.addEventListener('submit', handleInteraction, true);
    window.addEventListener('pageshow', releaseAll);
    window.addEventListener('focus', releaseAll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('pointerdown', handleInteraction, true);
      root.removeEventListener('click', handleInteraction, true);
      root.removeEventListener('submit', handleInteraction, true);
      window.removeEventListener('pageshow', releaseAll);
      window.removeEventListener('focus', releaseAll);
      releaseAll();
    };
  }, []);

  return null;
}
