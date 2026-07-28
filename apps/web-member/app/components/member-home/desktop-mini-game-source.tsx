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

      <div className="source-mini-game__actions">
        {MINI_GAME_ACTIONS.map((action) => (
          <a key={action.label} href={action.href} className="source-mini-game__action">
            <span className="source-mini-game__border-gradient">
              <span className="source-mini-game__action-inner">
                <span className="source-mini-game__action-content">
                  <img loading="lazy" className="source-mini-game__action-icon" src={action.image} alt="" aria-hidden="true" />
                  <span className="source-mini-game__action-label">{action.label}</span>
                </span>
              </span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
