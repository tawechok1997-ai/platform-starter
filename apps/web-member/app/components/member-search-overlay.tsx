'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from './reference-asset-catalog';
import styles from './member-search-overlay.module.css';

type SearchTab = 'search' | 'recent' | 'favorite' | 'hot' | 'new';

type SearchGame = {
  id: string;
  name: string;
  url: string;
  providerName: string;
  providerUrl: string;
  isNew: boolean;
  isHot: boolean;
};

const SEARCH_HISTORY_KEY = 'member_game_search_history_v1';
const RECENT_GAMES_KEY = 'member_game_search_recent_v1';
const FAVORITES_KEY = 'member_public_browse_favorite_games_v1';

const SEARCH_GAMES: SearchGame[] = REFERENCE_GAMES.map((game, index) => {
  const provider = REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!;
  return {
    id: `reference-${index + 1}`,
    name: game.name,
    url: game.url,
    providerName: provider.name,
    providerUrl: provider.url,
    isNew: index < 7 || index % 5 === 0,
    isHot: index < 8 || index % 4 === 0,
  };
});

const TABS: Array<{ key: SearchTab; label: string }> = [
  { key: 'search', label: 'ค้นหา' },
  { key: 'recent', label: 'ล่าสุด' },
  { key: 'favorite', label: 'รายการโปรด' },
  { key: 'hot', label: 'เกมฮอต' },
  { key: 'new', label: 'เกมใหม่' },
];

export default function MemberSearchOverlay() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('search');
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  useEffect(() => {
    const interceptSearchButton = (event: MouseEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('[aria-label="ค้นหาเกม"]')
        : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      setActiveTab('search');
    };

    document.addEventListener('click', interceptSearchButton, true);
    return () => document.removeEventListener('click', interceptSearchButton, true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setHistory(readStoredList(SEARCH_HISTORY_KEY));
    setRecentIds(readStoredList(RECENT_GAMES_KEY));
    setFavoriteIds(readStoredList(FAVORITES_KEY));

    const focusFrame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const matchingGames = useMemo(() => {
    const favoriteSet = new Set(favoriteIds);
    const recentPosition = new Map(recentIds.map((id, index) => [id, index]));
    let games = SEARCH_GAMES;

    if (activeTab === 'recent') {
      games = SEARCH_GAMES
        .filter((game) => recentPosition.has(game.id))
        .sort((left, right) => (recentPosition.get(left.id) ?? 999) - (recentPosition.get(right.id) ?? 999));
    } else if (activeTab === 'favorite') {
      games = SEARCH_GAMES.filter((game) => favoriteSet.has(game.id));
    } else if (activeTab === 'hot') {
      games = SEARCH_GAMES.filter((game) => game.isHot);
    } else if (activeTab === 'new') {
      games = SEARCH_GAMES.filter((game) => game.isNew);
    }

    if (!deferredQuery) return games;
    return games.filter((game) => (
      game.name.toLocaleLowerCase().includes(deferredQuery)
      || game.providerName.toLocaleLowerCase().includes(deferredQuery)
    ));
  }, [activeTab, deferredQuery, favoriteIds, recentIds]);

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

  const openGame = (game: SearchGame) => {
    rememberQuery();
    const nextRecent = [game.id, ...recentIds.filter((id) => id !== game.id)].slice(0, 16);
    setRecentIds(nextRecent);
    writeStoredList(RECENT_GAMES_KEY, nextRecent);
    window.location.assign('/browse/games');
  };

  const clearHistory = () => {
    setHistory([]);
    writeStoredList(SEARCH_HISTORY_KEY, []);
  };

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-search-title">
        <div className={styles.topLine} aria-hidden="true" />

        <header className={styles.header}>
          <h2 id="member-search-title">ค้นหา</h2>
          <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="ปิดหน้าค้นหา">
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
              />
              <button type="submit" aria-label="ค้นหา"><SearchIcon /></button>
            </form>

            {activeTab === 'search' ? (
              <section className={styles.historyPanel} aria-label="ประวัติการค้นหา">
                <div className={styles.historyHeading}>
                  <strong>ประวัติการค้นหา</strong>
                  <button type="button" onClick={clearHistory}><TrashIcon /><span>ล้าง</span></button>
                </div>
                {history.length ? (
                  <div className={styles.historyItems}>
                    {history.map((item) => (
                      <button key={item} type="button" onClick={() => setQuery(item)}>{item}</button>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {activeTab === 'search' ? (
              <>
                <SearchSection title="เกมใหม่" onViewAll={() => setActiveTab('new')}>
                  <div className={styles.newGrid}>
                    {newGames.map((game) => <PortraitGameCard key={game.id} game={game} onOpen={openGame} />)}
                  </div>
                </SearchSection>

                <SearchSection title="เกมฮิต" onViewAll={() => setActiveTab('hot')}>
                  <div className={styles.hotGrid}>
                    {hotGames.map((game) => <LandscapeGameCard key={game.id} game={game} onOpen={openGame} />)}
                  </div>
                </SearchSection>
              </>
            ) : (
              <SearchSection title={TABS.find((tab) => tab.key === activeTab)?.label ?? 'เกม'}>
                {matchingGames.length ? (
                  <div className={styles.resultGrid}>
                    {matchingGames.map((game) => <PortraitGameCard key={game.id} game={game} onOpen={openGame} />)}
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

function SearchSection({ title, onViewAll, children }: {
  title: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <strong>{title}</strong>
        {onViewAll ? <button type="button" onClick={onViewAll}>ดูทั้งหมด <ChevronRight /></button> : null}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function PortraitGameCard({ game, onOpen }: { game: SearchGame; onOpen: (game: SearchGame) => void }) {
  return (
    <button type="button" className={styles.portraitCard} onClick={() => onOpen(game)} aria-label={`เปิดเกม ${game.name}`}>
      <span className={styles.portraitImage}>
        <img className={styles.blurImage} src={game.url} alt="" aria-hidden="true" />
        <img className={styles.containImage} src={game.url} alt={game.name} />
        <span className={styles.providerBadge}><img src={game.providerUrl} alt={game.providerName} /></span>
        {game.isNew ? <span className={styles.newBadge}><SparkIcon />NEW</span> : null}
      </span>
      <span className={styles.cardName}>{game.name}</span>
    </button>
  );
}

function LandscapeGameCard({ game, onOpen }: { game: SearchGame; onOpen: (game: SearchGame) => void }) {
  return (
    <button type="button" className={styles.landscapeCard} onClick={() => onOpen(game)} aria-label={`เปิดเกมฮอต ${game.name}`}>
      <img src={game.url} alt={game.name} />
      {game.isHot ? <span className={styles.hotBadge}><FlameIcon />HOT</span> : null}
      <span>{game.name}</span>
    </button>
  );
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
