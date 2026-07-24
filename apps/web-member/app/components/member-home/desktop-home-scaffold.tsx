'use client';

import type { SyntheticEvent } from 'react';
import type { CmsAsset, CmsContent } from '../../site-settings';
import type { Game } from '../../types/member-api';

type DesktopGameSections = { featured: Game[]; popular: Game[]; recent: Game[]; favorites: Game[] };
type DesktopHomeProps = { content: CmsContent; siteName: string; showPromotion: boolean; games: DesktopGameSections; isGamesLoading: boolean; gamesMessage: string };
type PromoCard = { title: string; subtitle: string; href: string; aliases: string[]; fallback: string };

const PROMO_CARDS: PromoCard[] = [
  { title: 'โปรโมชั่นพิเศษ', subtitle: 'โปรโมชั่นใหม่เฉพาะคุณ', href: '/promotions', aliases: ['promotion', 'promo', 'bonus', 'reward', 'โปรโมชั่น'], fallback: '✦' },
  { title: 'กิจกรรม', subtitle: 'กิจกรรมตลอด 24 ชั่วโมง', href: '/promotions', aliases: ['activity', 'event', 'mission', 'กิจกรรม'], fallback: '♤' },
  { title: 'ข่าวสาร', subtitle: 'ข่าวสารที่คุณไม่ควรพลาด', href: '/notifications', aliases: ['news', 'announcement', 'notice', 'ข่าว'], fallback: '◇' },
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

  const assets = {
    tournament: findCmsAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']),
    jackpot: findCmsAsset(content, ['jackpot', 'แจ็คพอต']),
    leaderboard: findCmsAsset(content, ['leaderboard', 'ranking', 'rank', 'อันดับ']),
    wheel: findCmsAsset(content, ['wheel', 'lucky wheel', 'วงล้อ']),
    card: findCmsAsset(content, ['card', 'mission', 'ไพ่', 'ภารกิจ']),
    featured: findCmsAsset(content, ['featured', 'highlight', 'recommended', 'เกมไฮไลต์']),
    popular: findCmsAsset(content, ['popular', 'top10', 'hot game', 'ยอดนิยม']),
    online: findCmsAsset(content, ['online', 'most online', 'player', 'ผู้เล่น']),
    live: findCmsAsset(content, ['live', 'live now', 'stream', 'ถ่ายทอดสด']),
    classic: findCmsAsset(content, ['classic', 'arcade', 'คลาสสิก']),
    guide: findCmsAsset(content, ['guide', 'help', 'faq', 'คู่มือ']),
    partner: findCmsAsset(content, ['partner', 'provider', 'พันธมิตร']),
  };

  return (
    <section className="desktop-home desktop-reference-home" aria-label="หน้าแรกเดสก์ท็อป">
      <div className="desktop-home__main reference-main-column">
        <section className="reference-hero-row" aria-label="โปรโมชั่นแนะนำ">
          <BannerCard banner={heroPeek} content={content} siteName={siteName} className="reference-hero-peek" showImage={showPromotion} />
          <BannerCard banner={heroPrimary} content={content} siteName={siteName} className="reference-hero-main" showImage={showPromotion} />
        </section>

        <div className="reference-carousel-dots" aria-hidden="true"><i /><i className="active" /><i /><i /></div>

        <section className="reference-promo-row" aria-label="โปรโมชั่น กิจกรรม และข่าวสาร">
          {PROMO_CARDS.map((card, index) => {
            const asset = findCmsAsset(content, card.aliases);
            return (
              <a key={card.title} href={card.href} className={`reference-promo-card reference-promo-card--${index + 1}`}>
                <AssetIcon asset={asset} fallback={card.fallback} className="reference-promo-icon" />
                <span><strong>{card.title}</strong><small>{card.subtitle}</small></span>
              </a>
            );
          })}
        </section>

        <a href="/promotions" className="reference-tournament-cta">
          <AssetIcon asset={assets.tournament} fallback="V" className="reference-tournament-mark" />
          <span><small>TOURNAMENT</small><strong>เข้าร่วมชิงความเป็นที่ 1</strong></span>
          <b>เข้าแข่งขัน ›</b>
        </a>

        <section className="reference-panel reference-tournament-board">
          <PanelHeading asset={assets.tournament} fallback="🏆" title="ทัวร์นาเมนต์" />
          <div className="reference-tournament-title"><strong>No.1 Tournament Football Royale ครั้งที่ 2</strong><a href="/promotions">ดูทั้งหมด ›</a></div>
          <div className="reference-tournament-track">
            {Array.from({ length: 8 }, (_, index) => (
              <article key={index} className="reference-rank-card"><b>{index + 1}</b><strong>{maskName(index)}</strong><span>{20 - index * 2}</span><small>● ● ● ● ●</small></article>
            ))}
          </div>
          <div className="reference-panel-dots" aria-hidden="true"><i className="active" /><i /><i /></div>
        </section>

        <section className="reference-panel reference-featured-section">
          <PanelHeading asset={assets.featured} fallback="★" title="เกมไฮไลต์" />
          {isGamesLoading ? <EmptyState label="กำลังโหลดเกมจาก API..." /> : featured.length ? (
            <div className="reference-featured-grid">
              <GameTile game={featured[0]!} large />
              <div className="reference-featured-small-grid">{featured.slice(1, 9).map((game) => <GameTile key={game.id} game={game} />)}</div>
            </div>
          ) : <EmptyState label={gamesMessage || 'ยังไม่มีข้อมูลเกม'} />}
        </section>

        <section className="reference-number-section"><PanelHeading asset={assets.popular} fallback="🔥" title="Top 10 Popular Games" /><div className="reference-number-row">
          {popular.map((game, index) => <a key={`${game.id}-${index}`} href="/login?next=%2Fgames" className="reference-number-card" title={safeGameName(game)}><span>{index + 1}</span><strong>{safeGameName(game)}</strong></a>)}
        </div></section>

        <section className="reference-compact-section"><PanelHeading asset={assets.online} fallback="⚡" title="Most Online Now" /><div className="reference-online-row">
          {online.map((game, index) => <a key={`${game.id}-${index}`} href="/login?next=%2Fgames" className="reference-online-card"><GameImage game={game} /><span><strong>{safeGameName(game)}</strong><small>♟ {(4274 - index * 437).toLocaleString()}</small></span></a>)}
        </div></section>

        <section className="reference-compact-section"><PanelHeading asset={assets.live} fallback="🔴" title="Live Now!!" /><div className="reference-live-row">
          {MATCH_CARDS.map((match, index) => <article key={`${match.league}-${index}`} className="reference-live-card"><header><span>{match.league}</span><b>{match.time}</b></header><div><strong>{match.home}</strong><span>VS</span><strong>{match.away}</strong></div><footer><a href="/login">ดูบอลสด</a><a href="/login">เล่นเกมทันที</a></footer></article>)}
        </div></section>

        <section className="reference-compact-section"><PanelHeading asset={assets.classic} fallback="💧" title="Classic Games" /><div className="reference-classic-row">{classic.map((game) => <GameTile key={game.id} game={game} compact />)}</div></section>

        <section className="reference-guide" id="guide"><PanelHeading asset={assets.guide} fallback="?" title="Guide" />
          {(faqs.length ? faqs : fallbackFaqs()).map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
          <a className="reference-guide-more" href="/guide">ดูทั้งหมด</a>
        </section>

        <section className="reference-provider-strip"><h2><AssetIcon asset={assets.partner} fallback="" className="reference-heading-icon" />พันธมิตรของเรา</h2><div>
          {providers.map((provider, index) => <span key={`${provider.code}-${index}`} className="reference-provider-logo">{provider.logoUrl ? <img src={normalizeUrl(provider.logoUrl)} alt={provider.name || provider.code || 'Provider'} onError={hideBrokenImage} /> : <b>{provider.code || provider.name}</b>}</span>)}
        </div></section>
      </div>

      <aside className="desktop-home__sidebar reference-sidebar" aria-label="ข้อมูลรางวัลและอันดับ">
        <BannerCard banner={rewardBanner} content={content} siteName={siteName} className="reference-reward-banner" showImage={showPromotion} />
        <section className="reference-side-card reference-jackpot"><header><AssetIcon asset={assets.jackpot} fallback="●" className="reference-side-icon" /><strong>Jackpot</strong></header><div>{assets.jackpot ? <img className="reference-jackpot-art" src={assets.jackpot.url} alt="Jackpot" onError={hideBrokenImage} /> : null}<small>JACKPOTS</small><strong>195,574,797</strong><em>ลุ้นรับรางวัลใหญ่</em></div></section>
        <section className="reference-side-card reference-leaderboard"><header><span className="reference-side-title"><AssetIcon asset={assets.leaderboard} fallback="🏆" className="reference-side-icon" /><strong>Leaderboard</strong></span><span>วันนี้</span></header>{Array.from({ length: 5 }, (_, index) => <div key={index}><b>{index + 1}</b><span><strong>{leaderName(index)}</strong><small>ชนะล่าสุด</small></span><em>›</em></div>)}</section>
        <section className="reference-side-card reference-mini-games"><header><strong>Mini Game</strong></header><div><a href="/login"><AssetIcon asset={assets.wheel} fallback="วงล้อ" className="reference-mini-icon" /><span>วงล้อ</span></a><a href="/login"><AssetIcon asset={assets.card} fallback="ไพ่" className="reference-mini-icon" /><span>ทายการ์ด</span></a></div></section>
      </aside>
    </section>
  );
}

function BannerCard({ banner, content, siteName, className, showImage }: { banner: CmsContent['banners'][number] | undefined; content: CmsContent; siteName: string; className: string; showImage: boolean }) {
  const imageUrl = banner?.imageUrl || resolveCmsAssetById(content, banner?.assetId);
  return <a className={`reference-banner ${className}`} href={banner?.href || '/promotions'}>{showImage && imageUrl ? <img src={imageUrl} alt={banner?.title || siteName} onError={hideBrokenImage} /> : null}<span className="reference-banner-overlay" /><span className="reference-banner-copy"><strong>{banner?.title || 'โปรโมชั่นสมาชิก'}</strong><small>{banner?.subtitle || 'รับสิทธิ์และรางวัลล่าสุด'}</small></span></a>;
}

function PanelHeading({ asset, fallback, title }: { asset?: CmsAsset | undefined; fallback: string; title: string }) {
  return <header className="reference-panel-heading"><AssetIcon asset={asset} fallback={fallback} className="reference-heading-icon" /><strong>{title}</strong></header>;
}

function AssetIcon({ asset, fallback, className }: { asset?: CmsAsset | undefined; fallback: string; className: string }) {
  return <span className={className} aria-hidden="true">{asset?.url ? <img src={asset.url} alt="" onError={hideBrokenImage} /> : fallback}</span>;
}

function GameTile({ game, large = false, compact = false }: { game: Game; large?: boolean; compact?: boolean }) {
  return <a href="/login?next=%2Fgames" className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}><GameImage game={game} />{game?.isNew && <em>NEW</em>}<span><strong>{safeGameName(game)}</strong><small>{game?.provider?.name || game?.provider?.code || 'Provider'}</small></span></a>;
}

function GameImage({ game }: { game: Game }) { const image = resolveGameImage(game); return image ? <img src={image} alt={safeGameName(game)} loading="lazy" onError={hideBrokenImage} /> : <span className="reference-game-fallback">{safeGameName(game).slice(0, 1).toUpperCase()}</span>; }
function EmptyState({ label }: { label: string }) { return <div className="reference-empty">{label}</div>; }
function resolveCmsAssetById(content: CmsContent, assetId?: string) { return assetId ? content.assets?.find((asset) => asset.enabled && asset.id === assetId)?.url || '' : ''; }
function findCmsAsset(content: CmsContent, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeSearchText);
  return (Array.isArray(content?.assets) ? content.assets : []).find((asset) => {
    if (!asset?.enabled || asset.type !== 'image' || !asset.url) return false;
    const haystack = normalizeSearchText(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`);
    return normalizedAliases.some((alias) => haystack.includes(alias));
  });
}
function normalizeSearchText(value: string) { return value.toLowerCase().replace(/[\s_\-./\\]+/g, ''); }
function uniqueGames(...groups: Game[][]) { const map = new Map<string, Game>(); groups.flat().forEach((game) => { const key = game?.id || `${game?.providerGameCode || ''}:${game?.name || ''}`; if (key && !map.has(key)) map.set(key, game); }); return Array.from(map.values()); }
function fillGames(primary: Game[], fallback: Game[], count: number) { return uniqueGames(Array.isArray(primary) ? primary : [], fallback).slice(0, count); }
function uniqueProviders(games: Game[]) { const map = new Map<string, NonNullable<Game['provider']>>(); games.forEach((game) => { const provider = game?.provider; const key = provider?.code || provider?.name; if (key && provider && !map.has(key)) map.set(key, provider); }); return Array.from(map.values()); }
function resolveGameImage(game: Game) { const direct = game?.imageUrl || game?.iconUrl; if (direct) return normalizeUrl(direct); const media = Array.isArray(game?.media) ? game.media : []; const candidate = media.find((item) => item?.cachedUrl)?.cachedUrl || media.find((item) => item?.sourceUrl)?.sourceUrl || ''; return candidate ? normalizeUrl(candidate) : ''; }
function normalizeUrl(value: string) { if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value; return `/${value.replace(/^\.\//, '')}`; }
function safeGameName(game: Game) { return typeof game?.name === 'string' && game.name.trim() ? game.name : 'Game'; }
function fallbackFaqs() { return [{ question: 'ฝากเงินแบบโอนผ่านธนาคาร', answer: 'เลือกธนาคารที่ต้องการและทำตามขั้นตอนบนหน้าฝากเงิน' }, { question: 'ฝากเงินแบบ QR Payment', answer: 'สแกน QR และตรวจสอบยอดเงินก่อนยืนยันรายการ' }, { question: 'ฝากเงิน ฝากวอลเล็ต', answer: 'เลือกช่องทางวอลเล็ตที่ระบบรองรับแล้วทำตามคำแนะนำ' }, { question: 'วิธีการฝากแบบ TrueWallet', answer: 'กรอกข้อมูลให้ครบและรอระบบตรวจสอบรายการ' }, { question: 'เติมไม่เข้า ต้องทำยังไง?', answer: 'ติดต่อฝ่ายบริการพร้อมหลักฐานการทำรายการ' }]; }
function maskName(index: number) { return ['ZAXXXKU70974020', 'ZAXXXM66410017', 'ZAXXXR44017413', 'ZAXXXM154', 'ZAXXXS413', 'ZAXXXXB25', 'ZAXXXJ11', 'ZAXXXP90'][index] || `PLAYER${index + 1}`; }
function leaderName(index: number) { return ['GameJackpot', 'Treasure Mouse', 'BIG & BIG', 'Lucky', 'Player Win'][index] || `Player ${index + 1}`; }
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) { event.currentTarget.style.display = 'none'; }
