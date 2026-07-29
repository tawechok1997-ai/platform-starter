'use client';

import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { useMemberSession } from '../member-session-provider';
import styles from './source-game-category-page.module.css';

export type SourceGameFilterKey = 'arcade' | 'buy' | 'hot' | 'new' | 'slot' | 'table';

export type SourceGameProvider = {
  code: string;
  name: string;
  badge: string;
  card: string;
  background: string;
  title: string;
  avatar: string;
  maintenance?: boolean;
};

export type SourceGameItem = {
  id: string;
  name: string;
  image: string;
  provider: string | null;
  providerBadge?: string;
  isNew: boolean;
  isHot: boolean;
  tags: SourceGameFilterKey[];
  origin?: 'source' | 'catalog';
};

export type SourceGameCategoryConfig = {
  slug: string;
  title: string;
  total: number;
  resultUnit: 'เกม' | 'ค่าย';
  baseBackground: string;
  baseLogo: string;
  mode: 'games' | 'provider-cards';
  filters: { key: SourceGameFilterKey; label: string; count: number }[];
  providers: SourceGameProvider[];
  games: SourceGameItem[];
  showProviderStrip?: boolean;
  showAllProviders?: boolean;
};

const FISHING_HOT = new Set([
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
const FISHING_NEW = new Set(['fishing-thai', 'black-tornado', 'hoan-kiem-lake', 'duo-fu-fu-wa', 'world-cup-mania']);
const FISHING_SLOT = new Set(['dragon-zuma', 'zumas-honor']);
const SLOT_HOT = new Set(['caishen-win', 'super-ace', 'roma-x', 'funky-fortunez', 'money-tree', 'muscle-fortune-cat', 'bad-rich-wolf']);
const SLOT_ARCADE = new Set(['raptor-2', 'dj-boom-boom', 'skeleton-party', 'open-vault']);
const SLOT_TABLE = new Set(['3-coin-wild-tiger', 'amar-akbar-anthony', 'stamp-world']);

export default function SourceGameCategoryPage({ config }: { config: SourceGameCategoryConfig }) {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedFilters, setSelectedFilters] = useState<SourceGameFilterKey[]>([]);
  const [providerCode, setProviderCode] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [invalidProviderThemes, setInvalidProviderThemes] = useState<Set<string>>(() => new Set());
  const usesReferenceCounts = config.slug === 'casino' || config.slug === 'slot';

  useEffect(() => {
    setSelectedFilters([]);
    setProviderCode(null);
    setPreviewCode(null);
    setInvalidProviderThemes(new Set());
  }, [config.slug]);

  const providers = useMemo(
    () => Array.from(new Map(config.providers.map((item) => [item.code.toLowerCase(), item] as const)).values()),
    [config.providers],
  );

  const games = useMemo(
    () => Array.from(
      new Map(
        config.games.map((item, index) => {
          const hydrated = hydrateGame(config.slug, { ...item, origin: 'source' }, index);
          return [`${hydrated.provider ?? 'none'}:${hydrated.id}`, hydrated] as const;
        }),
      ).values(),
    ),
    [config.games, config.slug],
  );

  const filterCounts = useMemo(() => {
    const counts = new Map<SourceGameFilterKey, number>();
    config.filters.forEach((filter) => {
      counts.set(
        filter.key,
        games.filter((game) => {
          const providerMatch = !providerCode || game.provider === providerCode;
          return providerMatch && game.tags.includes(filter.key);
        }).length,
      );
    });
    return counts;
  }, [config.filters, games, providerCode]);

  const providerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    providers.forEach((provider) => {
      const normalizedCode = provider.code.toLowerCase();
      counts.set(
        normalizedCode,
        games.filter((game) => {
          const providerMatch = game.provider === normalizedCode;
          const filterMatch = selectedFilters.length === 0 || selectedFilters.some((filter) => game.tags.includes(filter));
          return providerMatch && filterMatch;
        }).length,
      );
    });
    return counts;
  }, [games, providers, selectedFilters]);

  const selectableProviders = useMemo(() => {
    if (config.showAllProviders || config.slug === 'slot') return providers;
    return providers.filter(
      (provider) => config.mode === 'provider-cards' || (providerCounts.get(provider.code.toLowerCase()) ?? 0) > 0,
    );
  }, [config.mode, config.showAllProviders, config.slug, providerCounts, providers]);

  const themeCode = config.mode === 'provider-cards' ? previewCode : providerCode;
  const activeProvider = themeCode && !invalidProviderThemes.has(themeCode)
    ? providers.find((item) => item.code.toLowerCase() === themeCode) ?? null
    : null;

  const visibleGames = useMemo(
    () => games.filter((game) => {
      const providerMatch = !providerCode || game.provider === providerCode;
      const filterMatch = selectedFilters.length === 0 || selectedFilters.some((filter) => game.tags.includes(filter));
      return providerMatch && filterMatch;
    }),
    [games, providerCode, selectedFilters],
  );

  const untouched = !providerCode && selectedFilters.length === 0;
  const resultCount = usesReferenceCounts && untouched ? config.total : visibleGames.length;

  const clearFilters = () => {
    setSelectedFilters([]);
    setProviderCode(null);
    setPreviewCode(null);
  };

  const toggleFilter = (key: SourceGameFilterKey) => {
    setSelectedFilters((current) => (
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    ));
  };

  const selectProvider = (provider: SourceGameProvider) => {
    if (provider.maintenance) return;
    const normalizedCode = provider.code.toLowerCase();
    setProviderCode((current) => (current === normalizedCode ? null : normalizedCode));
    setPreviewCode(null);
  };

  const invalidateProviderTheme = (code: string) => {
    const normalizedCode = code.toLowerCase();
    setInvalidProviderThemes((current) => {
      if (current.has(normalizedCode)) return current;
      const next = new Set(current);
      next.add(normalizedCode);
      return next;
    });
  };

  const openGame = (game: SourceGameItem) => {
    const next = `/browse/games?category=${encodeURIComponent(config.slug)}`;
    if (!ready || !isLoggedIn) {
      window.location.assign(`/?auth=login&next=${encodeURIComponent(next)}`);
      return;
    }
    const provider = game.provider ? `&provider=${encodeURIComponent(game.provider)}` : '';
    window.location.assign(`/games?category=${encodeURIComponent(config.slug)}${provider}&game=${encodeURIComponent(game.id)}`);
  };

  return (
    <main className={styles.page} data-source-game-category={config.slug} aria-busy="false">
      <div className={styles.backgroundStack} aria-hidden="true">
        {providers.map((provider) => {
          const code = provider.code.toLowerCase();
          return (
            <img
              key={provider.code}
              className={`${styles.providerBackground}${activeProvider?.code.toLowerCase() === code ? ` ${styles.providerBackgroundActive}` : ''}`}
              src={provider.background}
              alt=""
              onError={() => invalidateProviderTheme(code)}
            />
          );
        })}
        <img className={styles.baseBackground} src={config.baseBackground} alt="" onError={swapToAssetBundle} />
        <div className={styles.purpleWash} />
        <div className={styles.bottomFade} data-source-bottom-fade />
      </div>

      <section className={styles.content} aria-label={config.title}>
        <header className={styles.heroTitle}>
          <img
            className={`${styles.baseTitle}${activeProvider ? ` ${styles.baseTitleHidden}` : ''}`}
            src={config.baseLogo}
            alt={config.title}
            onError={swapToAssetBundle}
          />
          {providers.map((provider) => {
            const code = provider.code.toLowerCase();
            return (
              <img
                key={`${provider.code}-title`}
                className={`${styles.providerTitle}${activeProvider?.code.toLowerCase() === code ? ` ${styles.providerTitleActive}` : ''}`}
                src={provider.title}
                alt={provider.name}
                onLoad={(event) => validateProviderThemeImage('title', code, event, invalidateProviderTheme)}
                onError={() => invalidateProviderTheme(code)}
              />
            );
          })}
          {providers.map((provider) => {
            const code = provider.code.toLowerCase();
            return (
              <img
                key={`${provider.code}-avatar`}
                className={`${styles.providerAvatar}${activeProvider?.code.toLowerCase() === code ? ` ${styles.providerAvatarActive}` : ''}`}
                src={provider.avatar}
                alt=""
                onLoad={(event) => validateProviderThemeImage('avatar', code, event, invalidateProviderTheme)}
                onError={() => invalidateProviderTheme(code)}
              />
            );
          })}
        </header>

        <div className={styles.layout} data-source-game-layout>
          <aside className={styles.filterPanel} data-source-filter-panel aria-label={`ตัวกรอง${config.title}`}>
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle} data-source-filter-title>ตัวกรอง</div>

            <div className={`${styles.filterSectionTitle}${config.filters.length ? '' : ` ${styles.filterSectionCollapsed}`}`}>
              <strong>ค้นหาเกมที่คุณสนใจ</strong>
              <span>เลือกได้มากกว่าหนึ่ง</span>
            </div>

            <div className={`${styles.typeGrid}${config.filters.length ? '' : ` ${styles.typeGridCollapsed}`}`} data-source-filter-types>
              {config.filters.map((filter) => {
                const checked = selectedFilters.includes(filter.key);
                const count = usesReferenceCounts && untouched ? filter.count : (filterCounts.get(filter.key) ?? 0);
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

            {config.showProviderStrip ? (
              <>
                <div className={styles.filterSectionTitle}>
                  <strong>ค้นหาค่ายเกม</strong>
                  <span>เลือกอย่างใดอย่างหนึ่ง</span>
                </div>
                <div
                  className={`${styles.providerGrid}${selectableProviders.length ? '' : ` ${styles.providerGridEmpty}`}`}
                  data-source-provider-grid
                >
                  {selectableProviders.map((provider) => {
                    const normalizedCode = provider.code.toLowerCase();
                    const count = providerCounts.get(normalizedCode) ?? 0;
                    const selected = providerCode === normalizedCode;
                    const maintenance = provider.maintenance === true;
                    return (
                      <button
                        key={provider.code}
                        type="button"
                        data-source-provider-button
                        data-provider-code={normalizedCode}
                        className={`${styles.providerButton}${selected ? ` ${styles.providerActive}` : ''}${maintenance ? ` ${styles.providerMaintenance}` : ''}`}
                        onClick={() => selectProvider(provider)}
                        disabled={maintenance}
                        aria-pressed={selected}
                        aria-label={maintenance ? `${provider.name} ปิดปรับปรุง` : `${provider.name} ${count} เกม`}
                        title={maintenance ? `${provider.name} ปิดปรับปรุง` : `${provider.name} (${count})`}
                      >
                        <span className={styles.providerSurface} aria-hidden="true" />
                        <img src={provider.badge} alt={provider.name} onError={hideBrokenImage} />
                        {maintenance ? (
                          <span className={styles.maintenanceOverlay} aria-hidden="true">
                            <span className={styles.maintenanceIcon}>◆</span>
                            <small>ปิดปรับปรุง</small>
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            <div className={styles.filterActions}>
              <div className={styles.filterSummary} aria-live="polite">
                <span>พบเกมส์ที่คุณค้นหา</span>
                <strong>{resultCount.toLocaleString('th-TH')} {config.resultUnit}</strong>
              </div>
              <button type="button" className={styles.clearButton} onClick={clearFilters} disabled={untouched}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label={`รายการ${config.title}`} aria-live="polite">
            <h1>{config.title} ({resultCount.toLocaleString('th-TH')} เกม)</h1>
            {visibleGames.length ? (
              <div className={styles.gameGrid}>
                {visibleGames.map((game) => {
                  const provider = providers.find((item) => item.code.toLowerCase() === game.provider);
                  const providerBadge = game.providerBadge ?? provider?.badge;
                  return (
                    <article
                      key={`${game.provider ?? 'none'}:${game.id}`}
                      className={styles.gameCard}
                      onMouseEnter={() => config.mode === 'provider-cards' && setPreviewCode(game.provider)}
                      onMouseLeave={() => config.mode === 'provider-cards' && setPreviewCode(null)}
                    >
                      <button
                        type="button"
                        className={styles.gameCover}
                        data-source-game-cover
                        onFocus={() => config.mode === 'provider-cards' && setPreviewCode(game.provider)}
                        onBlur={() => config.mode === 'provider-cards' && setPreviewCode(null)}
                        onClick={() => openGame(game)}
                        aria-label={`เปิด ${game.name}`}
                      >
                        {config.mode === 'games' && !game.id.startsWith('provider-') ? (
                          <img className={styles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" onError={hideBrokenImage} />
                        ) : null}
                        <img
                          className={config.mode === 'games' && !game.id.startsWith('provider-') ? styles.gameImageContain : styles.gameImageCover}
                          src={game.image}
                          alt={game.name}
                          loading="lazy"
                          onLoad={(event) => config.mode === 'provider-cards' && hideLandscapePlaceholderCard(event)}
                          onError={hideBrokenImage}
                        />
                        <span className={styles.cardBadges} aria-hidden="true">
                          {game.isNew ? <b className={styles.newBadge}><StarIcon />NEW</b> : null}
                          {game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}
                        </span>
                        {config.mode === 'games' && providerBadge ? (
                          <span className={styles.cardProviderBand} aria-hidden="true">
                            <img src={providerBadge} alt="" onError={hideBrokenImage} />
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
        main[data-source-game-category='casino'] {
          background: transparent !important;
        }
        main[data-source-game-category='casino'] [data-source-bottom-fade] {
          background: linear-gradient(182deg, rgba(17,14,22,0) 29%, rgba(17,14,22,.32) 58%, rgba(17,14,22,.08) 86%, rgba(17,14,22,0) 100%) !important;
        }
        main[data-source-game-category='casino'] [data-source-game-cover] {
          background: transparent !important;
        }
        @media (min-width: 901px) and (max-width: 1460px) {
          main[data-source-game-category]:not([data-source-game-category='casino']) [data-source-game-layout] {
            grid-template-columns: 300px minmax(0, 1fr);
          }
          main[data-source-game-category]:not([data-source-game-category='casino']) [data-source-filter-panel],
          main[data-source-game-category]:not([data-source-game-category='casino']) [data-source-filter-title],
          main[data-source-game-category]:not([data-source-game-category='casino']) [data-source-provider-grid] {
            width: 300px;
            min-width: 300px;
            max-width: 300px;
          }
          main[data-source-game-category]:not([data-source-game-category='casino']) [data-source-provider-button] {
            width: 86px;
          }
        }
      `}</style>
    </main>
  );
}

function hydrateGame(slug: string, game: SourceGameItem, index: number): SourceGameItem {
  const tags = new Set<SourceGameFilterKey>(game.tags);
  let isNew = game.isNew;
  let isHot = game.isHot;

  if (slug === 'fishing') {
    tags.clear();
    isNew = FISHING_NEW.has(game.id) || game.image.includes('/176');
    isHot = FISHING_HOT.has(game.id);
    if (FISHING_SLOT.has(game.id)) tags.add('slot');
  }

  if (slug === 'slot') {
    tags.clear();
    tags.add('slot');
    isNew = game.image.includes('/177');
    isHot = SLOT_HOT.has(game.id);
    if (SLOT_ARCADE.has(game.id) || index % 11 === 0) tags.add('arcade');
    if (/buy feature/i.test(game.name) || index % 13 === 0) tags.add('buy');
    if (SLOT_TABLE.has(game.id) || index % 17 === 0) tags.add('table');
  }

  if (isNew) tags.add('new');
  if (isHot) tags.add('hot');
  return { ...game, provider: game.provider?.toLowerCase() ?? null, isNew, isHot, tags: Array.from(tags) };
}

function validateProviderThemeImage(
  kind: 'title' | 'avatar',
  code: string,
  event: SyntheticEvent<HTMLImageElement>,
  invalidate: (code: string) => void,
) {
  const image = event.currentTarget;
  if (!image.naturalWidth || !image.naturalHeight) {
    invalidate(code);
    return;
  }

  const ratio = image.naturalWidth / image.naturalHeight;
  const invalid = kind === 'title' ? ratio < 2 : ratio > 1.45;
  if (invalid) invalidate(code);
}

function hideLandscapePlaceholderCard(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (!image.naturalWidth || !image.naturalHeight) return;
  if (image.naturalWidth / image.naturalHeight <= 1.45) return;
  const card = image.closest<HTMLElement>('article');
  if (card) card.style.display = 'none';
}

function StarIcon() {
  return <svg width="10" height="9" viewBox="0 0 10 9" fill="none" aria-hidden="true"><path d="M4.837.055C4.813.095 4.506.669 4.157 1.336 3.657 2.289 3.476 2.582 3.307 2.709c-.199.149-.331.178-1.626.362C.229 3.272 0 3.324 0 3.456c0 .04.476.523 1.06 1.074.585.552 1.097 1.075 1.145 1.161.127.23.109.523-.132 1.816-.229 1.258-.235 1.465-.067 1.494.06.011.675-.264 1.368-.615.699-.345 1.361-.649 1.47-.672.295-.052.475.023 1.837.701.668.333 1.259.598 1.313.586.169-.029.163-.23-.066-1.488-.235-1.27-.259-1.609-.133-1.833.049-.075.561-.592 1.145-1.149C9.524 3.979 10 3.49 10 3.45c0-.126-.241-.178-1.681-.379-1.295-.184-1.427-.213-1.626-.362-.169-.126-.356-.425-.88-1.425C5.283.279 5.127.014 5.018.003c-.066-.012-.15.011-.18.052Z" fill="currentColor" /></svg>;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}

function swapToAssetBundle(event: SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.dataset.fallbackApplied === 'true') return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = `/assets/asset-pc${event.currentTarget.getAttribute('src') ?? ''}`;
}
