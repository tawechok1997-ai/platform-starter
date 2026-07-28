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
        .mini-exact-actions {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          gap: 8px;
          padding: 20px 12px 20px;
          overflow: visible;
        }

        .mini-exact-action {
          position: relative;
          display: flex !important;
          flex: 1 1 0;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          min-width: 0;
          height: 46px !important;
          margin: 0 0 0 16px !important;
          padding: 0 8px 0 44px !important;
          overflow: visible !important;
          border: 2px solid transparent !important;
          border-radius: 999px !important;
          outline: 0 !important;
          color: #fff !important;
          background:
            linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%) padding-box,
            linear-gradient(180deg, rgb(255 242 145) 0%, rgb(246 173 0) 100%) border-box !important;
          box-shadow: none !important;
          text-decoration: none !important;
          transform: none !important;
        }

        .mini-exact-action::before,
        .mini-exact-action::after {
          content: none !important;
          display: none !important;
        }

        .mini-exact-icon {
          position: absolute !important;
          top: 50%;
          left: -24px;
          z-index: 1;
          display: block !important;
          width: 104px !important;
          min-width: 104px !important;
          max-width: 104px !important;
          height: 104px !important;
          min-height: 104px !important;
          max-height: 104px !important;
          margin: 0 !important;
          padding: 0 !important;
          object-fit: contain !important;
          transform: translateY(-50%) !important;
          pointer-events: none;
        }

        .mini-exact-icon--mission {
          left: -27px;
          width: 112px !important;
          min-width: 112px !important;
          max-width: 112px !important;
          height: 112px !important;
          min-height: 112px !important;
          max-height: 112px !important;
        }

        .mini-exact-label {
          position: relative;
          z-index: 2;
          display: block;
          width: 100%;
          min-width: 0;
          margin: 0;
          color: #fff;
          font-size: 18px;
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

          .mini-exact-action {
            margin-left: 14px !important;
            padding-left: 41px !important;
          }

          .mini-exact-icon {
            left: -22px;
            width: 98px !important;
            min-width: 98px !important;
            max-width: 98px !important;
            height: 98px !important;
            min-height: 98px !important;
            max-height: 98px !important;
          }

          .mini-exact-icon--mission {
            left: -25px;
            width: 106px !important;
            min-width: 106px !important;
            max-width: 106px !important;
            height: 106px !important;
            min-height: 106px !important;
            max-height: 106px !important;
          }

          .mini-exact-label {
            font-size: 17px;
          }
        }
      `}</style>
    </section>
  );
}
