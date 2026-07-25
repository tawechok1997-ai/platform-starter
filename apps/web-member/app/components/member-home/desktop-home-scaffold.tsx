'use client';

import type { SyntheticEvent } from 'react';
import type { CmsAsset, CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from '../reference-asset-catalog';
import { DesktopHeroCarousel } from './desktop-hero-carousel';
import { V47_ASSETS } from './v47-asset-map';

type DesktopGameSections = { featured: Game[]; popular: Game[]; recent: Game[]; favorites: Game[] };
type DesktopHomeProps = { content: CmsContent; icons: SiteIconSettings; siteName: string; showPromotion: boolean; games: DesktopGameSections; isGamesLoading: boolean; gamesMessage: string };
type PromoCard = { title: string; subtitle: string; href: string; aliases: string[]; fallback: string; assetUrl: string };
type ArchiveGame = { name: string; imageUrl: string };

const PROMO_CARDS: PromoCard[] = [
  { title: 'โปรโมชั่นพิเศษ', subtitle: 'โปรโมชั่นใหม่สำหรับคุณ', href: '/promotions', aliases: ['promotion', 'promo', 'bonus', 'reward', 'โปรโมชั่น'], fallback: '✦', assetUrl: V47_ASSETS.quickPromotion },
  { title: 'กิจกรรม', subtitle: 'กิจกรรมตลอด 24 ชั่วโมง', href: '/promotions', aliases: ['activity', 'event', 'mission', 'กิจกรรม'], fallback: '♤', assetUrl: V47_ASSETS.quickActivity },
  { title: 'ข่าวสาร', subtitle: 'ข่าวสารที่คุณไม่ควรพลาด', href: '/notifications', aliases: ['news', 'announcement', 'notice', 'ข่าว'], fallback: '◇', assetUrl: V47_ASSETS.quickNews },
];

const ARCHIVE_GAMES: ArchiveGame[] = REFERENCE_GAMES.map(({ name, url }) => ({ name, imageUrl: url }));
const RANK_ART = [V47_ASSETS.rank1, V47_ASSETS.rank2, V47_ASSETS.rank3] as const;

const MATCH_CARDS = [
  { time: 'LIVE', league: 'พรีเมียร์ลีก', home: 'ทีมเหย้า', away: 'ทีมเยือน' },
  { time: '18:00', league: 'ฟุตบอลนานาชาติ', home: 'เจ้าบ้าน', away: 'ทีมเยือน' },
  { time: '20:30', league: 'ลีกยอดนิยม', home: 'ทีม A', away: 'ทีม B' },
];

export function DesktopHomeScaffold({ content, icons, siteName, showPromotion, games, isGamesLoading, gamesMessage }: DesktopHomeProps) {
  const faqs = Array.isArray(content?.faqs) ? content.faqs.filter((faq) => faq?.enabled).slice(0, 5) : [];
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const featured = fillGames(games.featured, allGames, 9);
  const popular = fillGames(games.popular, allGames, 7);
  const online = fillGames(allGames.slice(3), allGames, 5);
  const classic = fillGames(allGames.slice(8), allGames, 7);
  const providers = uniqueProviders(allGames).slice(0, 12);

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
  const jackpotImage = V47_ASSETS.jackpot || assets.jackpot?.url || V47_ASSETS.jackpotStill;

  return (
    <section className="desktop-home desktop-reference-home" aria-label="หน้าแรกเดสก์ท็อป">
      <DesktopHeroCarousel content={content} siteName={siteName} showPromotion={showPromotion} />

      <div className="desktop-home__body">
        <div className="desktop-home__main reference-main-column">
          <section className="reference-promo-row" aria-label="โปรโมชั่น กิจกรรม และข่าวสาร">
            {PROMO_CARDS.map((card, index) => {
              const asset = findCmsAsset(content, card.aliases);
              return <a key={card.title} href={card.href} className={`reference-promo-card reference-promo-card--${index + 1}`}><AssetIcon asset={asset} configured={card.assetUrl} fallback={card.fallback} className="reference-promo-icon" /><span><strong>{card.title}</strong><small>{card.subtitle}</small></span></a>;
            })}
          </section>

          <a href="/promotions" className="reference-tournament-cta"><AssetIcon asset={assets.tournament} configured={V47_ASSETS.tournamentIcon} fallback="V" className="reference-tournament-mark" /><span><small>TOURNAMENT</small><strong>เข้าร่วมชิงความเป็นที่ 1</strong></span><b>เข้าแข่งขัน ›</b></a>

          <section className="reference-panel reference-tournament-board" data-section-kind="tournament">
            <PanelHeading configured={V47_ASSETS.tournamentIcon} fallback="🏆" title="ทัวร์นาเมนต์" />
            <div className="reference-tournament-title"><strong>No.1 Tournament Football Royale ครั้งที่ 2</strong><a href="/promotions">ดูทั้งหมด ›</a></div>
            <div className="reference-tournament-track" data-drag-scroll="true">{Array.from({ length: 8 }, (_, index) => <article key={index} className="reference-rank-card"><RankMark index={index} /><strong>{maskName(index)}</strong><span>{20 - index * 2}</span><small>● ● ● ● ●</small></article>)}</div>
            <div className="reference-panel-dots" aria-hidden="true"><i className="active" /><i /><i /></div>
          </section>

          <section className="reference-panel reference-featured-section" data-section-kind="featured">
            <PanelHeading asset={assets.featured} configured={V47_ASSETS.star} fallback="★" title="เกมไฮไลต์" />
            {isGamesLoading ? <EmptyState label="กำลังโหลดเกมจาก API..." /> : featured.length ? <div className="reference-featured-grid"><GameTile game={featured[0]!} large /><div className="reference-featured-small-grid" data-drag-scroll="true">{featured.slice(1, 9).map((game) => <GameTile key={game.id} game={game} />)}</div></div> : <ArchiveFeaturedGames message={gamesMessage} />}
          </section>

          <section className="reference-number-section" data-section-kind="popular"><PanelHeading asset={assets.popular} configured={V47_ASSETS.gameHit} fallback="🔥" title="Top 10 Popular Games" /><div className="reference-number-row" data-drag-scroll="true">
            {popular.length ? popular.map((game, index) => <a key={`${game.id}-${index}`} href="/login?next=%2Fgames" className="reference-number-card" title={safeGameName(game)}><GameImage game={game} /><span>{index + 1}</span><strong>{safeGameName(game)}</strong></a>) : ARCHIVE_GAMES.slice(0, 10).map((game, index) => <ArchiveNumberCard key={game.name} game={game} index={index} />)}
          </div></section>

          <section className="reference-compact-section" data-section-kind="online"><PanelHeading asset={assets.online} configured={V47_ASSETS.mostOnline} fallback="⚡" title="Most Online Now" /><div className="reference-online-row" data-drag-scroll="true">{online.length ? online.map((game, index) => <a key={`${game.id}-${index}`} href="/login?next=%2Fgames" className="reference-online-card"><GameImage game={game} /><span><strong>{safeGameName(game)}</strong><small>♟ {(4274 - index * 437).toLocaleString()}</small></span></a>) : ARCHIVE_GAMES.slice(6, 13).map((game, index) => <ArchiveOnlineCard key={game.name} game={game} index={index} />)}</div></section>

          <section className="reference-compact-section" id="live" data-section-kind="live"><PanelHeading asset={assets.live} configured={V47_ASSETS.liveIcon} fallback="🔴" title="Live Now!!" /><div className="reference-live-row" data-drag-scroll="true">{MATCH_CARDS.map((match, index) => <article key={`${match.league}-${index}`} className="reference-live-card"><header><span>{match.league}</span><b>{match.time}</b></header><div><strong>{match.home}</strong><span>VS</span><strong>{match.away}</strong></div><footer><a href="/login">ดูบอลสด</a><a href="/login">เล่นเกมทันที</a></footer></article>)}</div></section>

          <section className="reference-compact-section" data-section-kind="classic"><PanelHeading asset={assets.classic} configured={V47_ASSETS.gameHit} fallback="💧" title="Classic Games" /><div className="reference-classic-row" data-drag-scroll="true">{classic.length ? classic.map((game) => <GameTile key={game.id} game={game} compact />) : ARCHIVE_GAMES.slice(11, 19).map((game) => <ArchiveGameTile key={game.name} game={game} compact />)}</div></section>

          <section className="reference-guide" id="guide" data-section-kind="guide"><PanelHeading asset={assets.guide} configured={V47_ASSETS.openGold} fallback="?" title="Guide" />{(faqs.length ? faqs : fallbackFaqs()).map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}<a className="reference-guide-more" href="/guide">ดูทั้งหมด</a></section>

          <section className="reference-provider-strip"><h2><AssetIcon asset={assets.partner} configured={icons.affiliate} fallback="" className="reference-heading-icon" />พันธมิตรของเรา</h2><div data-drag-scroll="true">{providers.length ? providers.map((provider, index) => <span key={`${provider.code}-${index}`} className="reference-provider-logo">{provider.logoUrl ? <img src={normalizeUrl(provider.logoUrl)} alt={provider.name || provider.code || 'Provider'} onError={hideBrokenImage} /> : <b>{provider.code || provider.name}</b>}</span>) : REFERENCE_PROVIDERS.map((provider) => <span key={provider.name} className="reference-provider-logo"><img src={provider.url} alt={provider.name} loading="lazy" onError={hideBrokenImage} /></span>)}</div></section>
        </div>

        <aside className="desktop-home__sidebar reference-sidebar" aria-label="ข้อมูลรางวัลและอันดับ">
          <section className="reference-side-card reference-jackpot"><header><AssetIcon configured={V47_ASSETS.jackpotStill} fallback="●" className="reference-side-icon" /><strong>Jackpot</strong></header><div><img className="reference-jackpot-art" src={jackpotImage} alt="Jackpot" onError={hideBrokenImage} /><small>JACKPOTS</small><strong>195,574,797</strong><em>ลุ้นรับรางวัลใหญ่</em></div></section>
          <section className="reference-side-card reference-leaderboard"><header><span className="reference-side-title"><AssetIcon configured={V47_ASSETS.leaderboard} fallback="🏆" className="reference-side-icon" /><strong>Leaderboard</strong></span><span>วันนี้</span></header>{Array.from({ length: 5 }, (_, index) => <div key={index}><RankMark index={index} /><span><strong>{leaderName(index)}</strong><small>ชนะล่าสุด</small></span><em>›</em></div>)}</section>
          <section className="reference-side-card reference-mini-games"><header><span className="reference-side-title"><AssetIcon configured={V47_ASSETS.miniGame} fallback="⚡" className="reference-side-icon" /><strong>Mini Game</strong></span></header><div><a href="/login"><AssetIcon asset={assets.wheel} configured={V47_ASSETS.miniGameWheel} fallback="วงล้อ" className="reference-mini-icon" /><span>วงล้อ</span></a><a href="/login"><AssetIcon asset={assets.card} configured={V47_ASSETS.miniGameMission} fallback="ไพ่" className="reference-mini-icon" /><span>ทายการ์ด</span></a></div></section>
        </aside>
      </div>
    </section>
  );
}

function RankMark({ index }: { index: number }) { const image = RANK_ART[index]; return <b className="reference-rank-medal">{image ? <img src={image} alt={`อันดับ ${index + 1}`} loading="lazy" onError={hideBrokenImage} /> : index + 1}</b>; }
function ArchiveFeaturedGames({ message }: { message: string }) { return <div className="reference-featured-grid reference-featured-grid--archive" aria-label={message || 'เกมตัวอย่างจากชุด asset'}><ArchiveGameTile game={ARCHIVE_GAMES[0]!} large /><div className="reference-featured-small-grid" data-drag-scroll="true">{ARCHIVE_GAMES.slice(1, 9).map((game) => <ArchiveGameTile key={game.name} game={game} />)}</div></div>; }
function ArchiveGameTile({ game, large = false, compact = false }: { game: ArchiveGame; large?: boolean; compact?: boolean }) { return <a href="/login?next=%2Fgames" className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}><img src={game.imageUrl} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span><strong>{game.name}</strong><small>NOAH345</small></span></a>; }
function ArchiveNumberCard({ game, index }: { game: ArchiveGame; index: number }) { return <a href="/login?next=%2Fgames" className="reference-number-card" title={game.name}><img src={game.imageUrl} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span>{index + 1}</span><strong>{game.name}</strong></a>; }
function ArchiveOnlineCard({ game, index }: { game: ArchiveGame; index: number }) { return <a href="/login?next=%2Fgames" className="reference-online-card"><img src={game.imageUrl} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span><strong>{game.name}</strong><small>♟ {(4274 - index * 437).toLocaleString()}</small></span></a>; }
function EmptyState({ label }: { label: string }) { return <div className="reference-empty">{label}</div>; }
function PanelHeading({ asset, configured, fallback, title }: { asset?: CmsAsset | undefined; configured?: string | undefined; fallback: string; title: string }) { return <header className="reference-panel-heading"><AssetIcon asset={asset} configured={configured} fallback={fallback} className="reference-heading-icon" /><strong>{title}</strong></header>; }
function AssetIcon({ asset, configured, fallback, className }: { asset?: CmsAsset | undefined; configured?: string | undefined; fallback: string; className: string }) { const value = configured || asset?.url || ''; return <span className={className} aria-hidden="true">{value ? (isImageValue(value) ? <img src={normalizeUrl(value)} alt="" onError={hideBrokenImage} /> : value) : fallback}</span>; }
function GameTile({ game, large = false, compact = false }: { game: Game; large?: boolean; compact?: boolean }) { return <a href="/login?next=%2Fgames" className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}><GameImage game={game} />{game?.isNew && <em>NEW</em>}<span><strong>{safeGameName(game)}</strong><small>{game?.provider?.name || game?.provider?.code || 'Provider'}</small></span></a>; }
function GameImage({ game }: { game: Game }) { const image = resolveGameImage(game); return image ? <img src={image} alt={safeGameName(game)} loading="lazy" onError={hideBrokenImage} /> : <span className="reference-game-fallback">{safeGameName(game).slice(0, 1).toUpperCase()}</span>; }
function findCmsAsset(content: CmsContent, aliases: string[]) { const normalizedAliases = aliases.map(normalizeSearchText); return (Array.isArray(content?.assets) ? content.assets : []).find((asset) => { if (!asset?.enabled || asset.type !== 'image' || !asset.url) return false; const haystack = normalizeSearchText(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`); return normalizedAliases.some((alias) => haystack.includes(alias)); }); }
function normalizeSearchText(value: string) { return value.toLowerCase().replace(/[\s_\-./\\]+/g, ''); }
function isImageValue(value: string) { return /^https?:\/\//i.test(value) || value.startsWith('/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value); }
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
