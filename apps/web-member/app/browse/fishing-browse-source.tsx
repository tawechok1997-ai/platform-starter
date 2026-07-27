'use client';

import { useMemo, useState } from 'react';
import { useMemberSession } from '../member-session-provider';
import styles from './slot-browse-source.module.css';
import fishingStyles from './fishing-browse-source.module.css';

type FishingFilter = 'hot' | 'new' | 'slot';

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
  isNew?: boolean;
  isHot?: boolean;
  filters: readonly FishingFilter[];
};

const CATALOG_COUNT = 129;

const PROVIDERS: readonly FishingProvider[] = [
  { code: 'ygrfish', name: 'YGR', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/ygrfish.png' },
  { code: 'misoltfish', name: 'Miso', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/misoltfish.png' },
  { code: 'cqfish', name: 'CQ9', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/cqfish.png' },
  { code: 'fachaifish', name: 'Fa Chai', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/fachaifish.png' },
  { code: 'jlfish', name: 'JILI', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/jlfish.png' },
  { code: 'jkgx2fish', name: 'Joker', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/jkgx2fish.png' },
  { code: 'rsgfish', name: 'RSG', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/rsgfish.png' },
  { code: 'sppfish', name: 'SimplePlay', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/sppfish.png' },
  { code: 'spgfish', name: 'Spadegaming', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/spgfish.png' },
  { code: 'wmfish', name: 'WM', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/wmfish.png' },
  { code: 'kagafish', name: 'KA Gaming', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/kagafish.png' },
  { code: 'r88fish', name: 'Rich88', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/r88fish.png' },
  { code: 'fsfish', name: 'FastSpin', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/fsfish.png' },
  { code: 'askfish', name: 'AskMeSlot', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/askfish.png' },
  { code: 'acewinfish', name: 'AceWin', badge: 'https://cdn.zabbet.com/providers/set/1_1_badge/acewinfish.png' },
] as const;

const FILTERS: readonly { key: FishingFilter; label: string; count: number }[] = [
  { key: 'hot', label: 'เกมส์ฮิต', count: 9 },
  { key: 'new', label: 'เกมส์ใหม่', count: 14 },
  { key: 'slot', label: 'เกมส์สล็อต', count: 2 },
] as const;

const GAMES: readonly FishingGame[] = [
  {
    id: 'oneshot-fishing',
    name: 'Oneshot Fishing',
    image: 'https://cdn.zabbet.com/games/vertical/CQ/oneshot_fishing.jpg',
    provider: 'cqfish',
    isHot: true,
    filters: ['hot'],
  },
  {
    id: 'dinosaur-tycoon-ii',
    name: 'Dinosaur Tycoon II',
    image: 'https://cdn.zabbet.com/games/1682637746669-06e685fc-2939-442d-a6de-986b82d993be.jpg',
    provider: 'jlfish',
    isNew: true,
    filters: ['new'],
  },
  {
    id: 'fishing-treasure',
    name: 'Fishing Treasure',
    image: 'https://cdn.zabbet.com/games/1713425309332-8a03e24d-e1ed-4a91-b5da-ff40de7f52b5.png',
    provider: 'fsfish',
    isHot: true,
    filters: ['hot'],
  },
  {
    id: 'three-kingdoms-of-fishing',
    name: 'Three Kingdoms Of Fishing',
    image: 'https://cdn.zabbet.com/games/1686804932871-fe6bb3c4-e7ec-4a57-8bae-96089cb4a87f.jpeg',
    provider: 'wmfish',
    filters: [],
  },
  {
    id: 'ocean-emperor',
    name: 'Ocean Emperor',
    image: 'https://cdn.zabbet.com/games/1684333496065-b988dfd3-ddef-4287-834c-9b4843de1e54.jpg',
    provider: 'rsgfish',
    isHot: true,
    filters: ['hot'],
  },
  {
    id: 'zodiac-hunting',
    name: 'Zodiac Hunting',
    image: 'https://cdn.zabbet.com/games/1696500316419-c95c9300-087f-41a3-975b-7a38d56d2181.jpg',
    provider: 'kagafish',
    isNew: true,
    filters: ['new'],
  },
  {
    id: 'make-a-killing-fishing',
    name: 'Make a Killing Fishing',
    image: 'https://cdn.zabbet.com/games/1705570969344-791f4565-0201-4752-8c06-e0bd7db505b2.png',
    provider: 'ygrfish',
    isNew: true,
    filters: ['new'],
  },
  {
    id: 'dark-fishing',
    name: 'ตกปลาดารกะ',
    image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21008.jpg',
    provider: 'fachaifish',
    filters: [],
  },
  {
    id: 'dragon-boom',
    name: 'Dragon Boom',
    image: 'https://cdn.zabbet.com/games/1704678891483-1766acd5-e22d-4a14-b9d4-7c7e6619e61d.jpg',
    provider: 'kagafish',
    isNew: true,
    filters: ['new', 'slot'],
  },
  {
    id: 'fortune-fishing',
    name: 'Fortune Fishing',
    image: 'https://cdn.zabbet.com/games/1704871947762-276f8adb-b534-4ee5-bea7-dba0fcaa9e24.jpg',
    provider: 'ygrfish',
    isNew: true,
    filters: ['new'],
  },
  {
    id: 'honor-of-king',
    name: 'Honor of King',
    image: 'https://cdn.zabbet.com/games/1697176887116-101a6395-131e-4372-bde4-3d4af56c7fca.jpg',
    provider: 'wmfish',
    filters: [],
  },
  {
    id: 'divine-fishing',
    name: 'ตกปลามหาเทพ',
    image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21003.jpg',
    provider: 'fachaifish',
    filters: [],
  },
  {
    id: 'fishing-battle',
    name: 'ศึกเดือดตกปลา',
    image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21006.jpg',
    provider: 'fachaifish',
    filters: [],
  },
  {
    id: 'treasure-boat-fishing',
    name: 'ตกปลาเรือสมบัติ',
    image: 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21004.jpg',
    provider: 'fachaifish',
    filters: [],
  },
  {
    id: 'chill-fishing',
    name: 'Chill Fishing',
    image: 'https://cdn.zabbet.com/games/1697459171078-7bd5c126-34ba-493a-919a-f5d3d7f87851.jpg',
    provider: 'ygrfish',
    filters: [],
  },
  {
    id: 'insect-master',
    name: 'Insect Master',
    image: 'https://cdn.zabbet.com/games/1697460472114-3f89bfd3-2791-48e0-8867-d18cebf1fa1c.jpg',
    provider: 'ygrfish',
    filters: ['slot'],
  },
  {
    id: 'alien-hunter',
    name: 'Alien Hunter',
    image: 'https://cdn.zabbet.com/games/vertical/SPG/alien_hunter.png',
    provider: 'spgfish',
    filters: [],
  },
  {
    id: 'fishing-war',
    name: 'Fishing War',
    image: 'https://cdn.zabbet.com/games/vertical/SPG/fishing_war.png',
    provider: 'spgfish',
    isHot: true,
    filters: ['hot'],
  },
  {
    id: 'paradise',
    name: 'Paradise',
    image: 'https://cdn.zabbet.com/games/vertical/CQ/paradise.jpg',
    provider: 'cqfish',
    filters: [],
  },
  {
    id: 'teasure-of-pirate',
    name: 'Teasure of Pirate',
    image: 'https://cdn.zabbet.com/games/AskMeSlot/Fish/TOP.jpg',
    provider: 'askfish',
    filters: [],
  },
  {
    id: 'treasureland',
    name: 'Treasureland',
    image: 'https://cdn.zabbet.com/games/AskMeSlot/Fish/TREASURELAND.jpg',
    provider: 'askfish',
    filters: [],
  },
  {
    id: 'ghost-busters',
    name: 'Ghost Busters',
    image: 'https://cdn.zabbet.com/games/AskMeSlot/Fish/GHOSTBUSTER.jpg',
    provider: 'askfish',
    filters: [],
  },
  {
    id: 'fishermen-gold',
    name: 'FishermenGold',
    image: 'https://cdn.zabbet.com/games/vertical/SPP/simplay_ne.png',
    provider: 'sppfish',
    filters: [],
  },
  {
    id: 'rich-fishing',
    name: 'Rich Fishing',
    image: 'https://cdn.zabbet.com/games/1690996504480-9989cc58-a204-4485-921a-34663ad82864.png',
    provider: 'r88fish',
    filters: [],
  },
] as const;

export default function FishingBrowseSource() {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedFilters, setSelectedFilters] = useState<FishingFilter[]>([]);
  const [provider, setProvider] = useState('all');

  const visibleGames = useMemo(() => GAMES.filter((game) => {
    const matchesProvider = provider === 'all' || game.provider === provider;
    const matchesFilters = selectedFilters.length === 0 || selectedFilters.every((filter) => game.filters.includes(filter));
    return matchesProvider && matchesFilters;
  }), [provider, selectedFilters]);

  const isDefaultView = provider === 'all' && selectedFilters.length === 0;
  const displayCount = isDefaultView ? CATALOG_COUNT : visibleGames.length;

  const toggleFilter = (filter: FishingFilter) => {
    setSelectedFilters((current) => current.includes(filter)
      ? current.filter((item) => item !== filter)
      : [...current, filter]);
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    setProvider('all');
  };

  const openGame = () => {
    if (!ready || !isLoggedIn) {
      window.location.assign('/?auth=login&next=%2Fbrowse%2Fgames%3Fcategory%3Dfishing');
      return;
    }
    window.location.assign('/games');
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

        <div className={styles.layout}>
          <aside className={styles.filterPanel} aria-label="ตัวกรองเกมยิงปลา">
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle}>ตัวกรอง</div>

            <div className={styles.filterSectionTitle}>
              <strong>ค้นหาเกมที่คุณสนใจ</strong>
              <span>เลือกได้มากกว่าหนึ่ง</span>
            </div>

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
              <div><span>พบเกมส์ที่คุณค้นหา</span><strong>{displayCount} เกม</strong></div>
              <button type="button" onClick={clearFilters}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="รายการเกมยิงปลา">
            <h1>ยิงปลา ({displayCount} เกม)</h1>
            {visibleGames.length ? (
              <div className={styles.gameGrid}>
                {visibleGames.map((game) => {
                  const providerData = PROVIDERS.find((item) => item.code === game.provider);
                  return (
                    <article key={game.id} className={styles.gameCard}>
                      <button
                        type="button"
                        className={`${styles.gameCover} ${fishingStyles.gameCover}`}
                        onClick={openGame}
                        aria-label={`เล่น ${game.name}`}
                      >
                        <img className={fishingStyles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" />
                        <img className={fishingStyles.gameImageContain} src={game.image} alt={game.name} loading="lazy" />
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
