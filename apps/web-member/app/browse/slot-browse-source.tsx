'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useMemberSession } from '../member-session-provider';
import styles from './slot-browse-source.module.css';

type SlotFilter = 'arcade' | 'buy' | 'hot' | 'new' | 'slot' | 'table';

type SlotProvider = {
  code: string;
  name: string;
  badge: string;
};

type SlotGame = {
  id: string;
  name: string;
  image: string;
  provider: string;
  isNew?: boolean;
  isHot?: boolean;
  filters: readonly SlotFilter[];
};

const PROVIDERS: readonly SlotProvider[] = [
  { code: 'ygr', name: 'YGR', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/ygr.png' },
  { code: 'hotdog', name: 'Hotdog', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/hotdog.png' },
  { code: 'misolt', name: 'Miso', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/misolt.png' },
  { code: 'jl', name: 'JILI', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/jl.png' },
  { code: 'pp', name: 'Pragmatic Play', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/pp.png' },
  { code: 'kingm', name: 'Kingmaker', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png' },
  { code: 'spg', name: 'Spadegaming', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/spg.png' },
  { code: 'jkgx2', name: 'Joker', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/jkgx2.png' },
  { code: 'fachai', name: 'Fa Chai', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/fachai.png' },
  { code: 'ps', name: 'PlayStar', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/ps.png' },
] as const;

const FILTERS: readonly { key: SlotFilter; label: string; count: number }[] = [
  { key: 'arcade', label: 'เกมส์อาเขต', count: 182 },
  { key: 'buy', label: 'ซื้อฟรีสปิน', count: 900 },
  { key: 'hot', label: 'เกมส์ฮิต', count: 546 },
  { key: 'new', label: 'เกมส์ใหม่', count: 552 },
  { key: 'slot', label: 'เกมส์สล็อต', count: 3694 },
  { key: 'table', label: 'เกมส์โต๊ะ', count: 233 },
] as const;

const GAMES: readonly SlotGame[] = [
  {
    id: 'zombie-school-megaways',
    name: 'Zombie School Megaways',
    image: 'https://cdn.zabbet.com/games/1757650724319-9f1935c2-d269-48ae-965e-f8472a9e7c5e.jpeg',
    provider: 'pp',
    isNew: true,
    isHot: true,
    filters: ['slot', 'new', 'hot', 'buy'],
  },
  {
    id: 'roma-x-10000',
    name: 'ROMA X 10000',
    image: 'https://cdn.zabbet.com/games/1755656755936-62320722-2f7a-4710-9e52-f598c9406a93.jpeg',
    provider: 'jl',
    isNew: true,
    filters: ['slot', 'new', 'buy'],
  },
  {
    id: 'plinko-football',
    name: 'Plinko Football',
    image: 'https://cdn.zabbet.com/games/1783919751423-0171bb2f-3e3a-4618-918a-fef286748951.png',
    provider: 'jl',
    isNew: true,
    filters: ['arcade', 'new'],
  },
  {
    id: 'super-ace-speed',
    name: 'Super Ace SPEED',
    image: 'https://cdn.zabbet.com/games/1783919777728-d48fc6b7-d78b-42a8-b2a1-a9fca3dc8d93.png',
    provider: 'jl',
    isNew: true,
    isHot: true,
    filters: ['slot', 'new', 'hot'],
  },
  {
    id: 'cash-balloon',
    name: 'Cash Balloon',
    image: 'https://cdn.zabbet.com/games/1783919805598-8148f505-675a-46fa-937d-b74df7706af8.png',
    provider: 'jl',
    isNew: true,
    filters: ['arcade', 'slot', 'new'],
  },
  {
    id: 'storm-of-seth-2',
    name: 'Storm of Seth 2',
    image: 'https://cdn.zabbet.com/games/1783919870658-d1be7b9a-4fad-44b6-9cf0-7626e8694aa3.png',
    provider: 'jl',
    isNew: true,
    filters: ['slot', 'new', 'buy'],
  },
  {
    id: 'deng-deng',
    name: 'Deng Deng',
    image: 'https://cdn.zabbet.com/games/1783920115048-cb545fef-c4fb-40c6-a482-33fc44f4f9bd.png',
    provider: 'ps',
    isNew: true,
    filters: ['slot', 'new'],
  },
  {
    id: 'lucky-ace-2',
    name: 'LUCKY ACE 2',
    image: 'https://cdn.zabbet.com/games/1783920142586-2ab56135-59b8-408e-95f0-4eb5b0ee79f9.png',
    provider: 'ps',
    isNew: true,
    isHot: true,
    filters: ['slot', 'new', 'hot'],
  },
  {
    id: 'zeus-of-olympus',
    name: 'ZEUS OF OLYMPUS',
    image: 'https://cdn.zabbet.com/games/1783920164770-1530964e-a378-4234-9808-1e061b723ba1.png',
    provider: 'ps',
    isHot: true,
    filters: ['slot', 'hot', 'buy'],
  },
  {
    id: 'super-gems-2',
    name: 'SUPER GEMS 2',
    image: 'https://cdn.zabbet.com/games/1783920187645-14fd3911-3b5d-49e1-9b78-1a7229cee769.png',
    provider: 'ps',
    isNew: true,
    filters: ['slot', 'new', 'table'],
  },
] as const;

export default function SlotBrowseSource() {
  const { ready, isLoggedIn } = useMemberSession();
  const [query, setQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<SlotFilter[]>([]);
  const [provider, setProvider] = useState('all');
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());

  const visibleGames = useMemo(() => GAMES.filter((game) => {
    const matchesQuery = !deferredQuery || game.name.toLocaleLowerCase().includes(deferredQuery);
    const matchesProvider = provider === 'all' || game.provider === provider;
    const matchesFilters = selectedFilters.length === 0 || selectedFilters.every((filter) => game.filters.includes(filter));
    return matchesQuery && matchesProvider && matchesFilters;
  }), [deferredQuery, provider, selectedFilters]);

  const toggleFilter = (filter: SlotFilter) => {
    setSelectedFilters((current) => current.includes(filter)
      ? current.filter((item) => item !== filter)
      : [...current, filter]);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedFilters([]);
    setProvider('all');
  };

  const openGame = () => {
    if (!ready || !isLoggedIn) {
      window.location.assign('/?auth=login&next=%2Fbrowse%2Fgames%3Fcategory%3Dslot');
      return;
    }
    window.location.assign('/games');
  };

  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true" />
      <div className={styles.purpleWash} aria-hidden="true" />
      <div className={styles.bottomFade} aria-hidden="true" />

      <section className={styles.content} aria-label="สล็อต">
        <header className={styles.heroTitle}>
          <img src="/assets/asset-pc/images/game/slot/logo_slot.webp" alt="สล็อต" />
        </header>

        <div className={styles.layout}>
          <aside className={styles.filterPanel} aria-label="ตัวกรองเกมสล็อต">
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle}>ตัวกรอง</div>

            <div className={styles.filterSectionTitle}>
              <strong>ค้นหาเกมที่คุณสนใจ</strong>
              <span>เลือกได้มากกว่าหนึ่ง</span>
            </div>

            <label className={styles.searchBox}>
              <span aria-hidden="true">⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อเกม" />
            </label>

            <div className={styles.typeGrid}>
              {FILTERS.map((filter) => {
                const checked = selectedFilters.includes(filter.key);
                return (
                  <label key={filter.key} className={styles.filterOption}>
                    <input type="checkbox" checked={checked} onChange={() => toggleFilter(filter.key)} />
                    <span className={`${styles.checkbox}${checked ? ` ${styles.checkboxActive}` : ''}`} aria-hidden="true">{checked ? '✓' : ''}</span>
                    <span className={styles.filterLabel}>{filter.label}</span>
                    <small>( {filter.count} )</small>
                  </label>
                );
              })}
            </div>

            <div className={styles.filterSectionTitle}>
              <strong>ค้นหาค่ายเกม</strong>
              <span>เลือกอย่างใดอย่างหนึ่ง</span>
            </div>

            <div className={styles.providerGrid}>
              {PROVIDERS.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  className={`${styles.providerButton}${provider === item.code ? ` ${styles.providerActive}` : ''}`}
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

          <section className={styles.gameArea} aria-label="รายการเกมสล็อต">
            <h1>สล็อต ({visibleGames.length} เกม)</h1>
            {visibleGames.length ? (
              <div className={styles.gameGrid}>
                {visibleGames.map((game) => {
                  const providerData = PROVIDERS.find((item) => item.code === game.provider);
                  return (
                    <article key={game.id} className={styles.gameCard}>
                      <button type="button" className={styles.gameCover} onClick={openGame} aria-label={`เล่น ${game.name}`}>
                        <img className={styles.gameImage} src={game.image} alt={game.name} loading="lazy" />
                        <span className={styles.cardBadges} aria-hidden="true">
                          {game.isNew ? <b className={styles.newBadge}>NEW</b> : null}
                          {game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}
                        </span>
                        {providerData ? <img className={styles.cardProvider} src={providerData.badge} alt="" aria-hidden="true" /> : null}
                        <span className={styles.playOverlay}><b>เล่นเกม</b></span>
                      </button>
                      <p>{game.name}</p>
                    </article>
                  );
                })}
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
