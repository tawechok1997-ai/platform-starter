const IMAGE_ROOT = '/assets/asset-pc/images';

const MINI_GAME_ACTIONS = [
  {
    label: 'วงล้อ',
    image: `${IMAGE_ROOT}/mini_game/icon-luckywheel-dt.webp`,
    href: '/?auth=login',
  },
  {
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
          <a key={action.label} href={action.href} className="mini-exact-action">
            <span className="mini-exact-border">
              <span className="mini-exact-inner">
                <span className="mini-exact-content">
                  <img loading="lazy" className="mini-exact-icon" src={action.image} alt="" aria-hidden="true" />
                  <span className="mini-exact-label">{action.label}</span>
                </span>
              </span>
            </span>
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
          padding: 20px 12px;
          overflow: visible;
        }

        .source-mini-game .mini-exact-action {
          display: block !important;
          flex: 1 1 0 !important;
          box-sizing: border-box !important;
          min-width: 0 !important;
          height: 46px !important;
          margin: 0 0 0 16px !important;
          padding: 0 !important;
          overflow: visible !important;
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
          display: block;
          box-sizing: border-box;
          width: 100%;
          height: 46px;
          padding: 2px;
          overflow: visible;
          border-radius: 999px;
          background: linear-gradient(180deg, rgb(255 232 79) 0%, rgb(246 173 0) 100%);
        }

        .mini-exact-inner {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          height: 42px;
          overflow: visible;
          border-radius: 999px;
          background: linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%);
        }

        .mini-exact-content {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          height: 42px;
          margin-left: -20px;
          overflow: visible;
        }

        .mini-exact-icon {
          position: static !important;
          display: block !important;
          flex: 0 0 auto !important;
          width: auto !important;
          min-width: 0 !important;
          max-width: none !important;
          height: 90px !important;
          min-height: 90px !important;
          max-height: 90px !important;
          margin: 0 -15px !important;
          padding: 0 !important;
          object-fit: contain !important;
          transform: none !important;
          pointer-events: none;
        }

        .mini-exact-label {
          position: relative;
          z-index: 2;
          display: block;
          flex: 1 1 auto;
          min-width: 0;
          padding-right: 8px;
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
            margin-left: 12px !important;
          }

          .mini-exact-content {
            margin-left: -18px;
          }

          .mini-exact-icon {
            height: 82px !important;
            min-height: 82px !important;
            max-height: 82px !important;
            margin-inline: -14px !important;
          }

          .mini-exact-label {
            font-size: 18px;
          }
        }
      `}</style>
    </section>
  );
}
