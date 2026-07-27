'use client';

import { useMemberSession } from '../member-session-provider';
import cardStyles from './card-browse-source.module.css';
import styles from './slot-browse-source.module.css';

type CardGame = {
  id: string;
  name: string;
  image: string;
  isNew?: boolean;
  isHot?: boolean;
};

const CATALOG_COUNT = 123;
const PROVIDER_BADGE = 'https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png';

const CARD_GAMES: readonly CardGame[] = [
  {
    id: 'burmese-6-animals',
    name: 'Burmese 6 Animals',
    image: 'https://cdn.zabbet.com/games/1762491448874-7fcaf6e3-1b1c-4e81-a3ca-9f4ebeb6c5b5.png',
    isNew: true,
  },
  {
    id: 'hunk-cai-shen',
    name: 'Hunk Cai Shen',
    image: 'https://cdn.zabbet.com/games/1762491483123-8f8674b7-bbbf-4d96-8ea1-cf134f0abfa2.png',
    isNew: true,
  },
  {
    id: 'dear-senpai',
    name: 'Dear Senpai',
    image: 'https://cdn.zabbet.com/games/1762491587805-9b47d8a1-5f56-4aeb-82b6-b43ebfc6fa17.png',
    isNew: true,
  },
  {
    id: 'speedy-andar-bahar',
    name: 'Speedy Andar Bahar',
    image: 'https://cdn.zabbet.com/games/1762491531292-03189bfe-5299-450c-a7d9-f0b712f1cd21.png',
    isNew: true,
  },
  {
    id: 'mahjong-beauty',
    name: 'Mahjong Beauty',
    image: 'https://cdn.zabbet.com/games/1762769398184-e0ba7c5e-7624-4f5a-a292-da7cf4d19371.png',
    isNew: true,
  },
  {
    id: 'samba-rhapsody',
    name: 'Samba Rhapsody',
    image: 'https://cdn.zabbet.com/games/1762769441287-b80b505d-3ea9-481a-a39e-c0b7f4782017.png',
    isNew: true,
  },
  {
    id: 'lucky-cat-gala',
    name: 'Lucky Cat Gala',
    image: 'https://cdn.zabbet.com/games/1762769473201-6724712a-eff8-4c39-9c48-7c61dd4f139a.png',
    isNew: true,
  },
  {
    id: 'bai-cao-mystic-four',
    name: 'Bai Cao Mystic Four',
    image: 'https://cdn.zabbet.com/games/1762769508631-208094ee-1009-4012-807c-855c9574e7d5.png',
    isNew: true,
  },
  {
    id: 'teen-patti-versus',
    name: 'Teen Patti Versus',
    image: 'https://cdn.zabbet.com/games/1762769550040-405a633c-9c6c-4366-b59d-45597c9a96fd.png',
    isNew: true,
  },
  {
    id: 'vietnam-rock-paper-scissors',
    name: 'Vietnam Rock Paper Scissors',
    image: 'https://cdn.zabbet.com/games/1762769584860-3d843a64-2af6-4fd4-ab94-74a79512c194.png',
    isNew: true,
  },
  {
    id: 'thai-hi-lo-2',
    name: 'ไฮโลไทย 2',
    image: 'https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg',
    isHot: true,
  },
  {
    id: 'vietnam-fish-prawn-crab',
    name: 'เวียดนามน้ำเต้าปูปลา',
    image: 'https://cdn.zabbet.com/games/KM/TH/Thai_Fish_Prawn_Crab.jpg',
    isHot: true,
  },
] as const;

export default function CardBrowseSource() {
  const { ready, isLoggedIn } = useMemberSession();

  const openGame = () => {
    if (!ready || !isLoggedIn) {
      window.location.assign('/?auth=login&next=%2Fbrowse%2Fgames%3Fcategory%3Dcard');
      return;
    }
    window.location.assign('/games');
  };

  return (
    <main className={styles.page}>
      <div className={`${styles.background} ${cardStyles.background}`} aria-hidden="true" />
      <div className={styles.purpleWash} aria-hidden="true" />
      <div className={styles.bottomFade} aria-hidden="true" />

      <section className={styles.content} aria-label="ไพ่">
        <header className={styles.heroTitle}>
          <img src="/assets/asset-pc/images/game/card/logo_card.webp" alt="ไพ่" />
        </header>

        <div className={styles.layout}>
          <aside className={styles.filterPanel} aria-label="ตัวกรองเกมไพ่">
            <div className={styles.filterGlow} aria-hidden="true" />
            <div className={styles.filterTitle}>ตัวกรอง</div>

            <div className={cardStyles.collapsedFilterHeading} aria-hidden="true">
              <strong>ค้นหาเกมที่คุณสนใจ</strong>
              <span>เลือกได้มากกว่าหนึ่ง</span>
            </div>
            <div className={cardStyles.collapsedFilterSpace} aria-hidden="true" />

            <div className={styles.filterSectionTitle}>
              <strong>ค้นหาค่ายเกม</strong>
              <span>เลือกอย่างใดอย่างหนึ่ง</span>
            </div>
            <div className={cardStyles.emptyProviderSpace} aria-hidden="true" />

            <div className={styles.filterSummary}>
              <div><span>พบเกมส์ที่คุณค้นหา</span><strong>{CATALOG_COUNT} เกม</strong></div>
              <button type="button">ล้าง</button>
            </div>
          </aside>

          <section className={styles.gameArea} aria-label="รายการเกมไพ่">
            <h1>ไพ่ ({CATALOG_COUNT} เกม)</h1>
            <div className={styles.gameGrid}>
              {CARD_GAMES.map((game) => (
                <article key={game.id} className={styles.gameCard}>
                  <button
                    type="button"
                    className={`${styles.gameCover} ${cardStyles.gameCover}`}
                    onClick={openGame}
                    aria-label={`เล่น ${game.name}`}
                  >
                    <img className={cardStyles.gameImageBlur} src={game.image} alt="" aria-hidden="true" loading="lazy" />
                    <img className={cardStyles.gameImageContain} src={game.image} alt={game.name} loading="lazy" />
                    <span className={styles.cardBadges} aria-hidden="true">
                      {game.isNew ? <b className={styles.newBadge}>NEW</b> : null}
                      {game.isHot ? <b className={styles.hotBadge}>HOT</b> : null}
                    </span>
                    <img className={styles.cardProvider} src={PROVIDER_BADGE} alt="" aria-hidden="true" />
                    <span className={styles.playOverlay}><b>เล่นเกม</b></span>
                  </button>
                  <p>{game.name}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
