const IMAGE_ROOT = '/assets/asset-pc/images';

const MINI_GAME_ACTIONS = [
  {
    key: 'wheel',
    label: 'วงล้อ',
    image: `${IMAGE_ROOT}/mini_game/icon-luckywheel-dt.webp`,
    href: '/mini-game/spinner',
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

      <div className="source-mini-game__actions">
        {MINI_GAME_ACTIONS.map((action) => (
          <a
            key={action.key}
            href={action.href}
            className={`mini-game-final-action mini-game-final-action--${action.key}`}
          >
            <img
              loading="lazy"
              className="mini-game-final-icon"
              src={action.image}
              alt=""
              aria-hidden="true"
            />
            <span className="mini-game-final-label">{action.label}</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        #desktop-mini-game-source .mini-game-final-action {
          position: relative !important;
          display: block !important;
          box-sizing: border-box !important;
          width: 100% !important;
          min-width: 0 !important;
          height: 44px !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          border: 2px solid rgb(255 227 111) !important;
          border-radius: 999px !important;
          outline: 0 !important;
          background: linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%) !important;
          box-shadow: none !important;
          color: #fff !important;
          text-decoration: none !important;
          transform: none !important;
        }

        #desktop-mini-game-source .mini-game-final-action::before,
        #desktop-mini-game-source .mini-game-final-action::after {
          content: none !important;
          display: none !important;
        }

        #desktop-mini-game-source .mini-game-final-icon {
          position: absolute !important;
          top: 50% !important;
          left: -15px !important;
          z-index: 2 !important;
          display: block !important;
          width: 90px !important;
          min-width: 90px !important;
          max-width: 90px !important;
          height: 90px !important;
          min-height: 90px !important;
          max-height: 90px !important;
          margin: 0 !important;
          padding: 0 !important;
          object-fit: contain !important;
          transform: translateY(-50%) !important;
          pointer-events: none !important;
        }

        #desktop-mini-game-source .mini-game-final-label {
          position: absolute !important;
          inset: 0 4px 0 52px !important;
          z-index: 3 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          color: #fff !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          line-height: 24px !important;
          text-align: center !important;
          white-space: nowrap !important;
          pointer-events: none !important;
        }
      `}</style>
    </section>
  );
}
