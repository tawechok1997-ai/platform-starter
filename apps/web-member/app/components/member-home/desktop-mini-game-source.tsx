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

      <div className="mini-game-source-actions">
        {MINI_GAME_ACTIONS.map((action) => (
          <a
            key={action.key}
            href={action.href}
            className={`mini-game-source-action mini-game-source-action--${action.key}`}
          >
            <span className="mini-game-source-border">
              <span className="mini-game-source-inner">
                <span className="mini-game-source-content">
                  <img
                    loading="lazy"
                    className={`mini-game-source-icon mini-game-source-icon--${action.key}`}
                    src={action.image}
                    alt=""
                    aria-hidden="true"
                  />
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
          gap: 10px;
          padding: 20px 14px 22px;
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
          padding: 0 6px 0 52px;
          overflow: visible;
        }

        .mini-game-source-icon {
          position: absolute;
          top: 50%;
          z-index: 1;
          display: block;
          max-width: none;
          object-fit: contain;
          object-position: center;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .mini-game-source-icon--wheel {
          left: -8px;
          width: 62px;
          height: 62px;
        }

        .mini-game-source-icon--mission {
          left: -4px;
          width: 56px;
          height: 56px;
          object-position: left center;
        }

        .mini-game-source-label {
          position: relative;
          z-index: 2;
          display: block;
          flex: 1 1 auto;
          min-width: 0;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          text-align: center;
          white-space: nowrap;
        }

        @media (max-width: 1180px) {
          .mini-game-source-actions {
            gap: 8px;
            padding-inline: 12px;
          }

          .mini-game-source-content {
            padding-left: 48px;
            padding-right: 4px;
          }

          .mini-game-source-icon--wheel {
            left: -7px;
            width: 58px;
            height: 58px;
          }

          .mini-game-source-icon--mission {
            left: -3px;
            width: 52px;
            height: 52px;
          }

          .mini-game-source-label {
            font-size: 15px;
          }
        }
      `}</style>
    </section>
  );
}
