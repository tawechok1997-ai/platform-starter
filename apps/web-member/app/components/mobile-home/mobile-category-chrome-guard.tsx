'use client';

import { useEffect } from 'react';

const CATEGORY_IDS = new Set(['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery']);
const TOP_CHROME_SELECTOR = [
  '[data-mobile-section-owner="header"]',
  '[data-mobile-section-owner="hero"]',
  '[data-mobile-section-owner="auth-actions"]',
  '[data-mobile-section-owner="announcement"]',
  '[data-mobile-section-owner="highlight-tabs"]',
].join(', ');

export default function MobileCategoryChromeGuard() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) return;

    let frame = 0;
    let restoring = false;

    const normalizedLocationCategory = () => {
      const raw = new URLSearchParams(window.location.search).get('category')?.toLowerCase() ?? 'home';
      if (raw === 'lotto') return 'lottery';
      return CATEGORY_IDS.has(raw) ? raw : 'home';
    };

    const restoreTopChrome = () => {
      if (restoring) return;
      restoring = true;

      root.querySelectorAll<HTMLElement>(TOP_CHROME_SELECTOR).forEach((section) => {
        if (section.hidden) section.hidden = false;
        if (section.getAttribute('aria-hidden') === 'true') section.removeAttribute('aria-hidden');
        if (section.style.display === 'none') section.style.removeProperty('display');
        if (section.style.visibility === 'hidden') section.style.removeProperty('visibility');
        if (section.style.opacity === '0') section.style.removeProperty('opacity');
      });

      restoring = false;
    };

    const scheduleRestore = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        restoreTopChrome();
      });
    };

    const syncCategory = (category: string) => {
      const normalized = category === 'lotto' ? 'lottery' : category;
      if (!CATEGORY_IDS.has(normalized)) return;
      root.dataset.mobileActiveCategory = normalized;
      scheduleRestore();
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>('[data-mobile-category-id]');
      const category = button?.dataset.mobileCategoryId;
      if (category) syncCategory(category);
    };

    const handleCategoryEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ category?: string }>).detail;
      syncCategory(detail?.category ?? normalizedLocationCategory());
    };

    const handleLocation = () => syncCategory(normalizedLocationCategory());

    const observer = new MutationObserver((mutations) => {
      const touchedChrome = mutations.some((mutation) => {
        const target = mutation.target;
        return target instanceof Element && Boolean(target.closest(TOP_CHROME_SELECTOR));
      });
      if (touchedChrome) scheduleRestore();
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['hidden', 'aria-hidden', 'style', 'class'],
      subtree: true,
    });

    restoreTopChrome();
    handleLocation();
    root.addEventListener('click', handleClick);
    window.addEventListener('member:mobile-category-select', handleCategoryEvent);
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', scheduleRestore);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('click', handleClick);
      window.removeEventListener('member:mobile-category-select', handleCategoryEvent);
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', scheduleRestore);
    };
  }, []);

  return (
    <style jsx global>{`
      @media (max-width: 900px) {
        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] {
          width: 100% !important;
          max-width: 428px !important;
          margin-inline: auto !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='header'] {
          display: block !important;
          width: 100% !important;
          height: 60px !important;
          min-height: 60px !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='header'] > div {
          width: min(100%, 428px) !important;
          max-width: 428px !important;
          height: 60px !important;
          grid-template-columns: 40px minmax(0, 1fr) 20px !important;
          padding-inline: 12px !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='header'] > div > button:last-child {
          box-sizing: border-box !important;
          width: 20px !important;
          min-width: 20px !important;
          max-width: 20px !important;
          height: 20px !important;
          min-height: 20px !important;
          max-height: 20px !important;
          padding: 0 !important;
          border-radius: 999px !important;
          transform: none !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='header'] > div > button:last-child > img {
          width: 20px !important;
          min-width: 20px !important;
          max-width: 20px !important;
          height: 20px !important;
          min-height: 20px !important;
          max-height: 20px !important;
          object-fit: cover !important;
          transform: none !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='hero'] {
          display: grid !important;
          width: 100% !important;
          min-width: 0 !important;
          gap: 0 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='hero'] > div:first-child {
          width: 100% !important;
          min-width: 0 !important;
          overflow: hidden !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='hero'] > div:first-child > div {
          display: flex !important;
          width: 100% !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='hero'] a {
          box-sizing: border-box !important;
          flex: 0 0 100% !important;
          width: 100% !important;
          padding: 0 12px !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='hero'] a > span {
          position: relative !important;
          display: block !important;
          width: 100% !important;
          padding-bottom: 41.6% !important;
          overflow: hidden !important;
          border-radius: 10px !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='hero'] a > span > img {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 10px !important;
          object-fit: cover !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='auth-actions'] {
          display: block !important;
          width: 100% !important;
          padding: 8px 16px 0 !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-auth-layout='page'] {
          gap: 12px !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-auth-layout='page'] > a {
          height: 38px !important;
          min-height: 38px !important;
          border-radius: 10px !important;
          font-size: 12px !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='announcement'] {
          display: grid !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] [data-mobile-section-owner='highlight-tabs'] {
          display: grid !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] #mobile-home-drawer[data-mobile-drawer-owner='p6'] {
          width: min(340px, 100vw) !important;
          min-width: 0 !important;
          max-width: 340px !important;
          height: 100dvh !important;
          min-height: 100dvh !important;
          max-height: 100dvh !important;
          padding: 20px 23px !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] #mobile-home-drawer[data-mobile-drawer-owner='p6'] nav a,
        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] #mobile-home-drawer[data-mobile-drawer-owner='p6'] nav button {
          min-height: 0 !important;
        }

        html[data-member-viewport-mode='mobile'] [data-mobile-home-root='true'] #mobile-home-drawer[data-mobile-drawer-owner='p6'] > div:last-child > a {
          min-height: 38px !important;
        }
      }
    `}</style>
  );
}
