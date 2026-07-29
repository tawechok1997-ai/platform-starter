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

      <div className="source-mini-game__actions">
        {MINI_GAME_ACTIONS.map((action) => (
          <a key={action.key} href={action.href} className="source-mini-game__action">
            <span
              className="mini-game-clean-surface"
              style={{
                position: 'relative',
                display: 'block',
                boxSizing: 'border-box',
                width: '100%',
                height: 44,
                overflow: 'visible',
                border: '2px solid rgb(255 227 111)',
                borderRadius: 999,
                background: 'linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%)',
              }}
            >
              <img
                loading="lazy"
                className="mini-game-clean-icon"
                src={action.image}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: action.key === 'wheel' ? -22 : -21,
                  zIndex: 2,
                  display: 'block',
                  width: 90,
                  minWidth: 90,
                  maxWidth: 90,
                  height: 90,
                  minHeight: 90,
                  maxHeight: 90,
                  margin: 0,
                  padding: 0,
                  objectFit: 'contain',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <span
                className="mini-game-clean-label"
                style={{
                  position: 'absolute',
                  inset: '0 4px 0 56px',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 0,
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: '24px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {action.label}
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
