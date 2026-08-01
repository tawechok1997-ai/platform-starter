'use client';

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { V47_ASSETS } from '../components/member-home/v47-asset-map';
import {
  loadMemberGameCatalog,
  type MemberCatalogGame,
  type MemberGamePlatform,
} from '../lib/member-game-catalog';
import { useMemberLocale } from '../member-locale-provider';
import styles from './search-page.module.css';

type SearchTab = 'search' | 'recent' | 'favorite' | 'hot' | 'new';

const SEARCH_HISTORY_KEY = 'member_mobile_search_history_v1';
const FAVORITES_KEY = 'member_mobile_search_favorites_v1';
const RECENT_KEY = 'member_mobile_search_recent_v1';
const MAX_HISTORY = 10;
const MAX_RECENT = 48;

const COPY = {
  th: {
    title: 'ค้นหา',
    back: 'ย้อนกลับ',
    tabs: {
      search: 'ค้นหา', recent: 'ล่าสุด', favorite: 'รายการโปรด', hot: 'เกมฮอต', new: 'เกมใหม่',
    },
    placeholder: 'พิมพ์ชื่อเกม ค่าย หมวด หรือแท็ก',
    history: 'ประวัติการค้นหา',
    clear: 'ล้าง',
    results: 'ผลการค้นหา',
    all: 'ดูทั้งหมด',
    loading: 'กำลังโหลดเกมทั้งหมด...',
    failed: 'โหลดรายการเกมไม่สำเร็จ',
    empty: 'ไม่พบเกมที่ตรงกับรายการนี้',
    favoriteAdd: 'เพิ่มในรายการโปรด',
    favoriteRemove: 'ลบจากรายการโปรด',
  },
  en: {
    title: 'Search',
    back: 'Back',
    tabs: {
      search: 'Search', recent: 'Recent', favorite: 'Favorites', hot: 'Hot games', new: 'New games',
    },
    placeholder: 'Search by game, provider, category, or tag',
    history: 'Search history',
    clear: 'Clear',
    results: 'Search results',
    all: 'View all',
    loading: 'Loading the complete game catalog...',
    failed: 'Unable to load games',
    empty: 'No games match this list',
    favoriteAdd: 'Add to favorites',
    favoriteRemove: 'Remove from favorites',
  },
} as const;

export default function SearchPage() {
  const router = useRouter();
  const { locale } = useMemberLocale();
  const copy = COPY[locale];
  const [platform, setPlatform] = useState<MemberGamePlatform>('mobile');
  const [games, setGames] = useState<MemberCatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('search');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('th'));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const sync = () => setPlatform(media.matches ? 'mobile' : 'pc');
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    setHistory(readStoredStrings(SEARCH_HISTORY_KEY));
    setFavoriteIds(readStoredStrings(FAVORITES_KEY));
    setRecentIds(readStoredStrings(RECENT_KEY));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);

    void loadMemberGameCatalog(platform, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setGames(items);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isAbortError(error)) {
          setGames([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [platform]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const gameById = useMemo(
    () => new Map(games.map((game) => [storageGameId(game), game] as const)),
    [games],
  );

  const visibleGames = useMemo(() => {
    let items = games;
    if (activeTab === 'recent') items = recentIds.flatMap((id) => gameById.get(id) ?? []);
    else if (activeTab === 'favorite') items = games.filter((game) => favoriteSet.has(storageGameId(game)));
    else if (activeTab === 'hot') items = games.filter((game) => game.popular || game.tags.includes('hot') || game.tags.includes('popular'));
    else if (activeTab === 'new') items = games.filter((game) => game.fresh || game.tags.includes('new'));

    if (activeTab !== 'search' || !deferredQuery) return items;
    return items.filter((game) => {
      const haystack = [
        game.name,
        game.provider,
        game.providerName,
        game.category,
        ...game.tags,
      ].join(' ').toLocaleLowerCase('th');
      return haystack.includes(deferredQuery);
    });
  }, [activeTab, deferredQuery, favoriteSet, gameById, games, recentIds]);

  const sectionTitle = activeTab === 'search' && deferredQuery
    ? copy.results
    : copy.tabs[activeTab];

  function submitSearch() {
    const value = query.trim();
    if (!value) return;
    const next = [value, ...history.filter((item) => item.toLocaleLowerCase('th') !== value.toLocaleLowerCase('th'))]
      .slice(0, MAX_HISTORY);
    setHistory(next);
    writeStoredStrings(SEARCH_HISTORY_KEY, next);
  }

  function clearHistory() {
    setHistory([]);
    writeStoredStrings(SEARCH_HISTORY_KEY, []);
  }

  function toggleFavorite(game: MemberCatalogGame) {
    const id = storageGameId(game);
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((item) => item !== id)
      : [id, ...favoriteIds];
    setFavoriteIds(next);
    writeStoredStrings(FAVORITES_KEY, next);
  }

  function openGame(game: MemberCatalogGame) {
    const id = storageGameId(game);
    const next = [id, ...recentIds.filter((item) => item !== id)].slice(0, MAX_RECENT);
    setRecentIds(next);
    writeStoredStrings(RECENT_KEY, next);

    const params = new URLSearchParams({
      category: game.category,
      game: game.providerGameCode || game.id,
      platform,
    });
    if (game.provider) params.set('provider', game.provider);
    router.push(`/games?${params.toString()}`);
  }

  return (
    <main className={styles.root} data-mobile-search-owner="true" data-catalog-platform={platform}>
      <header className={styles.header}>
        <button type="button" aria-label={copy.back} onClick={() => router.back()}>
          <BackIcon />
        </button>
        <h1>{copy.title}</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.body}>
        <nav className={styles.tabs} aria-label={copy.title}>
          <SearchTabButton active={activeTab === 'search'} label={copy.tabs.search} onClick={() => setActiveTab('search')} icon={<SearchIcon />} />
          <SearchTabButton active={activeTab === 'recent'} label={copy.tabs.recent} onClick={() => setActiveTab('recent')} icon={<ClockIcon />} />
          <SearchTabButton active={activeTab === 'favorite'} label={copy.tabs.favorite} onClick={() => setActiveTab('favorite')} icon={<img src={V47_ASSETS.star} alt="" />} />
          <SearchTabButton active={activeTab === 'hot'} label={copy.tabs.hot} onClick={() => setActiveTab('hot')} icon={<img src={V47_ASSETS.fire} alt="" />} />
          <SearchTabButton active={activeTab === 'new'} label={copy.tabs.new} onClick={() => setActiveTab('new')} icon={<img src={V47_ASSETS.gameHit} alt="" />} />
        </nav>

        <div className={styles.divider}><span /></div>

        <section className={styles.searchBlock}>
          <label>
            <input
              value={query}
              maxLength={80}
              placeholder={copy.placeholder}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveTab('search');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch();
              }}
            />
            <button type="button" aria-label={copy.tabs.search} onClick={submitSearch}><SearchIcon /></button>
          </label>

          {activeTab === 'search' ? (
            <div className={styles.history}>
              <header>
                <p>{copy.history}</p>
                <button type="button" onClick={clearHistory}><TrashIcon />{copy.clear}</button>
              </header>
              {history.length > 0 ? (
                <div>
                  {history.map((item) => (
                    <button key={item} type="button" onClick={() => setQuery(item)}>{item}</button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={styles.gamesSection} aria-live="polite">
          <header className={styles.sectionHeader}>
            <strong>{sectionTitle} {!loading ? `(${visibleGames.length.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US')})` : ''}</strong>
            <button type="button" onClick={() => setActiveTab('search')}>{copy.all}<ChevronIcon /></button>
          </header>

          {loading ? <div className={styles.state}>{copy.loading}</div> : null}
          {!loading && failed ? <div className={styles.state}>{copy.failed}</div> : null}
          {!loading && !failed && visibleGames.length === 0 ? <div className={styles.state}>{copy.empty}</div> : null}

          {!loading && visibleGames.length > 0 ? (
            <div className={styles.grid}>
              {visibleGames.map((game) => {
                const favorite = favoriteSet.has(storageGameId(game));
                return (
                  <article
                    key={`${game.platform}:${game.provider}:${game.id}`}
                    className={styles.card}
                    data-game-tags={game.tags.join(',')}
                    data-game-category={game.category}
                    data-game-platform={game.platform}
                  >
                    <button type="button" className={styles.poster} onClick={() => openGame(game)} aria-label={game.name}>
                      <img
                        src={game.image}
                        alt={game.name}
                        loading="lazy"
                        onError={(event) => restoreRemoteImage(event, game.imageSource)}
                      />
                      {game.badge ? <span className={game.badge === 'NEW' ? styles.newBadge : styles.hotBadge}>{game.badge}</span> : null}
                      {game.providerIcon ? (
                        <img
                          className={styles.provider}
                          src={game.providerIcon}
                          alt=""
                          loading="lazy"
                          onError={(event) => restoreRemoteImage(event, game.providerIconSource)}
                        />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      className={`${styles.favorite} ${favorite ? styles.favoriteActive : ''}`}
                      aria-label={favorite ? copy.favoriteRemove : copy.favoriteAdd}
                      aria-pressed={favorite}
                      onClick={() => toggleFavorite(game)}
                    >
                      {favorite ? '♥' : '♡'}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function SearchTabButton({ active, label, icon, onClick }: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? styles.tabActive : ''} aria-pressed={active} onClick={onClick}>
      <span>{icon}</span><strong>{label}</strong>
    </button>
  );
}

function storageGameId(game: MemberCatalogGame) {
  return `${game.platform}:${game.provider}:${game.providerGameCode || game.id}`.toLowerCase();
}

function restoreRemoteImage(event: SyntheticEvent<HTMLImageElement>, source: string) {
  const image = event.currentTarget;
  if (source && image.src !== source && /^https?:\/\//i.test(source)) {
    image.src = source;
    return;
  }
  image.hidden = true;
}

function readStoredStrings(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStoredStrings(key: string, values: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Search still works when storage is unavailable.
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>;
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>;
}
