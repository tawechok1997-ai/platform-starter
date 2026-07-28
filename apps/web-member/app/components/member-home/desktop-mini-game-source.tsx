const IMAGE_ROOT = '/assets/asset-pc/images';

const MINI_GAME_ACTIONS = [
  {
    key: 'wheel',
    label: 'วงล้อ',
    image: `${IMAGE_ROOT}/mini_game/icon-luckywheel-dt.webp`,
    href: '/?auth=login',
  },
  {
    key: 'mission',
    label: 'ทำภารกิจ',
    image: `${IMAGE_ROOT}/mini_game/icon-dailymission-dt.webp`,
    href: '/?auth=login',
  },
] as const;

export default function DesktopMiniGameSource() {
  return (
    <section
      id="desktop-mini-game-source"
      className="reference-side-card reference-mini-games source-mini-game"
      aria-label="Mini Game"
    >
      <div className="source-mini-game__header">
        <div className="source-mini-game__header-gradient" aria-hidden="true" />
        <div className="source-mini-game__header-line" aria-hidden="true" />
        <div className="source-mini-game__header-content">
          <div className="source-mini-game__title">
            <img
              loading="lazy"
              className="source-mini-game__title-icon"
              src={`${IMAGE_ROOT}/home/mini-game.webp`}
              alt=""
              aria-hidden="true"
            />
            <div className="source-mini-game__title-text">Mini Game</div>
          </div>
          <div className="source-mini-game__header-action" aria-hidden="true" />
        </div>
      </div>

      <div className="mini-exact-actions">
        {MINI_GAME_ACTIONS.map((action) => (
          <a
            key={action.key}
            href={action.href}
            className={`mini-exact-action mini-exact-action--${action.key}`}
          >
            <span className="mini-exact-border" aria-hidden="true">
              <span className="mini-exact-inner" />
            </span>
            <img
              loading="lazy"
              className={`mini-exact-icon mini-exact-icon--${action.key}`}
              src={action.image}
              alt=""
              aria-hidden="true"
            />
            <span className="mini-exact-label">{action.label}</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        #desktop-mini-game-source {
          margin-top: -8px !important;
          margin-bottom: -12px !important;
          overflow: visible !important;
          contain: none !important;
          clip-path: none !important;
          mask: none !important;
        }

        #desktop-mini-game-source > .source-mini-game__header {
          width: calc(100% - 20px) !important;
          margin-left: 12px !important;
        }

        #desktop-mini-game-source > .mini-exact-actions {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          align-items: center !important;
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          gap: 10px !important;
          padding: 20px 20px 20px 24px !important;
          overflow: visible !important;
          contain: none !important;
          clip-path: none !important;
          mask: none !important;
        }

        #desktop-mini-game-source .mini-exact-action {
          position: relative !important;
          display: block !important;
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          height: 46px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          contain: none !important;
          clip-path: none !important;
          mask: none !important;
          border: 0 !important;
          border-radius: 999px !important;
          outline: 0 !important;
          color: #fff !important;
          background: transparent !important;
          box-shadow: none !important;
          text-decoration: none !important;
          transform: none !important;
        }

        #desktop-mini-game-source .mini-exact-action::before,
        #desktop-mini-game-source .mini-exact-action::after {
          content: none !important;
          display: none !important;
        }

        #desktop-mini-game-source .mini-exact-border {
          position: absolute !important;
          inset: 0 !important;
          z-index: 0 !important;
          display: block !important;
          box-sizing: border-box !important;
          width: 100% !important;
          height: 46px !important;
          padding: 2px !important;
          overflow: visible !important;
          border-radius: 999px !important;
          background: linear-gradient(180deg, rgb(255 232 79) 0%, rgb(246 173 0) 100%) !important;
          pointer-events: none !important;
        }

        #desktop-mini-game-source .mini-exact-inner {
          display: block !important;
          box-sizing: border-box !important;
          width: 100% !important;
          height: 42px !important;
          overflow: visible !important;
          border-radius: 999px !important;
          background: linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%) !important;
        }

        #desktop-mini-game-source .mini-exact-icon {
          position: absolute !important;
          top: 50% !important;
          z-index: 2 !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          object-fit: contain !important;
          object-position: center !important;
          transform: translateY(-50%) !important;
          pointer-events: none !important;
        }

        #desktop-mini-game-source .mini-exact-icon--wheel {
          left: -28px !important;
          width: 96px !important;
          min-width: 96px !important;
          max-width: 96px !important;
          height: 96px !important;
          min-height: 96px !important;
          max-height: 96px !important;
        }

        #desktop-mini-game-source .mini-exact-icon--mission {
          left: -27px !important;
          width: 90px !important;
          min-width: 90px !important;
          max-width: 90px !important;
          height: 90px !important;
          min-height: 90px !important;
          max-height: 90px !important;
        }

        #desktop-mini-game-source .mini-exact-label {
          position: absolute !important;
          top: 0 !important;
          right: 4px !important;
          bottom: 0 !important;
          left: 54px !important;
          z-index: 3 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: auto !important;
          min-width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          color: #fff !important;
          font-family: inherit !important;
          font-size: 20px !important;
          font-weight: 600 !important;
          line-height: 24px !important;
          letter-spacing: normal !important;
          text-align: center !important;
          text-overflow: clip !important;
          white-space: nowrap !important;
          transform: none !important;
          pointer-events: none !important;
        }
      `}</style>
    </section>
  );
}
