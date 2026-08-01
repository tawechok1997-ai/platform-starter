'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { V47_ASSETS } from '../components/member-home/v47-asset-map';
import { resolveLocalAssetByBasename } from '../lib/local-asset-by-basename';
import { memberApiFetch } from '../member-api';
import { useMemberLocale } from '../member-locale-provider';
import styles from './search-page.module.css';

type SearchTab = 'search' | 'recent' | 'favorite' | 'hot' | 'new';
type GameBadge = 'HOT' | 'NEW' | '';

type SearchGame = {
  id: string;
  name: string;
  provider: string;
  providerIcon: string;
  image: string;
  badge: GameBadge;
  players: number;
  category: string;
  createdAt: string;
};

type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  code?: string | null;
  name?: string | null;
  providerId?: string | null;
  provider?: string | { code?: string | null; name?: string | null; logoUrl?: string | null } | null;
  providerLogoUrl?: string | null;
  category?: string | null;
  tags?: string[] | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  onlinePlayers?: number | null;
  playerCount?: number | null;
  isPopular?: boolean | null;
  isFeatured?: boolean | null;
  isNew?: boolean | null;
  createdAt?: string | null;
  rawPayload?: { assetSource?: string | null } | null;
};

type CatalogPayload = {
  items?: CatalogGame[] | null;
  data?: CatalogGame[] | { items?: CatalogGame[] | null } | null;
};

const CATEGORIES = ['slot', 'casino', 'arcade', 'fishing', 'sport', 'card', 'lottery'] as const;
const SEARCH_HISTORY_KEY = 'member_mobile_search_history_v1';
const FAVORITES_KEY = 'member_mobile_search_favorites_v1';
const RECENT_KEY = 'member_mobile_search_recent_v1';
const MAX_HISTORY = 10;
const MAX_RECENT = 24;

const COPY = {
  th: {
    title: 'ค้นหา',
    back: 'ย้อนกลับ',
    tabs: {
      search: 'ค้นหา', recent: 'ล่าสุด', favorite: 'รายการโปรด', hot: 'เกมฮอต', new: 'เกมใหม่',
    },
    placeholder: 'พิมพ์เกมที่คุณค้นหา',
    history: 'ประวัติการค้นหา',
    clear: 'ล้าง',
    newGames: 'เกมใหม่',
    results: 'ผลการค้นหา',
    all: 'ดูทั้งหมด',
    loading: 'กำลังโหลดเกม...',
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
    placeholder: 'Type the game you are looking for',
    history: 'Search history',
    clear: 'Clear',
    newGames: 'New games',
    results: 'Search results',
    all: 'View all',
    loading: 'Loading games...',
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
  const [games, setGames] = useState<SearchGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('search');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    setHistory(readStoredStrings(SEARCH_HISTORY_KEY));
    setFavoriteIds(readStoredStrings(FAVORITES_KEY));
    setRecentIds(readStoredStrings(RECENT_KEY));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);

    void loadCatalog(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setGames(items);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setGames([]);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const gameById = useMemo(() => new Map(games.map((game) => [game.id, game] as const)), [games]);

  const visibleGames = useMemo(() => {
    let items = games;
    if (activeTab === 'recent') items = recentIds.flatMap((id) => gameById.get(id) ?? []);
    else if (activeTab === 'favorite') items = games.filter((game) => favoriteSet.has(game.id));
    else if (activeTab === 'hot') items = games.filter((game) => game.badge === 'HOT' || game.players > 0);
    else if (activeTab === 'new') items = games.filter((game) => game.badge === 'NEW');

    if (activeTab !== 'search' || !deferredQuery) return items.slice(0, 80);
    return items.filter((game) => {
      const haystack = `${game.name} ${game.provider} ${game.category}`.toLowerCase();
      return haystack.includes(deferredQuery);
    }).slice(0, 80);
  }, [activeTab, deferredQuery, favoriteSet, gameById, games, recentIds]);

  const sectionTitle = activeTab === 'search' && deferredQuery ? copy.results : copy.tabs[activeTab] || copy.newGames;

  function submitSearch() {
    const value = query.trim();
    if (!value) return;
    const next = [value, ...history.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, MAX_HISTORY);
    setHistory(next);
    writeStoredStrings(SEARCH_HISTORY_KEY, next);
  }

  function clearHistory() {
    setHistory([]);
    writeStoredStrings(SEARCH_HISTORY_KEY, []);
  }

  function toggleFavorite(id: string) {
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((item) => item !== id)
      : [id, ...favoriteIds];
    setFavoriteIds(next);
    writeStoredStrings(FAVORITES_KEY, next);
  }

  function openGame(game: SearchGame) {
    const next = [game.id, ...recentIds.filter((id) => id !== game.id)].slice(0, MAX_RECENT);
    setRecentIds(next);
    writeStoredStrings(RECENT_KEY, next);
    router.push('/games');
  }

  return (
    <main className={styles.root} data-mobile-search-owner="true">
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
            <strong>{sectionTitle}</strong>
            <button type="button" onClick={() => setActiveTab(activeTab === 'search' ? 'new' : activeTab)}>{copy.all}<ChevronIcon /></button>
          </header>

          {loading ? <div className={styles.state}>{copy.loading}</div> : null}
          {!loading && failed ? <div className={styles.state}>{copy.failed}</div> : null}
          {!loading && !failed && visibleGames.length === 0 ? <div className={styles.state}>{copy.empty}</div> : null}

          {!loading && visibleGames.length > 0 ? (
            <div className={styles.grid}>
              {visibleGames.map((game) => (
                <article key={game.id} className={styles.card}>
                  <button type="button" className={styles.poster} onClick={() => openGame(game)} aria-label={game.name}>
                    <img src={game.image} alt={game.name} loading="lazy" />
                    {game.badge ? <span className={game.badge === 'NEW' ? styles.newBadge : styles.hotBadge}>{game.badge}</span> : null}
                    {game.providerIcon ? <img className={styles.provider} src={game.providerIcon} alt="" loading="lazy" /> : null}
                  </button>
                  <button
                    type="button"
                    className={`${styles.favorite} ${favoriteSet.has(game.id) ? styles.favoriteActive : ''}`}
                    aria-label={favoriteSet.has(game.id) ? copy.favoriteRemove : copy.favoriteAdd}
                    aria-pressed={favoriteSet.has(game.id)}
                    onClick={() => toggleFavorite(game.id)}
                  >
                    {favoriteSet.has(game.id) ? '♥' : '♡'}
                  </button>
                </article>
              ))}
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
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? styles.tabActive : ''} aria-pressed={active} onClick={onClick}>
      <span>{icon}</span><strong>{label}</strong>
    </button>
  );
}

async function loadCatalog(signal: AbortSignal): Promise<SearchGame[]> {
  const payloads = await Promise.all(CATEGORIES.map(async (category) => {
    const params = new URLSearchParams({ platform: 'mobile', category, page: '1', limit: '100' });
    const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
      signal,
      skipAuth: true,
      suppressSessionExpiryRedirect: true,
    });
    if (!response.ok) return null;
    return await response.json().catch(() => null) as CatalogPayload | null;
  }));

  const mapped = payloads.flatMap((payload) => readCatalogItems(payload).map(mapGame).filter((item): item is SearchGame => Boolean(item)));
  const deduped = Array.from(new Map(mapped.map((game) => [`${game.provider}:${game.id}`.toLowerCase(), game] as const)).values());
  return deduped.sort((left, right) => gameScore(right) - gameScore(left)).slice(0, 280);
}

function readCatalogItems(payload: CatalogPayload | null) {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === 'object' && Array.isArray(payload.data.items)) return payload.data.items;
  return [];
}

function mapGame(item: CatalogGame): SearchGame | null {
  const id = firstText(item.providerGameCode, item.code, item.id);
  const name = firstText(item.name);
  const sourceImage = firstText(item.imageUrl, item.iconUrl);
  if (!id || !name || !sourceImage) return null;
  if (item.rawPayload?.assetSource === 'generated-svg' || sourceImage.includes('/provider-simulator/icons/')) return null;

  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const provider = firstText(providerObject?.name, providerObject?.code, item.providerId, typeof item.provider === 'string' ? item.provider : null).toUpperCase();
  const sourceProviderIcon = firstText(item.providerLogoUrl, providerObject?.logoUrl);
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const hot = item.isPopular === true || item.isFeatured === true || tags.some((tag) => /hot|popular|ยอดนิยม/.test(tag));
  const fresh = item.isNew === true || tags.some((tag) => /new|ใหม่/.test(tag));

  return {
    id,
    name,
    provider,
    providerIcon: resolveMedia(sourceProviderIcon),
    image: resolveMedia(sourceImage),
    badge: hot ? 'HOT' : fresh ? 'NEW' : '',
    players: readPlayers(item),
    category: String(item.category ?? '').trim().toLowerCase(),
    createdAt: firstText(item.createdAt),
  };
}

function resolveMedia(source: string) {
  if (!source) return '';
  return resolveLocalAssetByBasename(source, 'mobile')
    || resolveLocalAssetByBasename(source, 'pc')
    || source;
}

function readPlayers(item: CatalogGame) {
  const value = Number(item.onlinePlayers ?? item.playerCount);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function gameScore(game: SearchGame) {
  const created = Date.parse(game.createdAt || '');
  return (game.badge === 'HOT' ? 1_000_000 : 0)
    + (game.badge === 'NEW' ? 100_000 : 0)
    + game.players
    + (Number.isFinite(created) ? Math.floor(created / 1_000_000_000) : 0);
}

function firstText(...values: unknown[]) {
  const value = values.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return typeof value === 'string' ? value.trim() : '';
}

function readStoredStrings(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
  } catch {
    return [];
  }
}

function writeStoredStrings(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Search remains usable when storage is unavailable.
  }
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" /></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M7.083.204C3.47.72.348 3.89.348 7.97c0 4.18 3.37 7.49 7.65 7.49a7.6 7.6 0 0 0 4.293-1.26l3.73 3.73 1.2-1.2-3.72-3.73a7.55 7.55 0 0 0 1.67-4.77C15.17 3.8 11.48-.43 7.083.204Zm.78 1.64a6.07 6.07 0 1 1 0 12.14 6.07 6.07 0 0 1 0-12.14Z" /></svg>;
}

function ClockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 9.95 11H20a8 8 0 1 1-2.34-5.66L15 10h7V3l-2.93 2.93A9.96 9.96 0 0 0 12 2Zm-1 5v6l5 3 1-1.73-4-2.27V7h-2Z" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 9 12" aria-hidden="true"><path d="M2.9.45A.44.44 0 0 1 3.34 0h2.32c.24 0 .44.2.44.45V.9h2.46c.24 0 .44.2.44.45s-.2.45-.44.45H.44A.44.44 0 0 1 0 1.35C0 1.1.2.9.44.9H2.9V.45Zm-1.74 2.97a.29.29 0 0 1 .28-.27h6.12c.15 0 .27.12.29.27l.11 1.08c.21 1.95.21 3.91 0 5.86l-.01.11a1.53 1.53 0 0 1-1.29 1.37c-1.43.21-2.88.21-4.32 0a1.53 1.53 0 0 1-1.29-1.37l-.01-.11a27.38 27.38 0 0 1 0-5.86l.12-1.08Z" /></svg>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 7 12" aria-hidden="true"><path d="M.7 11.3a1 1 0 0 1 0-1.4l2.49-2.49a2 2 0 0 0 0-2.82L.7 2.1a1 1 0 0 1 1.4-1.4l4.6 4.6a1 1 0 0 1 0 1.4l-4.6 4.6a1 1 0 0 1-1.4 0Z" /></svg>;
}
