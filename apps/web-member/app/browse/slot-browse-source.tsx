'use client';

import { useMemo, useState, type SyntheticEvent } from 'react';
import { useMemberSession } from '../member-session-provider';
import styles from './slot-browse-source.module.css';

type SlotFilter = 'arcade' | 'buy' | 'hot' | 'new' | 'slot' | 'table';

type SlotProvider = {
  code: string;
  name: string;
  badge: string;
  background: string;
  title: string;
  avatar: string;
};

type SlotGame = {
  id: string;
  name: string;
  image: string;
  provider: string;
  filters: readonly SlotFilter[];
  isNew: boolean;
  isHot: boolean;
};

const SOURCE_TOTAL_GAMES = 5094;

const PROVIDER_CODES = ['ygr', 'hotdog', 'misolt', 'jl', 'pp', 'kingm', 'spg', 'jkgx2', 'fachai', 'rsg', 'pgsoft', 'kaga', 'hacksaw', 'cq', 'redtiger', 'hbn', 'wmslot', 'evp', 'netent', 'ps', 'pokslot', 'edp', 'spp', 'ame', 'bng', 'r88', 'cala', 'glx', 'l22', 'reg', 'ygg', 'fs', 'pgsus', 'n2', 'ap', 'amb', 'ask', 'nlc', 'vp', 'drag', 'acewin', 'rb7slot'] as const;

const PROVIDERS: readonly SlotProvider[] = PROVIDER_CODES.map((code) => ({
  code,
  name: code.toUpperCase(),
  badge: `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,
  background: `https://cdn.zabbet.com/providers/set/1_1_bg/${code}.png`,
  title: `https://cdn.zabbet.com/providers/set/1_1_title/${code}.png`,
  avatar: `https://cdn.zabbet.com/providers/set/1_1_avatar/${code}.png`,
}));

const FILTERS: readonly { key: SlotFilter; label: string; count: number }[] = [
  { key: 'arcade', label: 'เกมส์อาเขต', count: 182 },
  { key: 'buy', label: 'ซื้อฟรีสปิน', count: 900 },
  { key: 'hot', label: 'เกมส์ฮิต', count: 546 },
  { key: 'new', label: 'เกมส์ใหม่', count: 552 },
  { key: 'slot', label: 'เกมส์สล็อต', count: 3694 },
  { key: 'table', label: 'เกมส์โต๊ะ', count: 233 },
];

const SOURCE_GAME_ROWS = [
  ['50s PinUp', 'https://cdn.zabbet.com/games/1686811201754-2f9fc978-07ee-43a7-9436-70d1d8589a4b.jpeg', 'wmslot'],
  ['The King of Dinosaurs', 'https://cdn.zabbet.com/games/ka_gaming/TRex.jpg', 'kaga'],
  ['Legend of Dragons', 'https://cdn.zabbet.com/games/ka_gaming/DragonsLegend.jpg', 'kaga'],
  ['Dragon four knives', 'https://cdn.zabbet.com/games/1691001919291-e0632abc-0c3a-4115-a801-092f69e2b84a.jpg', 'r88'],
  ['10X Rewind', 'https://cdn.zabbet.com/games/ygg/880138.jpg', 'ygg'],
  ['jalapeno', 'https://cdn.zabbet.com/games/Pegasus/290080.jpg', 'pgsus'],
  ['Super Stars', 'https://cdn.zabbet.com/games/1672859429069-a9973e5e-0044-42ff-88d9-ecfa50b0c080.jpg', 'jkgx2'],
  ["Rabbit's Riches", 'https://cdn.zabbet.com/games/DRAG/1239.jpg', 'drag'],
  ['Nuwa', 'https://cdn.zabbet.com/games/1673187068008-574a0012-98ad-45e7-b134-10b3bd7e3f84.jpg', 'hbn'],
  ['Sweet POP', 'https://cdn.zabbet.com/games/vertical/CQ/sweet_pop.jpg', 'cq'],
  ['Brutal Santa', 'https://cdn.zabbet.com/games/vertical/EVP/brutal_santa.jpg', 'evp'],
  ['Lucky Clovers', 'https://cdn.zabbet.com/games/1672485700759-768a8aca-c504-4959-8f87-aa166bd76215.png', 'spp'],
  ["Druids' Dream", 'https://cdn.zabbet.com/games/1672957168136-c7a1ce60-f4bc-4069-b646-da11f0006431.jpg', 'netent'],
  ['Well of Wilds Megaways', 'https://cdn.zabbet.com/games/vertical/REDTIGER/well_of_wilds_megaways.png', 'redtiger'],
  ['Muay Thai Champion', 'https://cdn.zabbet.com/games/1684318688539-cc1d6727-fbe3-44d0-8b63-0de12d5fb029.jpg', 'pgsoft'],
  ['Viking Legend', 'https://cdn.zabbet.com/games/1686811103781-d6ba4597-d295-4622-889e-e64a91561cee.jpeg', 'wmslot'],
  ['Muay Thai', 'https://cdn.zabbet.com/games/ka_gaming/MuayThai.jpg', 'kaga'],
  ['Double Fortune', 'https://cdn.zabbet.com/games/ka_gaming/DoubleFortune.jpg', 'kaga'],
  ['Wild Fire Ranger', 'https://cdn.zabbet.com/games/1691001365897-9c82bea9-0c15-480e-b1d0-bb2535bf7c27.jpg', 'r88'],
  ['Fortune cat', 'https://cdn.zabbet.com/games/Pegasus/290081.jpg', 'pgsus'],
  ['Supreme Caishen', 'https://cdn.zabbet.com/games/1672859395322-e3d8f324-fe81-4196-abcb-e277d721033e.jpg', 'jkgx2'],
  ['Project Space', 'https://cdn.zabbet.com/games/DRAG/1226.jpg', 'drag'],
  ["Pirate's Plunder", 'https://cdn.zabbet.com/games/1673186493332-c5789ef7-42fe-4c2f-8d7f-bef335e8abdb.jpg', 'hbn'],
  ['EggOMatic', 'https://cdn.zabbet.com/games/1672957197531-2e1385f0-d016-48a1-9cee-df0849a6eef3.jpg', 'netent'],
  ['Well Of Wishes', 'https://cdn.zabbet.com/games/vertical/REDTIGER/well_of_wishes.png', 'redtiger'],
  ['Dragon Tiger Luck', 'https://cdn.zabbet.com/games/pgslot/vertical/dragon_tiger_luck.jpg', 'pgsoft'],
  ['Gentleman Thief', 'https://cdn.zabbet.com/games/1686811866845-4521ee1c-a742-4a4f-9ec3-9f3ac3288e6e.jpeg', 'wmslot'],
  ["Flaming 7's", 'https://cdn.zabbet.com/games/ka_gaming/Flaming7.jpg', 'kaga'],
  ['Sky Journey', 'https://cdn.zabbet.com/games/ka_gaming/SkyJourney.jpg', 'kaga'],
  ['FAN TAN', 'https://cdn.zabbet.com/games/1691002297804-c0f3d6af-d47d-41c5-ba96-b9b2d38665e1.jpg', 'r88'],
] as const;

const GAMES: readonly SlotGame[] = SOURCE_GAME_ROWS.map(([name, image, provider], index) => {
  const filters: SlotFilter[] = ['slot'];
  if (index % 5 === 0) filters.push('arcade');
  if (index % 4 === 0) filters.push('buy');
  if (index % 3 === 0) filters.push('hot');
  if (index % 2 === 0) filters.push('new');
  if (index % 7 === 0) filters.push('table');
  return {
    id: `${index + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
    name,
    image,
    provider,
    filters,
    isNew: filters.includes('new'),
    isHot: filters.includes('hot'),
  };
});

export default function SlotBrowseSource() {
  const { ready, isLoggedIn } = useMemberSession();
  const [selectedFilters, setSelectedFilters] = useState<SlotFilter[]>([]);
  const [provider, setProvider] = useState('all');

  const activeProvider = useMemo(
    () => PROVIDERS.find((item) => item.code === provider) ?? null,
    [provider],
  );

  const visibleGames = useMemo(() => GAMES.filter((game) => {
    const matchesProvider = provider === 'all' || game.provider === provider;
    const matchesFilters = selectedFilters.length === 0
      || selectedFilters.every((filter) => game.filters.includes(filter));
    return matchesProvider && matchesFilters;
  }), [provider, selectedFilters]);

  const resultCount = provider === 'all' && selectedFilters.length === 0
    ? SOURCE_TOTAL_GAMES
    : visibleGames.length;

  const toggleFilter = (filter: SlotFilter) => {
    setSelectedFilters((current) => current.includes(filter)
      ? current.filter((item) => item !== filter)
      : [...current, filter]);
  };

  const selectProvider = (code: string) => {
    setProvider((current) => current === code ? 'all' : code);
  };

  const clearFilters = () => {
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
      <div className={styles.backgroundStack} aria-hidden="true">
        <img
          key={activeProvider?.code ?? 'default'}
          className={styles.backgroundImage}
          src={activeProvider?.background ?? '/assets/asset-pc/images/game/slot/bg_slot.webp'}
          alt=""
          onError={hideBrokenImage}
        />
        <div className={styles.purpleWash} />
        <div className={styles.bottomFade} />
      </div>

      <section className={styles.content} aria-label="สล็อต">
        <header className={styles.heroTitle}>
          <img
            className={`${styles.defaultTitle}${activeProvider ? ` ${styles.hiddenTitle}` : ''}`}
            src="/assets/asset-pc/images/game/slot/logo_slot.webp"
            alt="สล็อต"
          />
          {activeProvider ? (
            <>
              <img
                key={`${activeProvider.code}-title`}
                className={styles.providerTitle}
                src={activeProvider.title}
                alt={activeProvider.name}
                onError={hideBrokenImage}
              />
              <img
                key={`${activeProvider.code}-avatar`}
                className={styles.providerAvatar}
                src={activeProvider.avatar}
                alt=""
                aria-hidden="true"
                onError={hideBrokenImage}
              />
            </>
          ) : null}
        </header>

        <div className={styles.layout}>
          <aside className={styles.filterPanel} aria-label="ตัวกรองเกมสล็อต">
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
                    <span className={`${styles.checkbox}${checked ? ` ${styles.checkboxActive}` : ''}`} aria-hidden="true">
                      {checked ? '✓' : ''}
                    </span>
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
                  onClick={() => selectProvider(item.code)}
                  aria-pressed={provider === item.code}
                  title={item.name}
                >
                  <span aria-hidden="true" />
                  <img src={item.badge} alt={item.name} loading="lazy" onError={hideBrokenImage} />
                </button>
              ))}
            </div>

            <div className={styles.filterSummary}>
              <div><span>พบเกมส์ที่คุณค้นหา</span><strong>{resultCount.toLocaleString('th-TH')} เกม</strong></div>
              <button type="button" onClick={clearFilters}>ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="รายการเกมสล็อต">
            <h1>สล็อต ({resultCount.toLocaleString('th-TH')} เกม)</h1>
            {visibleGames.length ? (
              <div className={styles.gameGrid}>
                {visibleGames.map((game) => {
                  const providerData = PROVIDERS.find((item) => item.code === game.provider);
                  return (
                    <article key={game.id} className={styles.gameCard}>
                      <button type="button" className={styles.gameCover} onClick={openGame} aria-label={`เล่น ${game.name}`}>
                        <img className={styles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" onError={hideBrokenImage} />
                        <img className={styles.gameImage} src={game.image} alt={game.name} loading="lazy" onError={hideBrokenImage} />
                        <span className={styles.cardBadges} aria-hidden="true">
                          {game.isNew ? <b className={styles.newBadge}>NEW</b> : null}
                          {game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}
                        </span>
                        {providerData ? (
                          <span className={styles.cardProviderBand} aria-hidden="true">
                            <img src={providerData.badge} alt="" onError={hideBrokenImage} />
                          </span>
                        ) : null}
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

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
