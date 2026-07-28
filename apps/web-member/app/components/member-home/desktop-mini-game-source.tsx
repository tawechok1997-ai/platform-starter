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
    <section className="reference-side-card reference-mini-games source-mini-game" aria-label="Mini Game">
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
        .source-mini-game,
        .mini-exact-actions,
        .mini-exact-action,
        .mini-exact-border,
        .mini-exact-inner {
          overflow: visible !important;
          contain: none !important;
          clip-path: none !important;
          mask: none !important;
        }

        .mini-exact-actions {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          gap: 8px;
          padding: 20px 12px;
        }

        .source-mini-game .mini-exact-action {
          position: relative !important;
          display: flex !important;
          flex: 1 1 0 !important;
          align-items: center !important;
          justify-content: center !important;
          box-sizing: border-box !important;
          min-width: 0 !important;
          height: 46px !important;
          margin: 0 0 0 16px !important;
          padding: 0 8px 0 52px !important;
          border: 0 !important;
          border-radius: 999px !important;
          outline: 0 !important;
          color: #fff !important;
          background: transparent !important;
          box-shadow: none !important;
          text-decoration: none !important;
          transform: none !important;
        }

        .source-mini-game .mini-exact-action::before,
        .source-mini-game .mini-exact-action::after {
          content: none !important;
          display: none !important;
        }

        .mini-exact-border {
          position: absolute;
          inset: 0;
          z-index: 0;
          display: block;
          box-sizing: border-box;
          width: 100%;
          height: 46px;
          padding: 2px;
          border-radius: 999px;
          background: linear-gradient(180deg, rgb(255 232 79) 0%, rgb(246 173 0) 100%);
          pointer-events: none;
        }

        .mini-exact-inner {
          display: block;
          box-sizing: border-box;
          width: 100%;
          height: 42px;
          border-radius: 999px;
          background: linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%);
        }

        .mini-exact-icon {
          position: absolute !important;
          top: 50% !important;
          left: -22px !important;
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
          pointer-events: none;
        }

        .mini-exact-icon--mission {
          left: -24px !important;
        }

        .mini-exact-label {
          position: relative;
          z-index: 3;
          display: block;
          width: 100%;
          min-width: 0;
          color: #fff;
          font-size: 20px;
          font-weight: 600;
          line-height: 24px;
          text-align: center;
          white-space: nowrap;
        }

        @media (max-width: 1180px) {
          .mini-exact-actions {
            gap: 7px;
            padding-inline: 10px;
          }

          .source-mini-game .mini-exact-action {
            margin-left: 14px !important;
            padding-right: 5px !important;
            padding-left: 48px !important;
          }

          .mini-exact-icon {
            left: -20px !important;
            width: 84px !important;
            min-width: 84px !important;
            max-width: 84px !important;
            height: 84px !important;
            min-height: 84px !important;
            max-height: 84px !important;
          }

          .mini-exact-icon--mission {
            left: -22px !important;
          }

          .mini-exact-label {
            font-size: 18px;
          }
        }
      `}</style>
    </section>
  );
}
