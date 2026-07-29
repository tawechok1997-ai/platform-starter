export default function SourceFilterStickyBehavior() {
  return (
    <style>{`
      @media (min-width: 901px) {
        main[data-source-game-category] {
          --source-page-gutter: clamp(12px, 2vw, 32px);
          --source-layout-gap: clamp(12px, 1.4vw, 20px);
          --source-filter-width: clamp(280px, 22vw, 345px);
          --source-card-min: clamp(124px, 10.5vw, 150px);
          overflow-x: clip !important;
          overflow-y: visible !important;
        }

        main[data-source-game-category] > section {
          box-sizing: border-box !important;
          width: min(1440px, calc(100vw - (var(--source-page-gutter) * 2))) !important;
          max-width: 1440px !important;
          margin-inline: auto !important;
        }

        main[data-source-game-category] > section > header {
          height: clamp(132px, 11vw, 170px) !important;
        }

        main[data-source-game-category] > section > header > img:not([alt='']) {
          width: clamp(300px, 28vw, 396px) !important;
          height: clamp(100px, 9vw, 128px) !important;
          max-width: 44vw !important;
        }

        main[data-source-game-category] > section > header > img[alt=''] {
          width: clamp(260px, 25vw, 383px) !important;
          height: clamp(260px, 25vw, 385px) !important;
          max-width: 34vw !important;
        }

        main[data-source-game-category] [data-source-game-layout] {
          grid-template-columns: var(--source-filter-width) minmax(0, 1fr) !important;
          gap: var(--source-layout-gap) !important;
          align-items: start !important;
          overflow: visible !important;
        }

        main[data-source-game-category] [data-source-filter-panel],
        main[data-source-game-category] [data-source-filter-title],
        main[data-source-game-category] [data-source-provider-grid] {
          box-sizing: border-box !important;
          width: var(--source-filter-width) !important;
          min-width: var(--source-filter-width) !important;
          max-width: var(--source-filter-width) !important;
        }

        main[data-source-game-category] [data-source-filter-panel] {
          position: sticky !important;
          top: 124px !important;
          z-index: 20 !important;
          align-self: start !important;
          max-height: calc(100vh - 140px) !important;
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
          grid-template-columns: repeat(auto-fill, minmax(var(--source-card-min), 1fr)) !important;
          column-gap: clamp(8px, 1vw, 16px) !important;
          row-gap: 0 !important;
          align-items: start !important;
          justify-content: stretch !important;
        }

        main[data-source-game-category] [data-source-game-layout] article {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 182px !important;
          height: auto !important;
          justify-self: center !important;
          padding: 5px clamp(6px, 0.8vw, 14px) 14px 5px !important;
        }
      }

      @media (min-width: 901px) and (max-width: 1099px) {
        main[data-source-game-category] {
          --source-page-gutter: 12px;
          --source-layout-gap: 12px;
          --source-filter-width: 280px;
          --source-card-min: 124px;
        }

        main[data-source-game-category] [data-source-filter-panel] label {
          gap: 5px !important;
          padding-inline: 8px !important;
        }

        main[data-source-game-category] [data-source-game-layout] > section > h1 {
          font-size: 27px !important;
          line-height: 36px !important;
        }
      }

      @media (min-width: 1100px) and (max-width: 1279px) {
        main[data-source-game-category] {
          --source-filter-width: 300px;
          --source-card-min: 134px;
        }
      }

      @media (min-width: 1280px) and (max-width: 1599px) {
        main[data-source-game-category] {
          --source-filter-width: clamp(320px, 22vw, 345px);
          --source-card-min: 144px;
        }
      }

      @media (min-width: 1600px) {
        main[data-source-game-category] {
          --source-filter-width: 345px;
          --source-card-min: 150px;
        }
      }

      @media (max-width: 900px) {
        main[data-source-game-category] [data-source-filter-panel] {
          position: relative !important;
          top: auto !important;
          z-index: 0 !important;
        }
      }
    `}</style>
  );
}
