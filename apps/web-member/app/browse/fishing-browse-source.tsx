'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { useMemberSession } from '../member-session-provider';
import styles from './source-game-category-page.module.css';

type FishingFilterKey = 'hot' | 'new' | 'slot';

type FishingProvider = {
  code: string;
  name: string;
  badge: string;
};

type FishingGame = {
  id: string;
  name: string;
  image: string;
  provider: string;
  tags: FishingFilterKey[];
  isHot: boolean;
  isNew: boolean;
};

const PROVIDER_ROWS = [
  ['ygrfish', 'YGR'],
  ['misoltfish', 'Miso'],
  ['cqfish', 'CQ9'],
  ['fachaifish', 'Fa Chai'],
  ['jlfish', 'JILI'],
  ['jkgx2fish', 'Joker'],
  ['rsgfish', 'RSG'],
  ['sppfish', 'SimplePlay'],
  ['spgfish', 'Spadegaming'],
  ['wmfish', 'WM'],
  ['kagafish', 'KA Gaming'],
  ['r88fish', 'Rich88'],
  ['fsfish', 'FastSpin'],
  ['askfish', 'AskMeSlot'],
  ['acewinfish', 'AceWin'],
] as const;

const PROVIDERS: FishingProvider[] = PROVIDER_ROWS.map(([code, name]) => ({
  code,
  name,
  badge: `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,
}));

const GAME_ROWS = [
  ['devil-buster', 'Devil Buster', 'https://cdn.zabbet.com/games/1687329677649-ad488dc9-496a-4f75-894e-13e8eb7c9ffa.jpg', 'kagafish'],
  ['undersea-battle', 'Undersea Battle', 'https://cdn.zabbet.com/games/1687328908715-7d505e55-0f6e-4626-8b6c-e3219f15fca3.jpg', 'kagafish'],
  ['poseidons-secret', "Poseidon's Secret", 'https://cdn.zabbet.com/games/1687331270474-65379122-f1a8-4b31-8b24-547f9fa8b74e.jpg', 'kagafish'],
  ['food-coma', 'Food Coma', 'https://cdn.zabbet.com/games/1687329726434-b9262626-ee1e-485f-ae44-95e5dff21017.jpg', 'kagafish'],
  ['hungry-shark', 'Hungry Shark', 'https://cdn.zabbet.com/games/1687330479414-4f256c6e-9d59-4c8a-b99c-09fa92371c85.jpg', 'kagafish'],
  ['magic-witches', 'Magic Witches', 'https://cdn.zabbet.com/games/1687330664337-38bb50fa-b93f-4f01-899d-9f8ad04af502.jpg', 'kagafish'],
  ['happy-food-hunter', 'Happy Food Hunter', 'https://cdn.zabbet.com/games/1687330357573-33975430-fc17-4dda-800b-bdcf3d7733cf.jpg', 'kagafish'],
  ['monster-island', 'Monster Island', 'https://cdn.zabbet.com/games/1687330961673-ffb05b9c-b50c-4303-97a9-4469edb3031d.jpg', 'kagafish'],
  ['world-of-lord-elf-king', 'World of Lord Elf King', 'https://cdn.zabbet.com/games/1687328682582-f5a6c9a1-68d8-4d8f-bb38-177a34f75e21.jpg', 'kagafish'],
  ['fishing-thai', 'Fishing Thai', 'https://cdn.zabbet.com/games/1764653943565-441ce693-e2f4-43e5-b462-aa7d03229a6c.jpeg', 'misoltfish'],
  ['black-tornado', 'Black Tornado', 'https://cdn.zabbet.com/games/1764653967188-1dc18103-3d43-4b8f-8b51-025679c59181.jpeg', 'misoltfish'],
  ['hoan-kiem-lake', 'Hoàn Kiếm Lake', 'https://cdn.zabbet.com/games/1764653990771-e7375829-fa31-4b4c-b628-755c3aeb4b15.jpeg', 'misoltfish'],
  ['duo-fu-fu-wa', 'Duo Fu Fu Wa', 'https://cdn.zabbet.com/games/1764654012713-3dae24ea-5f5e-4a0e-aef6-2e879aa58795.jpeg', 'misoltfish'],
  ['world-cup-mania', 'World Cup Mania', 'https://cdn.zabbet.com/games/1764654037814-9fcb411e-7ed1-4782-885a-cde6cc4cf15c.jpeg', 'misoltfish'],
  ['captain-fishing', 'Captain Fishing', 'https://cdn.zabbet.com/games/1697456164426-bdf17104-ee74-44b5-aff0-fb6233bc0424.jpg', 'ygrfish'],
  ['longya-fishing', 'LongYa Fishing', 'https://cdn.zabbet.com/games/1697460569497-044aaa89-46ae-4078-a45b-95e08dea832f.jpg', 'ygrfish'],
  ['dragon-zuma', 'Dragon Zuma', 'https://cdn.zabbet.com/games/1697459222535-03c42ddf-c03f-43c2-80fb-28b4e2ee895d.jpg', 'ygrfish'],
  ['zumas-honor', "Zuma's Honor", 'https://cdn.zabbet.com/games/1697460730285-fbc23cb1-25e4-489d-9ac7-6024737a5e5e.jpg', 'ygrfish'],
  ['hero-fishing', 'Hero Fishing', 'https://cdn.zabbet.com/games/1670595737720-4a51357f-9592-45bc-9223-78b674b217a4.png', 'cqfish'],
  ['pirates-fishing', 'Pirates Fishing', 'https://cdn.zabbet.com/games/1697460601524-afd92a33-4d24-4440-930c-501e1aee35f6.jpg', 'ygrfish'],
  ['lucky-fishing', 'Lucky Fishing', 'https://cdn.zabbet.com/games/vertical/CQ/lucky_fishing.jpg', 'cqfish'],
] as const;

const HOT_IDS = new Set([
  'devil-buster',
  'undersea-battle',
  'poseidons-secret',
  'hungry-shark',
  'captain-fishing',
  'longya-fishing',
  'hero-fishing',
  'pirates-fishing',
  'lucky-fishing',
]);

const NEW_IDS = new Set([
  'devil-buster',
  'undersea-battle',
  'poseidons-secret',
  'food-coma',
  'hungry-shark',
  'magic-witches',
  'happy-food-hunter',
  'monster-island',
  'world-of-lord-elf-king',
  'fishing-thai',
  'black-tornado',
  'hoan-kiem-lake',
  'duo-fu-fu-wa',
  'world-cup-mania',
]);

const SLOT_IDS = new Set(['dragon-zuma', 'zumas-honor']);

const GAMES: FishingGame[] = GAME_ROWS.map(([id, name, image, provider]) => {
  const tags: FishingFilterKey[] = [];
  const isHot = HOT_IDS.has(id);
  const isNew = NEW_IDS.has(id);
  if (isHot) tags.push('hot');
  if (isNew) tags.push('new');
  if (SLOT_IDS.has(id)) tags.push('slot');
  return { id, name, image, provider, tags, isHot, isNew };
});

const FILTERS: { key: FishingFilterKey; label: string; count: number }[] = [
  { key: 'hot', label: 'เกมส์ฮิต', count: 9 },
  { key: 'new', label: 'เกมส์ใหม่', count: 14 },
  { key: 'slot', label: 'เกมส์สล็อต', count: 2 },
];

export default function FishingBrowseSource() {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedFilters, setSelectedFilters] = useState<FishingFilterKey[]>([]);
  const [providerCode, setProviderCode] = useState<string | null>(null);

  const visibleGames = useMemo(
    () => GAMES.filter((game) => {
      const providerMatch = !providerCode || game.provider === providerCode;
      const filterMatch = selectedFilters.length === 0 || selectedFilters.some((filter) => game.tags.includes(filter));
      return providerMatch && filterMatch;
    }),
    [providerCode, selectedFilters],
  );

  const untouched = providerCode === null && selectedFilters.length === 0;
  const resultCount = untouched ? 129 : visibleGames.length;

  const toggleFilter = (key: FishingFilterKey) => {
    setSelectedFilters((current) => (
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    ));
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setProviderCode(null);
  };

  const countForFilter = (key: FishingFilterKey, referenceCount: number) => {
    if (untouched) return referenceCount;
    return GAMES.filter((game) => {
      const providerMatch = !providerCode || game.provider === providerCode;
      return providerMatch && game.tags.includes(key);
    }).length;
  };

  const countForProvider = (code: string) => GAMES.filter((game) => {
    const filterMatch = selectedFilters.length === 0 || selectedFilters.some((filter) => game.tags.includes(filter));
    return game.provider === code && filterMatch;
  }).length;

  const openGame = (game: FishingGame) => {
    const returnPath = '/browse/games?category=fishing';
    if (!ready || !isLoggedIn) {
      window.location.assign(`/?auth=login&next=${encodeURIComponent(returnPath)}`);
      return;
    }
    window.location.assign(`/games?category=fishing&provider=${encodeURIComponent(game.provider)}&game=${encodeURIComponent(game.id)}`);
  };

  return (
    <main className={styles.page} data-source-game-category="fishing" aria-busy="false">
      <div className={styles.backgroundStack} aria-hidden="true">
        <img
          className={styles.baseBackground}
          src="/assets/asset-pc/images/game/fishing/bg_fishing.webp"
          alt=""
          onError={swapToAssetBundle}
        />
        <div className={styles.purpleWash} />
        <div className={styles.bottomFade} data-source-bottom-fade />
      </div>

      <section className={styles.content} aria-label="ยิงปลา">
        <header className={styles.heroTitle}>
          <img
            className={styles.baseTitle}
            src="/assets/asset-pc/images/game/fishing/logo_fishing.webp"
            alt="ยิงปลา"
            onError={swapToAssetBundle}
          />
        </header>

        <div className={styles.layout} data-source-game-layout>
          <aside className={styles.filterPanel} data-source-filter-panel aria-label="ตัวกรองเกมตกปลา">
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle} data-source-filter-title>ตัวกรอง</div>

            <div className={styles.filterSectionTitle}>
              <strong>ค้นหาเกมที่คุณสนใจ</strong>
              <span>เลือกได้มากกว่าหนึ่ง</span>
            </div>

            <div className={styles.typeGrid} data-source-filter-types>
              {FILTERS.map((filter) => {
                const checked = selectedFilters.includes(filter.key);
                const count = countForFilter(filter.key, filter.count);
                return (
                  <label key={filter.key} className={styles.filterOption}>
                    <input type="checkbox" checked={checked} onChange={() => toggleFilter(filter.key)} />
                    <span className={`${styles.checkbox}${checked ? ` ${styles.checkboxActive}` : ''}`} aria-hidden="true">
                      {checked ? '✓' : ''}
                    </span>
                    <span className={styles.filterLabel}>{filter.label}</span>
                    <small>( {count.toLocaleString('th-TH')} )</small>
                  </label>
                );
              })}
            </div>

            <div className={styles.filterSectionTitle}>
              <strong>ค้นหาค่ายเกม</strong>
              <span>เลือกอย่างใดอย่างหนึ่ง</span>
            </div>

            <div className={styles.providerGrid} data-source-provider-grid>
              {PROVIDERS.map((provider) => {
                const selected = providerCode === provider.code;
                const count = countForProvider(provider.code);
                return (
                  <button
                    key={provider.code}
                    type="button"
                    data-source-provider-button
                    data-provider-code={provider.code}
                    className={`${styles.providerButton}${selected ? ` ${styles.providerActive}` : ''}`}
                    onClick={() => setProviderCode((current) => (current === provider.code ? null : provider.code))}
                    aria-pressed={selected}
                    aria-label={`${provider.name} ${count} เกม`}
                    title={`${provider.name} (${count})`}
                  >
                    <span className={styles.providerSurface} aria-hidden="true" />
                    <img src={provider.badge} alt={provider.name} onError={hideBrokenImage} />
                  </button>
                );
              })}
            </div>

            <div className={styles.filterActions}>
              <div className={styles.filterSummary} aria-live="polite">
                <span>พบเกมส์ที่คุณค้นหา</span>
                <strong>{resultCount.toLocaleString('th-TH')} เกม</strong>
              </div>
              <button type="button" className={styles.clearButton} onClick={clearFilters}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="รายการเกมตกปลา" aria-live="polite">
            <h1>ยิงปลา ({resultCount.toLocaleString('th-TH')} เกม)</h1>
            {visibleGames.length ? (
              <div className={styles.gameGrid}>
                {visibleGames.map((game) => {
                  const provider = PROVIDERS.find((item) => item.code === game.provider);
                  return (
                    <article key={`${game.provider}:${game.id}`} className={styles.gameCard}>
                      <button
                        type="button"
                        className={styles.gameCover}
                        data-source-game-cover
                        onClick={() => openGame(game)}
                        aria-label={`เปิด ${game.name}`}
                      >
                        <img className={styles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" onError={hideBrokenImage} />
                        <img className={styles.gameImageContain} src={game.image} alt={game.name} loading="lazy" onError={hideBrokenImage} />
                        <span className={styles.cardBadges} aria-hidden="true">
                          {game.isNew ? <b className={styles.newBadge}>★ NEW</b> : null}
                          {game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}
                        </span>
                        {provider ? (
                          <span className={styles.cardProviderBand} aria-hidden="true">
                            <img src={provider.badge} alt="" onError={hideBrokenImage} />
                          </span>
                        ) : null}
                        <span className={styles.playOverlay}><b>เข้าเล่น</b></span>
                      </button>
                      <p>{game.name}</p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <strong>ไม่พบเกมที่ตรงกับตัวกรอง</strong>
                <button type="button" className={styles.clearButton} onClick={clearFilters}>ล้างตัวกรอง</button>
              </div>
            )}
          </section>
        </div>
      </section>

      <style>{`
        main[data-source-game-category='fishing'] [data-source-filter-types] {
          height: 104px;
          min-height: 104px;
        }
      `}</style>
    </main>
  );
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}

function swapToAssetBundle(event: SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = `/assets/asset-pc${event.currentTarget.getAttribute('src') ?? ''}`;
}
