'use client';

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { memberApiFetch } from '../member-api';
import { useMemberSession } from '../member-session-provider';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from './reference-asset-catalog';
import styles from './member-search-overlay.module.css';

type SearchTab = 'search' | 'recent' | 'favorite' | 'hot' | 'new';

type SearchGame = {
  id: string;
  providerGameCode: string;
  name: string;
  imageUrl: string;
  providerName: string;
  providerCode: string;
  providerUrl: string;
  category: string;
  isNew: boolean;
  isHot: boolean;
  launchReady: boolean;
};

type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  name?: string | null;
  category?: string | null;
  status?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  isNew?: boolean | null;
  isPopular?: boolean | null;
  metadata?: { launchReady?: boolean | null } | null;
  provider?: {
    name?: string | null;
    code?: string | null;
    logoUrl?: string | null;
  } | null;
  media?: Array<{
    sourceUrl?: string | null;
    cachedUrl?: string | null;
  }> | null;
};

type CatalogPayload = {
  items?: CatalogGame[] | null;
};

type LaunchPayload = {
  ok?: boolean;
  launchUrl?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  message?: string | null;
};

const SEARCH_HISTORY_KEY = 'member_game_search_history_v1';
const RECENT_GAMES_KEY = 'member_game_search_recent_v1';
const FAVORITES_KEY = 'member_public_browse_favorite_games_v1';
const SEARCH_TRIGGER_SELECTOR = '[aria-label="ค้นหาเกม"], [aria-label="Search games"]';
const CATALOG_ROUTE = '/games/catalog?platform=pc&page=1&limit=250';

const FALLBACK_SEARCH_GAMES: SearchGame[] = REFERENCE_GAMES.map((game, index) => {
  const provider = REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!;
  return {
    id: `reference-${index + 1}`,
    providerGameCode: `reference-${index + 1}`,
    name: game.name,
    imageUrl: game.url,
    providerName: provider.name,
    providerCode: normalizeProviderCode(provider.name),
    providerUrl: provider.url,
    category: 'slot',
    isNew: index < 7 || index % 5 === 0,
    isHot: index < 8 || index % 4 === 0,
    launchReady: false,
  };
});

const TABS: Array<{ key: SearchTab; label: string }> = [
  { key: 'search', label: 'ค้นหา' },
  { key: 'recent', label: 'ล่าสุด' },
  { key: 'favorite', label: 'รายการโปรด' },
  { key: 'hot', label: 'เกมฮอต' },
  { key: 'new', label: 'เกมใหม่' },
];

let catalogRequest: Promise<SearchGame[]> | null = null;

export default function MemberSearchOverlay() {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('search');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [games, setGames] = useState<SearchGame[]>(FALLBACK_SEARCH_GAMES);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState('');
  const [launchingGameId, setLaunchingGameId] = useState('');
  const [launchMessage, setLaunchMessage] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase('th'));

  useEffect(() => {
    const interceptSearchButton = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(SEARCH_TRIGGER_SELECTOR)
        : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      setActiveTab('search');
      setLaunchMessage('');
    };

    document.addEventListener('click', interceptSearchButton, true);
    return () => document.removeEventListener('click', interceptSearchButton, true);
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setHistory(readStoredList(SEARCH_HISTORY_KEY));
    setRecentIds(readStoredList(RECENT_GAMES_KEY));
    setFavoriteIds(readStoredList(FAVORITES_KEY));
    setCatalogLoading(true);
    setCatalogMessage('');

    void getCatalogGames()
      .then((items) => {
        if (cancelled) return;
        setGames(items);
        if (items === FALLBACK_SEARCH_GAMES) setCatalogMessage('กำลังใช้รายการเกมสำรอง');
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    const focusFrame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !launchingGameId) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [launchingGameId, open]);

  const matchingGames = useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    const recentPosition = new Map(recentIds.map((id, index) => [id, index]));
    let visibleGames = games;

    if (activeTab === 'recent') {
      visibleGames = games
        .filter((game) => recentPosition.has(game.id))
        .sort((left, right) => (recentPosition.get(left.id) ?? 999) - (recentPosition.get(right.id) ?? 999));
    } else if (activeTab === 'favorite') {
      visibleGames = games.filter((game) => favoriteSet.has(game.id));
    } else if (activeTab === 'hot') {
      visibleGames = games.filter((game) => game.isHot);
    } else if (activeTab === 'new') {
      visibleGames = games.filter((game) => game.isNew);
    }

    if (!deferredQuery) return visibleGames;
    return visibleGames.filter((game) => (
      game.name.toLocaleLowerCase('th').includes(deferredQuery)
      || game.providerName.toLocaleLowerCase('th').includes(deferredQuery)
      || game.providerGameCode.toLocaleLowerCase('th').includes(deferredQuery)
    ));
  }, [activeTab, deferredQuery, favoriteIds, games, recentIds]);

  const newGames = useMemo(
    () => matchingGames.filter((game) => game.isNew).slice(0, 7),
    [matchingGames],
  );
  const hotGames = useMemo(
    () => matchingGames.filter((game) => game.isHot).slice(0, 8),
    [matchingGames],
  );

  if (!open) return null;

  const rememberQuery = () => {
    const value = query.trim();
    if (!value) return;
    const next = [value, ...history.filter((item) => item !== value)].slice(0, 8);
    setHistory(next);
    writeStoredList(SEARCH_HISTORY_KEY, next);
  };

  const rememberGame = (game: SearchGame) => {
    const nextRecent = [game.id, ...recentIds.filter((id) => id !== game.id)].slice(0, 16);
    setRecentIds(nextRecent);
    writeStoredList(RECENT_GAMES_KEY, nextRecent);
  };

  const openGame = async (game: SearchGame) => {
    if (launchingGameId || !ready) return;

    rememberQuery();
    rememberGame(game);
    setLaunchMessage('');

    const browseDestination = gameBrowseDestination(game);
    if (!isLoggedIn) {
      setOpen(false);
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('auth', 'login');
      currentUrl.searchParams.set('next', browseDestination);
      router.replace(`${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`, { scroll: false });
      return;
    }

    if (!game.launchReady) {
      setOpen(false);
      router.push(browseDestination);
      return;
    }

    setLaunchingGameId(game.id);
    try {
      const response = await memberApiFetch(`/member/games/${encodeURIComponent(game.id)}/launch`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => null) as LaunchPayload | null;
      if (!response.ok || !payload?.ok || !payload.launchUrl) {
        throw new Error(payload?.errorMessage || payload?.message || 'ไม่สามารถเปิดเกมนี้ได้');
      }

      const launchUrl = new URL(payload.launchUrl, window.location.origin);
      if (launchUrl.protocol !== 'https:' && launchUrl.protocol !== 'http:') {
        throw new Error('ลิงก์เปิดเกมไม่ถูกต้อง');
      }

      window.location.assign(launchUrl.toString());
    } catch (error) {
      setLaunchMessage(error instanceof Error ? error.message : 'ไม่สามารถเปิดเกมนี้ได้');
      setLaunchingGameId('');
    }
  };

  const clearHistory = () => {
    setHistory([]);
    writeStoredList(SEARCH_HISTORY_KEY, []);
  };

  const interactionLocked = Boolean(launchingGameId);

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !interactionLocked) setOpen(false);
    }}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-search-title"
        aria-busy={catalogLoading || interactionLocked}
      >
        <div className={styles.topLine} aria-hidden="true" />

        <header className={styles.header}>
          <h2 id="member-search-title">ค้นหา</h2>
          <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="ปิดหน้าค้นหา" disabled={interactionLocked}>
            <img src="/assets/asset-pc/images/close.svg" alt="" aria-hidden="true" />
          </button>
        </header>

        <div className={styles.scrollBody}>
          <nav className={styles.tabs} aria-label="ตัวกรองค้นหาเกม">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                disabled={interactionLocked}
              >
                <span className={styles.tabIcon} aria-hidden="true"><TabIcon tab={tab.key} /></span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className={styles.content}>
            <form className={styles.searchForm} onSubmit={(event) => {
              event.preventDefault();
              rememberQuery();
            }}>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value.slice(0, 80))}
                placeholder="พิมพ์เกมที่คุณค้นหา"
                maxLength={80}
                aria-label="พิมพ์เกมที่คุณค้นหา"
                disabled={interactionLocked}
              />
              <button type="submit" aria-label="ค้นหา" disabled={interactionLocked}><SearchIcon /></button>
            </form>

            {catalogLoading ? <div className={styles.emptyState}>กำลังโหลดรายการเกม...</div> : null}
            {!catalogLoading && catalogMessage ? <div className={styles.emptyState}>{catalogMessage}</div> : null}
            {launchMessage ? <div className={styles.emptyState} role="alert">{launchMessage}</div> : null}
            {interactionLocked ? <div className={styles.emptyState} role="status">กำลังเปิดเกม...</div> : null}

            {activeTab === 'search' ? (
              <section className={styles.historyPanel} aria-label="ประวัติการค้นหา">
                <div className={styles.historyHeading}>
                  <strong>ประวัติการค้นหา</strong>
                  <button type="button" onClick={clearHistory} disabled={interactionLocked}><TrashIcon /><span>ล้าง</span></button>
                </div>
                {history.length ? (
                  <div className={styles.historyItems}>
                    {history.map((item) => (
                      <button key={item} type="button" onClick={() => setQuery(item)} disabled={interactionLocked}>{item}</button>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {activeTab === 'search' ? (
              <>
                <SearchSection title="เกมใหม่" onViewAll={() => setActiveTab('new')} disabled={interactionLocked}>
                  <div className={styles.newGrid}>
                    {newGames.map((game) => (
                      <PortraitGameCard key={game.id} game={game} onOpen={openGame} disabled={interactionLocked} />
                    ))}
                  </div>
                </SearchSection>

                <SearchSection title="เกมฮิต" onViewAll={() => setActiveTab('hot')} disabled={interactionLocked}>
                  <div className={styles.hotGrid}>
                    {hotGames.map((game) => (
                      <LandscapeGameCard key={game.id} game={game} onOpen={openGame} disabled={interactionLocked} />
                    ))}
                  </div>
                </SearchSection>
              </>
            ) : (
              <SearchSection title={TABS.find((tab) => tab.key === activeTab)?.label ?? 'เกม'}>
                {matchingGames.length ? (
                  <div className={styles.resultGrid}>
                    {matchingGames.map((game) => (
                      <PortraitGameCard key={game.id} game={game} onOpen={openGame} disabled={interactionLocked} />
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>ยังไม่มีรายการในหมวดนี้</div>
                )}
              </SearchSection>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SearchSection({ title, onViewAll, disabled = false, children }: {
  title: string;
  onViewAll?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <strong>{title}</strong>
        {onViewAll ? <button type="button" onClick={onViewAll} disabled={disabled}>ดูทั้งหมด <ChevronRight /></button> : null}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function PortraitGameCard({ game, onOpen, disabled }: {
  game: SearchGame;
  onOpen: (game: SearchGame) => void;
  disabled: boolean;
}) {
  return (
    <button type="button" className={styles.portraitCard} onClick={() => onOpen(game)} aria-label={`เปิดเกม ${game.name}`} disabled={disabled}>
      <span className={styles.portraitImage}>
        <img className={styles.blurImage} src={game.imageUrl} alt="" aria-hidden="true" />
        <img className={styles.containImage} src={game.imageUrl} alt={game.name} />
        {game.providerUrl ? <span className={styles.providerBadge}><img src={game.providerUrl} alt={game.providerName} /></span> : null}
        {game.isNew ? <span className={styles.newBadge}><SparkIcon />NEW</span> : null}
      </span>
      <span className={styles.cardName}>{game.name}</span>
    </button>
  );
}

function LandscapeGameCard({ game, onOpen, disabled }: {
  game: SearchGame;
  onOpen: (game: SearchGame) => void;
  disabled: boolean;
}) {
  return (
    <button type="button" className={styles.landscapeCard} onClick={() => onOpen(game)} aria-label={`เปิดเกมฮอต ${game.name}`} disabled={disabled}>
      <img src={game.imageUrl} alt={game.name} />
      {game.isHot ? <span className={styles.hotBadge}><FlameIcon />HOT</span> : null}
      <span>{game.name}</span>
    </button>
  );
}

async function getCatalogGames() {
  if (!catalogRequest) catalogRequest = loadCatalogGames();
  return catalogRequest;
}

async function loadCatalogGames(): Promise<SearchGame[]> {
  try {
    const response = await memberApiFetch(CATALOG_ROUTE, {
      skipAuth: true,
      suppressSessionExpiryRedirect: true,
    });
    if (!response.ok) throw new Error(`catalog ${response.status}`);

    const payload = await response.json().catch(() => null) as CatalogPayload | null;
    const items = Array.isArray(payload?.items)
      ? payload.items.map(mapCatalogGame).filter((item): item is SearchGame => Boolean(item))
      : [];
    return items.length ? items : FALLBACK_SEARCH_GAMES;
  } catch {
    catalogRequest = null;
    return FALLBACK_SEARCH_GAMES;
  }
}

function mapCatalogGame(item: CatalogGame): SearchGame | null {
  const id = firstText(item.id);
  const providerGameCode = firstText(item.providerGameCode, id);
  const name = firstText(item.name);
  const imageUrl = firstText(
    item.imageUrl,
    item.iconUrl,
    item.media?.find((media) => media.cachedUrl)?.cachedUrl,
    item.media?.find((media) => media.sourceUrl)?.sourceUrl,
  );
  if (!id || !providerGameCode || !name || !imageUrl) return null;

  const providerName = firstText(item.provider?.name, item.provider?.code, 'Unknown');
  const providerCode = normalizeProviderCode(firstText(item.provider?.code, providerName));
  const catalogOnly = item.status === 'CATALOG_ONLY' || id.startsWith('catalog:');

  return {
    id,
    providerGameCode,
    name,
    imageUrl,
    providerName,
    providerCode,
    providerUrl: firstText(item.provider?.logoUrl),
    category: normalizeCategory(item.category),
    isNew: item.isNew === true,
    isHot: item.isPopular === true,
    launchReady: !catalogOnly && item.metadata?.launchReady !== false,
  };
}

function gameBrowseDestination(game: SearchGame) {
  const params = new URLSearchParams();
  if (game.category) params.set('category', game.category);
  if (game.providerCode) params.set('provider', game.providerCode);
  const queryString = params.toString();
  return `/browse/games${queryString ? `?${queryString}` : ''}`;
}

function normalizeCategory(value?: string | null) {
  const category = String(value ?? 'slot').trim().toLowerCase();
  if (category === 'fish') return 'fishing';
  if (category === 'sports') return 'sport';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  return category || 'slot';
}

function normalizeProviderCode(value: string) {
  return value.trim().toLowerCase().replace(/\.png$/i, '').replace(/[^a-z0-9_-]+/g, '');
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function TabIcon({ tab }: { tab: SearchTab }) {
  if (tab === 'search') return <SearchIcon />;
  if (tab === 'recent') return <ClockIcon />;
  if (tab === 'favorite') return <StarIcon />;
  if (tab === 'hot') return <FlameIcon />;
  return <SparkIcon />;
}

function SearchIcon() {
  return <svg viewBox="0 0 17 17" fill="none"><path d="M7.1 1.05a6.05 6.05 0 1 0 4.38 10.22l4.38 4.38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="7.1" cy="7.1" r="5.9" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function ClockIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7.5v5l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function StarIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>;
}
function FlameIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M13.6 3.4c.6 3-1.2 4.2-2.5 5.7-1.1 1.3-1.8 2.5-1.3 4.3.4-1.2 1.3-2 2.2-2.8 1 1.1 2.3 2.5 2.3 4.4 0 2.4-1.8 4-4.4 4-3 0-5.4-2.2-5.4-5.6 0-4.1 3.2-6.5 5.9-9.4.1 1.9.5 3 1.3 3.8.6-1.1 1.3-2.4 1.9-4.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
function SparkIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M12 3.2c.9 4 2.8 5.9 6.8 6.8-4 .9-5.9 2.8-6.8 6.8-.9-4-2.8-5.9-6.8-6.8 4-.9 5.9-2.8 6.8-6.8Z" fill="currentColor" /><path d="M18.2 15.5c.35 1.55 1.1 2.3 2.65 2.65-1.55.35-2.3 1.1-2.65 2.65-.35-1.55-1.1-2.3-2.65-2.65 1.55-.35 2.3-1.1 2.65-2.65Z" fill="currentColor" /></svg>;
}
function TrashIcon() {
  return <svg viewBox="0 0 16 16" fill="none"><path d="M6.23 2.49c0-.27.21-.49.48-.49h2.58c.27 0 .48.22.48.49v.49h2.75a.49.49 0 0 1 0 .97H3.48a.49.49 0 0 1 0-.97h2.75v-.49Z" fill="currentColor" /><path d="M4.28 5.7a.32.32 0 0 1 .32-.29h6.8c.16 0 .3.13.32.29l.13 1.17a29 29 0 0 1 0 6.36l-.02.11a1.69 1.69 0 0 1-1.43 1.49c-1.6.22-3.21.22-4.8 0a1.69 1.69 0 0 1-1.43-1.49l-.01-.11a29 29 0 0 1 0-6.36l.12-1.17Zm2.91 2.25a.48.48 0 1 0-.96 0v4.55a.48.48 0 1 0 .96 0V7.95Zm2.58 0a.48.48 0 1 0-.96 0v4.55a.48.48 0 1 0 .96 0V7.95Z" fill="currentColor" /></svg>;
}
function ChevronRight() {
  return <svg viewBox="0 0 8 13" fill="none"><path d="m1 1 5.2 5.5L1 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function readStoredList(key: string): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStoredList(key: string, value: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is optional; the search overlay still works without persistence.
  }
}
