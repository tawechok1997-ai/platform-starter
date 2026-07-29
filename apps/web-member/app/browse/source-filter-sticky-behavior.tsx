export default function SourceFilterStickyBehavior() {
  return (
    <style>{`
      @media (min-width: 901px) {
        main[data-source-game-category] {
          overflow-x: clip !important;
          overflow-y: visible !important;
        }

        main[data-source-game-category] [data-source-game-layout] {
          align-items: start !important;
          overflow: visible !important;
        }

        main[data-source-game-category] [data-source-filter-panel] {
          position: sticky !important;
          top: 124px !important;
          z-index: 20 !important;
          align-self: start !important;
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
