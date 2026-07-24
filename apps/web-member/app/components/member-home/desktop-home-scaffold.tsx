'use client';

import type { SyntheticEvent } from 'react';
import type { CmsContent } from '../../site-settings';
import type { Game } from '../../types/member-api';

type DesktopGameSections = {
  featured: Game[];
  popular: Game[];
  recent: Game[];
  favorites: Game[];
};

type DesktopHomeProps = {
  content: CmsContent;
  siteName: string;
  showPromotion: boolean;
  games: DesktopGameSections;
  isGamesLoading: boolean;
  gamesMessage: string;
};

const PROMO_CARDS = [
  { icon: '✦', title: 'โปรโมชั่นพิเศษ', subtitle: 'โปรโมชั่นใหม่เฉพาะคุณ', href: '/promotions' },
  { icon: '♤', title: 'กิจกรรม', subtitle: 'กิจกรรมตลอด 24 ชั่วโมง', href: '/promotions' },
  { icon: '◇', title: 'ข่าวสาร', subtitle: 'ข่าวสารที่คุณไม่ควรพลาด', href: '/notifications' },
];

const MATCH_CARDS = [
  { time: 'LIVE', league: 'พรีเมียร์ลีก', home: 'ทีมเหย้า', away: 'ทีมเยือน' },
  { time: '18:00', league: 'ฟุตบอลนานาชาติ', home: 'เจ้าบ้าน', away: 'ทีมเยือน' },
  { time: '20:30', league: 'ลีกยอดนิยม', home: 'ทีม A', away: 'ทีม B' },
];

export function DesktopHomeScaffold({ content, siteName, showPromotion, games, isGamesLoading, gamesMessage }: DesktopHomeProps) {
  const banners = Array.isArray(content?.banners) ? content.banners.filter((banner) => banner?.enabled) : [];
  const faqs = Array.isArray(content?.faqs) ? content.faqs.filter((faq) => faq?.enabled).slice(0, 5) : [];
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const featured = fillGames(games.featured, allGames, 9);
  const popular = fillGames(games.popular, allGames, 7);
  const online = fillGames(allGames.slice(3), allGames, 5);
  const classic = fillGames(allGames.slice(8), allGames, 6);
  const providers = uniqueProviders(allGames).slice(0, 12);
  const heroPrimary = banners[0];
  const heroPeek = banners[1] ?? banners[0];
  const rewardBanner = banners[2] ?? banners[1] ?? banners[0];

  return (
    <section className="desktop-home desktop-reference-home" aria-label="หน้าแรกเดสก์ท็อป">
      <div className="desktop-home__main reference-main-column">
        <section className="reference-hero-row" aria-label="โปรโมชั่นแนะนำ">
          <BannerCard banner={heroPeek} siteName={siteName} className="reference-hero-peek" showImage={showPromotion} />
          <BannerCard banner={heroPrimary} siteName={siteName} className="reference-hero-main" showImage={showPromotion} />
        </section>

        <div className="reference-carousel-dots" aria-hidden="true"><i /><i className="active" /><i /><i /></div>

        <section className="reference-promo-row" aria-label="โปรโมชั่น กิจกรรม และข่าวสาร">
          {PROMO_CARDS.map((card, index) => (
            <a key={card.title} href={card.href} className={`reference-promo-card reference-promo-card--${index + 1}`}>
              <span className="reference-promo-icon" aria-hidden="true">{card.icon}</span>
              <span><strong>{card.title}</strong><small>{card.subtitle}</small></span>
            </a>
          ))}
        </section>

        <a href="/promotions" className="reference-tournament-cta">
          <span className="reference-tournament-mark">V</span>
          <span><small>TOURNAMENT</small><strong>เข้าร่วมชิงความเป็นที่ 1</strong></span>
          <b>เข้าแข่งขัน ›</b>
        </a>

        <section className="reference-panel reference-tournament-board">
          <PanelHeading icon="🏆" title="ทัวร์นาเมนต์" />
          <div className="reference-tournament-title"><strong>No.1 Tournament Football Royale ครั้งที่ 2</strong><a href="/promotions">ดูทั้งหมด ›</a></div>
          <div className="reference-tournament-track">
            {Array.from({ length: 8 }, (_, index) => (
              <article key={index} className="reference-rank-card">
                <b>{index + 1}</b>
                <strong>{maskName(index)}</strong>
                <span>{20 - index * 2}</span>
                <small>● ● ● ● ●</small>
              </article>
            ))}
          </div>
          <div className="reference-panel-dots" aria-hidden="true"><i className="active" /><i /><i /></div>
        </section>

        <section className="reference-panel reference-featured-section">
          <PanelHeading icon="★" title="เกมไฮไลต์" />
          {isGamesLoading ? <EmptyState label="กำลังโหลดเกมจาก API..." /> : featured.length ? (
            <div className="reference-featured-grid">
              <GameTile game={featured[0]!} large />
              <div className="reference-featured-small-grid">
                {featured.slice(1, 9).map((game) => <GameTile key={game.id} game={game} />)}
              </div>
            </div>
          ) : <EmptyState label={gamesMessage || 'ยังไม่มีข้อมูลเกม'} />}
        </section>

        <section className="reference-number-section">
          <PanelHeading icon="🔥" title="Top 10 Popular Games" />
          <div className="reference-number-row">
            {popular.map((game, index) => (
              <a key={`${game.id}-${index}`} href="/login?next=%2Fgames" className="reference-number-card" title={safeGameName(game)}>
                <span>{index + 1}</span>
                <strong>{safeGameName(game)}</strong>
              </a>
            ))}
          </div>
        </section>

        <section className="reference-compact-section">
          <PanelHeading icon="⚡" title="Most Online Now" />
          <div className="reference-online-row">
            {online.map((game, index) => (
              <a key={`${game.id}-${index}`} href="/login?next=%2Fgames" className="reference-online-card">
                <GameImage game={game} />
                <span><strong>{safeGameName(game)}</strong><small>♟ {(4274 - index * 437).toLocaleString()}</small></span>
              </a>
            ))}
          </div>
        </section>

        <section className="reference-compact-section">
          <PanelHeading icon="🔴" title="Live Now!!" />
          <div className="reference-live-row">
            {MATCH_CARDS.map((match, index) => (
              <article key={`${match.league}-${index}`} className="reference-live-card">
                <header><span>{match.league}</span><b>{match.time}</b></header>
                <div><strong>{match.home}</strong><span>VS</span><strong>{match.away}</strong></div>
                <footer><a href="/login">ดูบอลสด</a><a href="/login">เล่นเกมทันที</a></footer>
              </article>
            ))}
          </div>
        </section>

        <section className="reference-compact-section">
          <PanelHeading icon="💧" title="Classic Games" />
          <div className="reference-classic-row">
            {classic.map((game) => <GameTile key={game.id} game={game} compact />)}
          </div>
        </section>

        <section className="reference-guide" id="guide">
          <PanelHeading icon="?" title="Guide" />
          {(faqs.length ? faqs : fallbackFaqs()).map((faq) => (
            <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
          ))}
          <a className="reference-guide-more" href="/guide">ดูทั้งหมด</a>
        </section>

        <section className="reference-provider-strip">
          <h2>พันธมิตรของเรา</h2>
          <div>
            {providers.map((provider, index) => (
              <span key={`${provider.code}-${index}`} className="reference-provider-logo">
                {provider.logoUrl ? <img src={normalizeUrl(provider.logoUrl)} alt={provider.name || provider.code || 'Provider'} onError={hideBrokenImage} /> : <b>{provider.code || provider.name}</b>}
              </span>
            ))}
          </div>
        </section>
      </div>

      <aside className="desktop-home__sidebar reference-sidebar" aria-label="ข้อมูลรางวัลและอันดับ">
        <BannerCard banner={rewardBanner} siteName={siteName} className="reference-reward-banner" showImage={showPromotion} />

        <section className="reference-side-card reference-jackpot">
          <header><span>●</span><strong>Jackpot</strong></header>
          <div><small>JACKPOTS</small><strong>195,574,797</strong><em>ลุ้นรับรางวัลใหญ่</em></div>
        </section>

        <section className="reference-side-card reference-leaderboard">
          <header><strong>🏆 Leaderboard</strong><span>วันนี้</span></header>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}><b>{index + 1}</b><span><strong>{leaderName(index)}</strong><small>ชนะล่าสุด</small></span><em>›</em></div>
          ))}
        </section>

        <section className="reference-side-card reference-mini-games">
          <header><strong>🎯 Mini Game</strong></header>
          <div><a href="/login">วงล้อ</a><a href="/login">ทายการ์ด</a></div>
        </section>
      </aside>
    </section>
  );
}

function BannerCard({ banner, siteName, className, showImage }: { banner?: CmsContent['banners'][number] | undefined; siteName: string; className: string; showImage: boolean }) {
  return (
    <a className={`reference-banner ${className}`} href={banner?.href || '/promotions'}>
      {showImage && banner?.imageUrl ? <img src={banner.imageUrl} alt={banner.title || siteName} onError={hideBrokenImage} /> : null}
      <span className="reference-banner-overlay" />
      <span className="reference-banner-copy"><strong>{banner?.title || 'โปรโมชั่นสมาชิก'}</strong><small>{banner?.subtitle || 'รับสิทธิ์และรางวัลล่าสุด'}</small></span>
    </a>
  );
}

function PanelHeading({ icon, title }: { icon: string; title: string }) {
  return <header className="reference-panel-heading"><span>{icon}</span><strong>{title}</strong></header>;
}

function GameTile({ game, large = false, compact = false }: { game: Game; large?: boolean; compact?: boolean }) {
  return (
    <a href="/login?next=%2Fgames" className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}>
      <GameImage game={game} />
      {game?.isNew && <em>NEW</em>}
      <span><strong>{safeGameName(game)}</strong><small>{game?.provider?.name || game?.provider?.code || 'Provider'}</small></span>
    </a>
  );
}

function GameImage({ game }: { game: Game }) {
  const image = resolveGameImage(game);
  return image ? <img src={image} alt={safeGameName(game)} loading="lazy" onError={hideBrokenImage} /> : <span className="reference-game-fallback">{safeGameName(game).slice(0, 1).toUpperCase()}</span>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="reference-empty">{label}</div>;
}

function uniqueGames(...groups: Game[][]) {
  const map = new Map<string, Game>();
  groups.flat().forEach((game) => {
    const key = game?.id || `${game?.providerGameCode || ''}:${game?.name || ''}`;
    if (key && !map.has(key)) map.set(key, game);
  });
  return Array.from(map.values());
}

function fillGames(primary: Game[], fallback: Game[], count: number) {
  return uniqueGames(Array.isArray(primary) ? primary : [], fallback).slice(0, count);
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

function resolveGameImage(game: Game) {
  const direct = game?.imageUrl || game?.iconUrl;
  if (direct) return normalizeUrl(direct);
  const media = Array.isArray(game?.media) ? game.media : [];
  const candidate = media.find((item) => item?.cachedUrl)?.cachedUrl || media.find((item) => item?.sourceUrl)?.sourceUrl || '';
  return candidate ? normalizeUrl(candidate) : '';
}

function normalizeUrl(value: string) {
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return `/${value.replace(/^\.\//, '')}`;
}

function safeGameName(game: Game) {
  return typeof game?.name === 'string' && game.name.trim() ? game.name : 'Game';
}

function fallbackFaqs() {
  return [
    { question: 'ฝากเงินแบบโอนผ่านธนาคาร', answer: 'เลือกธนาคารที่ต้องการและทำตามขั้นตอนบนหน้าฝากเงิน' },
    { question: 'ฝากเงินแบบ QR Payment', answer: 'สแกน QR และตรวจสอบยอดเงินก่อนยืนยันรายการ' },
    { question: 'ฝากเงิน ฝากวอลเล็ต', answer: 'เลือกช่องทางวอลเล็ตที่ระบบรองรับแล้วทำตามคำแนะนำ' },
    { question: 'วิธีการฝากแบบ TrueWallet', answer: 'กรอกข้อมูลให้ครบและรอระบบตรวจสอบรายการ' },
    { question: 'เติมไม่เข้า ต้องทำยังไง?', answer: 'ติดต่อฝ่ายบริการพร้อมหลักฐานการทำรายการ' },
  ];
}

function maskName(index: number) {
  return ['ZAXXXKU70974020', 'ZAXXXM66410017', 'ZAXXXR44017413', 'ZAXXXM154', 'ZAXXXS413', 'ZAXXXXB25', 'ZAXXXJ11', 'ZAXXXP90'][index] || `PLAYER${index + 1}`;
}

function leaderName(index: number) {
  return ['GameJackpot', 'Treasure Mouse', 'BIG & BIG', 'Lucky', 'Player Win'][index] || `Player ${index + 1}`;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
