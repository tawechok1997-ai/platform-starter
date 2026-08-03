'use client';

import { useEffect } from 'react';

const DESKTOP_QUERY = '(min-width: 901px)';
const FILTER_SELECTOR = 'main[data-source-game-category] [data-source-filter-panel]';
const STICKY_TOP_PX = 124;

export default function SourceFilterStickyBehavior() {
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    let scrollPositions = new WeakMap<EventTarget, number>();
    let frame = 0;
    let pendingDelta = 0;

    const syncFilterScroll = () => {
      frame = 0;
      const delta = pendingDelta;
      pendingDelta = 0;
      if (!media.matches || !delta) return;

      document.querySelectorAll<HTMLElement>(FILTER_SELECTOR).forEach((panel) => {
        const maximum = Math.max(0, panel.scrollHeight - panel.clientHeight);
        if (!maximum) return;

        const bounds = panel.getBoundingClientRect();
        if (bounds.top > STICKY_TOP_PX + 2) return;

        const next = Math.min(maximum, Math.max(0, panel.scrollTop + delta));
        if (Math.abs(next - panel.scrollTop) > 0.5) panel.scrollTop = next;
      });
    };

    const handleScroll = (event: Event) => {
      const target = event.target;
      if (!target) return;
      if (target instanceof HTMLElement && target.matches(FILTER_SELECTOR)) return;

      let position: number;
      if (target === document) {
        position = window.scrollY;
      } else if (target instanceof HTMLElement) {
        const containsFilter = Array.from(document.querySelectorAll<HTMLElement>(FILTER_SELECTOR))
          .some((panel) => target.contains(panel));
        if (!containsFilter) return;
        position = target.scrollTop;
      } else {
        return;
      }

      const previous = scrollPositions.get(target) ?? position;
      scrollPositions.set(target, position);
      const delta = position - previous;
      if (!delta) return;

      pendingDelta += delta;
      if (!frame) frame = window.requestAnimationFrame(syncFilterScroll);
    };

    const handleMediaChange = () => {
      scrollPositions = new WeakMap<EventTarget, number>();
      pendingDelta = 0;
      document.querySelectorAll<HTMLElement>(FILTER_SELECTOR).forEach((panel) => {
        if (!media.matches) panel.scrollTop = 0;
      });
    };

    document.addEventListener('scroll', handleScroll, true);
    media.addEventListener('change', handleMediaChange);

    return () => {
      document.removeEventListener('scroll', handleScroll, true);
      media.removeEventListener('change', handleMediaChange);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <style>{`
      @media (min-width: 901px) {
        main[data-source-game-category] {
          overflow-x: clip !important;
          overflow-y: visible !important;
        }

        main[data-source-game-category] > section {
          box-sizing: border-box !important;
          width: 1440px !important;
          max-width: 1440px !important;
          margin-inline: auto !important;
        }

        main[data-source-game-category] > section > header {
          height: 170px !important;
        }

        main[data-source-game-category] > section > header > img:not([alt='']) {
          width: 396px !important;
          height: 128px !important;
          max-width: 396px !important;
        }

        main[data-source-game-category] > section > header > img[alt=''] {
          width: 383px !important;
          height: 385px !important;
          max-width: 383px !important;
        }

        main[data-source-game-category] [data-source-game-layout] {
          grid-template-columns: 345px minmax(0, 1fr) !important;
          gap: 20px !important;
          align-items: start !important;
          overflow: visible !important;
        }

        main[data-source-game-category] [data-source-filter-panel],
        main[data-source-game-category] [data-source-filter-title],
        main[data-source-game-category] [data-source-provider-grid] {
          box-sizing: border-box !important;
          width: 345px !important;
          min-width: 345px !important;
          max-width: 345px !important;
        }

        main[data-source-game-category] [data-source-filter-panel] {
          position: sticky !important;
          top: ${STICKY_TOP_PX}px !important;
          z-index: 20 !important;
          align-self: start !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: calc(100dvh - 144px) !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
          scrollbar-color: rgba(187, 91, 234, 0.72) rgba(24, 21, 35, 0.38) !important;
          scrollbar-gutter: stable !important;
          scrollbar-width: thin !important;
          transform: none !important;
        }

        main[data-source-game-category] [data-source-filter-panel]::-webkit-scrollbar {
          display: block !important;
          width: 6px !important;
        }

        main[data-source-game-category] [data-source-filter-panel]::-webkit-scrollbar-track {
          background: rgba(24, 21, 35, 0.38) !important;
        }

        main[data-source-game-category] [data-source-filter-panel]::-webkit-scrollbar-thumb {
          border-radius: 999px !important;
          background: rgba(187, 91, 234, 0.72) !important;
        }

        main[data-source-game-category] [data-source-filter-title] {
          position: sticky !important;
          top: 0 !important;
          z-index: 5 !important;
          background: radial-gradient(35% 90% at 50% 10%, #bb5bea 0%, #181523 90%) !important;
        }

        main[data-source-game-category] [data-source-filter-panel] > div:last-child {
          position: sticky !important;
          bottom: 0 !important;
          z-index: 5 !important;
          background: linear-gradient(180deg, rgba(24, 21, 35, 0.92), #181523 18%) !important;
          box-shadow: 0 -12px 24px rgba(17, 14, 22, 0.38) !important;
        }

        main[data-source-game-category] [data-source-provider-grid] {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 8px !important;
          padding: 20px 16px !important;
        }

        main[data-source-game-category] [data-source-provider-button] {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
        }

        main[data-source-game-category] [data-source-game-layout] > section {
          min-width: 0 !important;
          overflow: visible !important;
        }

        main[data-source-game-category] [data-source-game-layout] > section > div:has(> article) {
          display: grid !important;
          grid-template-columns: repeat(6, minmax(0, 182px)) !important;
          column-gap: 0 !important;
          row-gap: 0 !important;
          align-items: start !important;
          justify-content: start !important;
        }

        main[data-source-game-category] [data-source-game-layout] article {
          box-sizing: border-box !important;
          width: 182px !important;
          max-width: 182px !important;
          height: 250px !important;
          justify-self: start !important;
          padding: 5px 25px 5px 5px !important;
        }
      }

      @media (max-width: 900px) {
        main[data-source-game-category] [data-source-filter-panel] {
          position: relative !important;
          top: auto !important;
          z-index: 0 !important;
          max-height: none !important;
          overflow: visible !important;
          scrollbar-gutter: auto !important;
        }

        main[data-source-game-category] [data-source-filter-title],
        main[data-source-game-category] [data-source-filter-panel] > div:last-child {
          position: relative !important;
          top: auto !important;
          bottom: auto !important;
        }
      }
    `}</style>
  );
}
