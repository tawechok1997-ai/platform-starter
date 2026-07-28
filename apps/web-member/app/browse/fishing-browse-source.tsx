'use client';

import { useEffect, useMemo, useState } from 'react';
import { resolveHomeGameFallback, resolveHomeGameImage, resolveHomeProviderLogo } from '../components/member-home/local-game-asset-resolver';
import { requestJson } from '../member-api';
import { useMemberSession } from '../member-session-provider';
import type { Game, GameLobbyPayload } from '../types/member-api';
import {
  FISHING_FALLBACK_GAMES,
  FISHING_FILTERS,
  FISHING_PROVIDER_ALIASES,
  FISHING_PROVIDERS,
  type FishingFilter,
  type FishingGame,
} from './fishing-browse-data';
import fishingStyles from './fishing-browse-source.module.css';
import styles from './slot-browse-source.module.css';

export default function FishingBrowseSource() {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedFilters, setSelectedFilters] = useState<FishingFilter[]>([]);
  const [provider, setProvider] = useState('all');
  const [catalogGames, setCatalogGames] = useState<FishingGame[]>([...FISHING_FALLBACK_GAMES]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogMessage, setCatalogMessage] = useState('');

  useEffect(() => {
    let active = true;
    void requestJson<GameLobbyPayload>('/public/games', {
      skipAuth: true,
      suppressSessionExpiryRedirect: true,
    }).then((payload) => {
      if (!active) return;
      const games = extractFishingGames(payload);
      if (games.length) {
        setCatalogGames(games.length >= FISHING_FALLBACK_GAMES.length
          ? games
          : mergeFishingGames(games, FISHING_FALLBACK_GAMES));
      } else {
        setCatalogMessage('ระบบยังไม่ส่งรายการเกมยิงปลาทั้งหมด จึงแสดงชุดสำรองจากต้นฉบับ');
      }
    }).catch((error: unknown) => {
      if (!active) return;
      setCatalogMessage(error instanceof Error
        ? `โหลดรายการเกมทั้งหมดไม่สำเร็จ: ${error.message}`
        : 'โหลดรายการเกมทั้งหมดไม่สำเร็จ');
    }).finally(() => {
      if (active) setCatalogLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const filterCounts = useMemo(() => ({
    hot: catalogGames.filter((game) => game.filters.includes('hot')).length,
    new: catalogGames.filter((game) => game.filters.includes('new')).length,
    slot: catalogGames.filter((game) => game.filters.includes('slot')).length,
  }), [catalogGames]);

  const visibleGames = useMemo(() => catalogGames.filter((game) => {
    const matchesProvider = provider === 'all' || game.provider === provider;
    const matchesFilters = selectedFilters.length === 0
      || selectedFilters.every((filter) => game.filters.includes(filter));
    return matchesProvider && matchesFilters;
  }), [catalogGames, provider, selectedFilters]);

  const clearFilters = () => {
    setSelectedFilters([]);
    setProvider('all');
  };

  const openGame = (game: FishingGame) => {
    if (!ready || !isLoggedIn) {
      window.location.assign('/?auth=login&next=%2Fbrowse%2Fgames%3Fcategory%3Dfishing');
      return;
    }
    window.location.assign(`/games?category=fishing&game=${encodeURIComponent(game.id)}`);
  };

  return (
    <main className={styles.page}>
      <div className={`${styles.background} ${fishingStyles.background}`} aria-hidden="true" />
      <div className={styles.purpleWash} aria-hidden="true" />
      <div className={styles.bottomFade} aria-hidden="true" />

      <section className={styles.content} aria-label="เกมยิงปลา">
        <header className={styles.heroTitle}>
          <img src="/assets/asset-pc/images/game/fishing/logo_fishing.webp" alt="ยิงปลา" />
        </header>

        <div className={`${styles.layout} ${fishingStyles.layout}`}>
          <aside className={`${styles.filterPanel} ${fishingStyles.filterPanel}`} aria-label="ตัวกรองเกมยิงปลา">
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle}>ตัวกรอง</div>
            <FilterHeading title="ค้นหาเกมที่คุณสนใจ" hint="เลือกได้มากกว่าหนึ่ง" />

            <div className={styles.typeGrid}>
              {FISHING_FILTERS.map((filter) => {
                const checked = selectedFilters.includes(filter.key);
                return (
                  <label key={filter.key} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setSelectedFilters((current) => current.includes(filter.key)
                        ? current.filter((item) => item !== filter.key)
                        : [...current, filter.key])}
                    />
                    <span className={`${styles.checkbox}${checked ? ` ${styles.checkboxActive}` : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span>
                    <span className={styles.filterLabel}>{filter.label}</span>
                    <small>( {filterCounts[filter.key]} )</small>
                  </label>
                );
              })}
            </div>

            <FilterHeading title="ค้นหาค่ายเกม" hint="เลือกอย่างใดอย่างหนึ่ง" />
            <div className={`${styles.providerGrid} ${fishingStyles.providerGrid}`}>
              {FISHING_PROVIDERS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`${styles.providerButton} ${fishingStyles.providerButton}${provider === item.code ? ` ${styles.providerActive}` : ''}`}
                  onClick={() => setProvider((current) => current === item.code ? 'all' : item.code)}
                  aria-pressed={provider === item.code}
                  title={item.name}
                >
                  <span aria-hidden="true" />
                  <img src={item.badge} alt={item.name} />
                </button>
              ))}
            </div>

            <div className={styles.filterSummary}>
              <div><span>พบเกมส์ที่คุณค้นหา</span><strong>{visibleGames.length} เกม</strong></div>
              <button type="button" onClick={clearFilters}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="รายการเกมยิงปลา">
            <h1>ยิงปลา ({visibleGames.length} เกม)</h1>
            {catalogLoading ? <p className={fishingStyles.catalogStatus}>กำลังโหลดเกมยิงปลาทั้งหมด...</p> : null}
            {!catalogLoading && catalogMessage ? <p className={fishingStyles.catalogStatus}>{catalogMessage}</p> : null}
            {visibleGames.length ? (
              <div className={`${styles.gameGrid} ${fishingStyles.gameGrid}`}>
                {visibleGames.map((game) => <FishingGameCard key={game.id} game={game} onPlay={openGame} />)}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <strong>ไม่พบเกมที่ตรงกับตัวกรอง</strong>
                <button type="button" onClick={clearFilters}>ล้างตัวกรอง</button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function FilterHeading({ title, hint }: { title: string; hint: string }) {
  return <div className={styles.filterSectionTitle}><strong>{title}</strong><span>{hint}</span></div>;
}

function FishingGameCard({ game, onPlay }: { game: FishingGame; onPlay: (game: FishingGame) => void }) {
  const providerData = FISHING_PROVIDERS.find((item) => item.code === game.provider);
  const providerLogo = game.providerLogo || providerData?.badge;
  return (
    <article className={styles.gameCard}>
      <button
        type="button"
        className={`${styles.gameCover} ${fishingStyles.gameCover}`}
        onClick={() => onPlay(game)}
        aria-label={`เล่น ${game.name}`}
      >
        <img className={fishingStyles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" />
        <img className={fishingStyles.gameImageContain} src={game.image} alt={game.name} loading="lazy" />
        <span className={styles.cardBadges} aria-hidden="true">
          {game.isNew ? <b className={styles.newBadge}>NEW</b> : null}
          {game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}
        </span>
        {providerLogo ? <img className={styles.cardProvider} src={providerLogo} alt="" aria-hidden="true" /> : null}
        <span className={styles.playOverlay}><b>เล่นเกม</b></span>
      </button>
      <p>{game.name}</p>
    </article>
  );
}

function extractFishingGames(payload: GameLobbyPayload): FishingGame[] {
  const sources = [payload.items, payload.featured, payload.newest, payload.popular]
    .flatMap((items) => Array.isArray(items) ? items : []);
  const unique = new Map<string, Game>();
  sources.forEach((game) => {
    if (!game || !isFishingGame(game)) return;
    const key = game.id || `${game.provider?.code || ''}:${game.providerGameCode || ''}:${game.name || ''}`;
    if (key && !unique.has(key)) unique.set(key, game);
  });
  return Array.from(unique.values()).map(mapApiFishingGame).filter((game) => Boolean(game.image));
}

function mapApiFishingGame(game: Game): FishingGame {
  const providerCode = resolveFishingProviderCode(game);
  const providerData = FISHING_PROVIDERS.find((item) => item.code === providerCode);
  const providerLogo = resolveHomeProviderLogo(game.provider) || providerData?.badge;
  const filters: FishingFilter[] = [];
  if (game.isPopular) filters.push('hot');
  if (game.isNew) filters.push('new');
  if (normalizeKey(game.category).includes('slot')) filters.push('slot');

  return {
    id: game.id || `${providerCode}-${game.providerGameCode || normalizeKey(game.name)}`,
    name: game.name?.trim() || 'Fishing Game',
    image: resolveHomeGameImage(game) || resolveHomeGameFallback(game),
    provider: providerCode,
    providerLogo,
    isNew: Boolean(game.isNew),
    isHot: Boolean(game.isPopular),
    filters,
  };
}

function isFishingGame(game: Game) {
  const category = normalizeKey(game.category);
  const provider = normalizeKey(`${game.provider?.code || ''} ${game.provider?.name || ''}`);
  const name = normalizeKey(game.name);
  return category.includes('fish') || category.includes('ยิงปลา') || provider.includes('fish') || name.includes('fish');
}

function resolveFishingProviderCode(game: Game) {
  const candidates = [game.provider?.code, game.provider?.name].map(normalizeKey).filter(Boolean);
  for (const candidate of candidates) {
    const exact = FISHING_PROVIDER_ALIASES[candidate];
    if (exact) return exact;
    const withoutFish = FISHING_PROVIDER_ALIASES[candidate.replace(/fish$/, '')];
    if (withoutFish) return withoutFish;
  }
  return candidates[0] || 'unknown';
}

function mergeFishingGames(primary: readonly FishingGame[], fallback: readonly FishingGame[]) {
  const merged = new Map<string, FishingGame>();
  [...primary, ...fallback].forEach((game) => {
    const key = `${normalizeKey(game.provider)}:${normalizeKey(game.name)}`;
    if (!merged.has(key)) merged.set(key, game);
  });
  return Array.from(merged.values());
}

function normalizeKey(value?: string | null) {
  return String(value ?? '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9ก-๙]+/g, '');
}
