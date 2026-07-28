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

      <div className="mini-game-source-actions">
        {MINI_GAME_ACTIONS.map((action) => (
          <a key={action.label} href={action.href} className="mini-game-source-action">
            <span className="mini-game-source-border">
              <span className="mini-game-source-inner">
                <span className="mini-game-source-content">
                  <img loading="lazy" className="mini-game-source-icon" src={action.image} alt="" aria-hidden="true" />
                  <span className="mini-game-source-label">{action.label}</span>
                </span>
              </span>
            </span>
          </a>
        ))}
      </div>

      <style jsx>{`
        .source-mini-game {
          overflow: visible;
        }

        .mini-game-source-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          gap: 12px;
          padding: 20px 14px 22px 26px;
          overflow: visible;
        }

        .mini-game-source-action {
          position: relative;
          display: block;
          min-width: 0;
          height: 46px;
          margin: 0;
          padding: 0;
          overflow: visible;
          border: 0;
          border-radius: 999px;
          color: #fff;
          background: transparent;
          text-decoration: none;
        }

        .mini-game-source-border {
          display: block;
          box-sizing: border-box;
          width: 100%;
          height: 46px;
          padding: 2px;
          overflow: visible;
          border-radius: 999px;
          background: linear-gradient(180deg, rgb(255 232 79) 0%, rgb(246 173 0) 100%);
        }

        .mini-game-source-inner {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          height: 42px;
          overflow: visible;
          border-radius: 999px;
          background: linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%);
        }

        .mini-game-source-content {
          position: relative;
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          height: 42px;
          padding: 0 8px 0 52px;
          overflow: visible;
        }

        .mini-game-source-icon {
          position: absolute;
          top: 50%;
          left: -18px;
          display: block;
          width: 76px;
          height: 76px;
          max-width: none;
          object-fit: contain;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .mini-game-source-label {
          display: block;
          flex: 1 1 auto;
          min-width: 0;
          color: #fff;
          font-size: 18px;
          font-weight: 600;
          line-height: 24px;
          text-align: center;
          white-space: nowrap;
        }

        @media (max-width: 1180px) {
          .mini-game-source-actions {
            gap: 10px;
            padding-left: 23px;
          }

          .mini-game-source-content {
            padding-left: 47px;
            padding-right: 6px;
          }

          .mini-game-source-icon {
            left: -16px;
            width: 70px;
            height: 70px;
          }

          .mini-game-source-label {
            font-size: 16px;
          }
        }
      `}</style>
    </section>
  );
}
