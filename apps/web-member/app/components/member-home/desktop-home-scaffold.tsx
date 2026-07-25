'use client';

import type { SyntheticEvent } from 'react';
import type { CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';
import {
  REFERENCE_GAMES,
  REFERENCE_HOME_ASSETS,
  REFERENCE_PROVIDERS,
} from '../reference-asset-catalog';
import { DesktopHeroCarousel } from './desktop-hero-carousel';
import { V47_ASSETS } from './v47-asset-map';
import styles from './desktop-home-v47-source.module.css';

type DesktopGameSections = {
  featured: Game[];
  popular: Game[];
  recent: Game[];
  favorites: Game[];
};

type DesktopHomeProps = {
  content: CmsContent;
  icons: SiteIconSettings;
  siteName: string;
  showPromotion: boolean;
  games: DesktopGameSections;
  isGamesLoading: boolean;
  gamesMessage: string;
};

type VisualGame = {
  id: string;
  name: string;
  imageUrl: string;
  fallbackUrl: string;
  provider: string;
};

const TOURNAMENT_BANNER = 'https://cdn.zabbet.com/ZAB1/tournament/647280b5-3a23-4118-80a0-1b7feb340d1a.png';
const QUICK_CARDS = [
  {
    title: 'โปรโมชั่นพิเศษ',
    subtitle: 'โปรโมชั่นพิเศษเฉพาะคุณ',
    href: '/promotions',
    image: '/clone-assets/shortcut-promo.webp',
  },
  {
    title: 'กิจกรรม',
    subtitle: 'กิจกรรมตลอด 24 ชั่วโมง',
    href: '/promotions',
    image: '/clone-assets/shortcut-event.webp',
  },
  {
    title: 'ข่าวสาร',
    subtitle: 'ข่าวสารที่คุณไม่ควรพลาด',
    href: '/notifications',
    image: '/clone-assets/shortcut-news.webp',
  },
] as const;

const MATCH_CARDS = [
  { league: 'ฟุตบอล · พรีเมียร์ลีก', time: 'LIVE', home: 'ทีมเหย้า', away: 'ทีมเยือน' },
  { league: 'ฟุตบอลนานาชาติ', time: '18:00', home: 'เจ้าบ้าน', away: 'ทีมเยือน' },
  { league: 'ลีกยอดนิยม', time: '20:30', home: 'ทีม A', away: 'ทีม B' },
] as const;

const LEADERS = ['GameJackpot', 'Treasure Mouse', 'BIG & BIG', 'Lucky', 'Player Win'] as const;
const RANK_ART = [V47_ASSETS.rank1, V47_ASSETS.rank2, V47_ASSETS.rank3] as const;

export function DesktopHomeScaffold({
  content,
  icons,
  siteName,
  showPromotion,
  games,
  isGamesLoading,
  gamesMessage,
}: DesktopHomeProps) {
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const visualGames = buildVisualGames(allGames);
  const featured = visualGames.slice(0, 9);
  const online = visualGames.slice(9, 14);
  const classic = visualGames.slice(14, 20);
  const faqs = Array.isArray(content.faqs) && content.faqs.some((faq) => faq.enabled)
    ? content.faqs.filter((faq) => faq.enabled).slice(0, 5)
    : fallbackFaqs();
  const providers = uniqueProviders(allGames);
  const announcement = content.announcements?.find((item) => item.enabled);

  return (
    <section className={styles.root} aria-label="หน้าแรกเดสก์ท็อป NOAH345">
      <DesktopHeroCarousel content={content} siteName={siteName} showPromotion={showPromotion} />

      <div className={styles.body}>
        <main className={styles.main}>
          <div className={styles.announcement}>
            <img src={V47_ASSETS.announcement} alt="" onError={hideBrokenImage} />
            <span>{announcement?.message || announcement?.title || 'ยินดีต้อนรับสู่ NOAH345 โปรโมชั่น กิจกรรม และเกมใหม่อัปเดตตลอด 24 ชั่วโมง'}</span>
          </div>

          <section className={styles.quickGrid} aria-label="เมนูลัด">
            {QUICK_CARDS.map((card) => (
              <a key={card.title} href={card.href} className={styles.quickCard}>
                <img src={card.image} alt="" onError={hideBrokenImage} />
                <span>
                  <strong>{card.title}</strong>
                  <small>{card.subtitle}</small>
                </span>
              </a>
            ))}
          </section>

          <a className={styles.tournamentBanner} href="/promotions">
            <img src={TOURNAMENT_BANNER} alt="เข้าร่วมแข่งขัน Tournament" onError={(event) => swapBrokenImage(event, V47_ASSETS.tournament)} />
          </a>

          <section className={styles.panel}>
            <SectionHeading icon={V47_ASSETS.tournamentIcon} title="ทัวร์นาเมนต์" />
            <div className={styles.tournamentTitle}>
              <strong>No.1 Tournament Football Royale ครั้งที่ 2</strong>
              <a className={styles.goldButton} href="/promotions">ดูทั้งหมด ›</a>
            </div>
            <div className={styles.rankTrack} data-drag-scroll="true">
              {Array.from({ length: 8 }, (_, index) => (
                <article key={index} className={styles.rankCard}>
                  <span className={styles.rankBadge}>
                    {RANK_ART[index] ? <img src={RANK_ART[index]} alt={`อันดับ ${index + 1}`} onError={hideBrokenImage} /> : index + 1}
                  </span>
                  <b>{maskedPlayer(index)}</b>
                  <strong>{[20, 17, 13, 11, 9, 8, 6, 5][index]}</strong>
                  <span className={styles.formDots} aria-hidden="true"><i /><i /><i /><i /><i /></span>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <SectionHeading icon={V47_ASSETS.star} title="เกมไฮไลต์" />
            <div className={styles.featureGrid}>
              <VisualGameCard game={featured[0]!} className={styles.featureLarge} />
              <div className={styles.featureSmallGrid} data-drag-scroll="true">
                {featured.slice(1).map((game) => <VisualGameCard key={game.id} game={game} className={styles.gameTile} />)}
              </div>
            </div>
            {isGamesLoading ? <p className={styles.gameLabel}>กำลังโหลดข้อมูลเกม...</p> : null}
            {!isGamesLoading && gamesMessage ? <span hidden>{gamesMessage}</span> : null}
          </section>

          <section className={styles.numberSection}>
            <SectionHeading icon={V47_ASSETS.gameHit} title="Top 10 Popular Games" />
            <div className={styles.numberRow} data-drag-scroll="true">
              {Array.from({ length: 7 }, (_, index) => <span key={index} className={styles.numberCard}>{index + 1}</span>)}
            </div>
          </section>

          <section className={styles.gameSection}>
            <SectionHeading icon={V47_ASSETS.mostOnline} title="Most Online Now" />
            <div className={`${styles.horizontal}`} data-drag-scroll="true">
              {online.map((game, index) => (
                <a key={game.id} href="/login?next=%2Fgames" className={styles.onlineCard}>
                  <SafeImage game={game} />
                  <span className={styles.onlineMeta}><b>{game.name}</b><small>♟ {(4274 - index * 437).toLocaleString()}</small></span>
                </a>
              ))}
            </div>
          </section>

          <section className={styles.gameSection} id="live">
            <SectionHeading icon={V47_ASSETS.liveIcon} title="Live Now!!" />
            <div className={styles.liveRow} data-drag-scroll="true">
              {MATCH_CARDS.map((match) => (
                <article key={`${match.league}-${match.time}`} className={styles.liveCard}>
                  <header><span>{match.league}</span><b>{match.time}</b></header>
                  <div className={styles.liveTeams}><strong>{match.home}</strong><span>VS</span><strong>{match.away}</strong></div>
                  <footer><a href="/login">ดูบอลสด</a><a href="/login">เดิมพันทันที</a></footer>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.gameSection}>
            <SectionHeading icon={V47_ASSETS.gameHit} title="Classic Games" />
            <div className={styles.classicRow} data-drag-scroll="true">
              {classic.map((game) => (
                <a key={game.id} href="/login?next=%2Fgames" className={styles.classicCard}>
                  <SafeImage game={game} />
                  <span className={styles.gameLabel}>{game.name}</span>
                </a>
              ))}
            </div>
          </section>

          <section className={styles.guide} id="guide">
            <SectionHeading icon={V47_ASSETS.miniGame} title="Guide" />
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
            <a className={styles.guideMore} href="/guide">ดูทั้งหมด</a>
          </section>

          <section className={styles.providers}>
            <h2>พันธมิตรของเรา</h2>
            <div className={styles.providerRow} data-drag-scroll="true">
              {providers.length > 0
                ? providers.slice(0, 12).map((provider, index) => {
                    const fallback = REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!;
                    return <img key={`${provider.code}-${index}`} src={provider.logoUrl || fallback.url} alt={provider.name || provider.code || fallback.name} onError={(event) => swapBrokenImage(event, fallback.url)} />;
                  })
                : REFERENCE_PROVIDERS.map((provider) => <img key={provider.name} src={provider.url} alt={provider.name} onError={hideBrokenImage} />)}
            </div>
          </section>
        </main>

        <aside className={styles.rail} aria-label="รางวัลและอันดับ">
          <section className={styles.sideCard}>
            <SideHeading icon={V47_ASSETS.jackpotStill} title="Jackpot" />
            <div className={styles.jackpotBody}>
              <img src={REFERENCE_HOME_ASSETS.jackpot} alt="Jackpot" onError={(event) => swapBrokenImage(event, REFERENCE_HOME_ASSETS.jackpotStill)} />
              <strong className={styles.jackpotNumber}>195,574,797</strong>
            </div>
          </section>

          <section className={styles.sideCard}>
            <SideHeading icon={V47_ASSETS.leaderboard} title="Leaderboard" />
            <div className={styles.leaderList}>
              {LEADERS.map((name, index) => (
                <div className={styles.leaderItem} key={name}>
                  <span className={styles.leaderRank}>{index + 1}</span>
                  <span><strong>{name}</strong><small>ชนะล่าสุด</small></span>
                  <em>›</em>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sideCard}>
            <SideHeading icon={V47_ASSETS.miniGame} title="Mini Game" />
            <div className={styles.miniGrid}>
              <a href="/login"><img src={V47_ASSETS.miniGameWheel} alt="" onError={hideBrokenImage} /><span>วงล้อ</span></a>
              <a href="/login"><img src={V47_ASSETS.miniGameMission} alt="" onError={hideBrokenImage} /><span>ทายการ์ด</span></a>
            </div>
          </section>

          {isImageValue(icons.affiliate) ? <img src={icons.affiliate} alt="" hidden /> : null}
        </aside>
      </div>
    </section>
  );
}

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return <header className={styles.heading}><img src={icon} alt="" onError={hideBrokenImage} /><strong>{title}</strong></header>;
}

function SideHeading({ icon, title }: { icon: string; title: string }) {
  return <header className={styles.sideHeading}><img src={icon} alt="" onError={hideBrokenImage} /><strong>{title}</strong></header>;
}

function VisualGameCard({ game, className }: { game: VisualGame; className: string }) {
  return <a href="/login?next=%2Fgames" className={className}><SafeImage game={game} /><span className={styles.gameLabel}>{game.name}</span></a>;
}

function SafeImage({ game }: { game: VisualGame }) {
  return <img src={game.imageUrl} alt={game.name} loading="lazy" onError={(event) => swapBrokenImage(event, game.fallbackUrl)} />;
}

function buildVisualGames(apiGames: Game[]) {
  return REFERENCE_GAMES.map((fallback, index): VisualGame => {
    const game = apiGames[index];
    return {
      id: game?.id || `reference-${index + 1}`,
      name: safeGameName(game) || fallback.name,
      imageUrl: resolveGameImage(game) || fallback.url,
      fallbackUrl: fallback.url,
      provider: game?.provider?.name || game?.provider?.code || 'NOAH345',
    };
  });
}

function uniqueGames(...groups: Game[][]) {
  const map = new Map<string, Game>();
  groups.flat().forEach((game) => {
    const key = game?.id || `${game?.providerGameCode || ''}:${game?.name || ''}`;
    if (key && !map.has(key)) map.set(key, game);
  });
  return Array.from(map.values());
}

function uniqueProviders(games: Game[]) {
  const map = new Map<string, NonNullable<Game['provider']>>();
  games.forEach((game) => {
    const provider = game?.provider;
    const key = provider?.code || provider?.name;
    if (key && provider && !map.has(key)) map.set(key, provider);
  });
  return Array.from(map.values());
}

function resolveGameImage(game?: Game) {
  if (!game) return '';
  const direct = game.imageUrl || game.iconUrl;
  if (direct) return normalizeUrl(direct);
  const media = Array.isArray(game.media) ? game.media : [];
  const value = media.find((item) => item?.cachedUrl)?.cachedUrl || media.find((item) => item?.sourceUrl)?.sourceUrl || '';
  return value ? normalizeUrl(value) : '';
}

function safeGameName(game?: Game) {
  return typeof game?.name === 'string' && game.name.trim() ? game.name : '';
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('/') ? value : `/${value.replace(/^\.\//, '')}`;
}

function maskedPlayer(index: number) {
  return ['ZAXXXKU70974020', 'ZAXXXM66410017', 'ZAXXXR44017413', 'ZAXXXM154', 'ZAXXXS413', 'ZAXXXXB25', 'ZAXXXJ11', 'ZAXXXP90'][index] || `PLAYER${index + 1}`;
}

function fallbackFaqs() {
  return [
    { question: 'ฝากเงินแบบ โอนผ่านธนาคาร', answer: 'เลือกธนาคารที่ต้องการและทำตามขั้นตอนบนหน้าฝากเงิน' },
    { question: 'ฝากเงินแบบ โอนผ่าน QR Payment', answer: 'สแกน QR และตรวจสอบยอดเงินก่อนยืนยันรายการ' },
    { question: 'ฝากเงินแบบ ฝากจากตู้เติม', answer: 'เลือกช่องทางที่ระบบรองรับและตรวจสอบข้อมูลก่อนยืนยัน' },
    { question: 'วิธีการฝากแบบ TrueWallet', answer: 'กรอกข้อมูลให้ครบและรอระบบตรวจสอบรายการ' },
    { question: 'ยอดไม่เข้าทันที ทำยังไงดี?', answer: 'ติดต่อฝ่ายบริการพร้อมหลักฐานการทำรายการ' },
  ];
}

function isImageValue(value: string) {
  return /^(https?:\/\/|\/|\.\/)/i.test(value) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value);
}

function swapBrokenImage(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  if (!fallback || event.currentTarget.dataset.fallbackApplied === 'true') {
    hideBrokenImage(event);
    return;
  }
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = fallback;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
