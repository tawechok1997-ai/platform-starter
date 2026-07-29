export default function SourceFilterStickyBehavior() {
  return (
    <style>{`
      @media (hover: hover) and (pointer: fine) {
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

      @media (hover: none) and (pointer: coarse) and (max-width: 900px) {
        main[data-source-game-category] [data-source-filter-panel] {
          position: relative !important;
          top: auto !important;
          z-index: 0 !important;
        }
      }
    `}</style>
  );
}
