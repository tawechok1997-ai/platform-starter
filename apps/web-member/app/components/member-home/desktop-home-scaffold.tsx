'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import type { CmsAsset, CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from '../reference-asset-catalog';
import { DesktopHeroCarousel } from './desktop-hero-carousel';
import {
  normalizePublicAssetUrl,
  resolveHomeGameFallback,
  resolveHomeGameImage,
  resolveHomeProviderLogo,
} from './local-game-asset-resolver';
import { V47_ASSETS } from './v47-asset-map';

type DesktopGameSections = { featured: Game[]; popular: Game[]; recent: Game[]; favorites: Game[] };
type DesktopHomeProps = { content: CmsContent; icons: SiteIconSettings; siteName: string; showPromotion: boolean; games: DesktopGameSections; isGamesLoading: boolean; gamesMessage: string };
type PromoCard = { title: string; subtitle: string; href: string; aliases: string[]; fallback: string; assetUrl: string; backgroundUrl: string };
type ArchiveGame = { name: string; imageUrl: string };
type ProviderLogo = { key: string; name: string; url: string };
type GuideFaq = { question: string; answer: string };

const ANNOUNCEMENT_TEXT = 'ยินดีต้อนรับสู่ NOAH345 โปรโมชั่น กิจกรรม และเกมใหม่อัปเดตตลอด 24 ชั่วโมง';

const PROMO_CARDS: PromoCard[] = [
  { title: 'โปรโมชั่นพิเศษ', subtitle: 'โปรโมชั่นพิเศษเฉพาะคุณ', href: '/browse/promotions?view=promotion', aliases: ['promotion', 'promo', 'bonus', 'reward', 'โปรโมชั่น'], fallback: '✦', assetUrl: V47_ASSETS.quickPromotion, backgroundUrl: V47_ASSETS.promoBackgroundPromotion },
  { title: 'กิจกรรม', subtitle: 'กิจกรรมตลอด 24 ชั่วโมง', href: '/browse/promotions?view=activity', aliases: ['activity', 'event', 'mission', 'กิจกรรม'], fallback: '♤', assetUrl: V47_ASSETS.quickActivity, backgroundUrl: V47_ASSETS.promoBackgroundActivity },
  { title: 'ข่าวสาร', subtitle: 'ข่าวสารที่คุณไม่ควรพลาด', href: '/browse/promotions?view=news', aliases: ['news', 'announcement', 'notice', 'ข่าว'], fallback: '◇', assetUrl: V47_ASSETS.quickNews, backgroundUrl: V47_ASSETS.promoBackgroundNews },
];

const SOURCE_HIGHLIGHT_BANNERS = [
  '/assets/asset-pc/images/_INIT/highlight/1731332886257-a7188fa9-8abc-4e47-9ea5-cfd777cb1abe.webp',
  '/assets/asset-pc/images/_INIT/highlight/1731332839344-d4557c6c-9f8f-4124-aa87-f533927c3885.webp',
  '/assets/asset-pc/images/_INIT/highlight/1731332920882-dee83096-8353-49b1-8a14-29c66a564c13.webp',
  '/assets/asset-pc/images/_INIT/highlight/1731332806809-ca83b9e9-d625-44e7-8185-b5122990a373.webp',
] as const;

const ALLIANCE_ROW_ONE = ['evoplay', 'cq9', 'jili', 'playstar', 'joker', 'ebet', 'popk', 'evoplay', 'cq9', 'jili', 'playstar', 'joker'].map((name, index) => ({ key: `alliance-1-${index}`, name, url: `/assets/asset-pc/images/alliance/${name}.webp` }));
const ALLIANCE_ROW_TWO = ['jili', 'playstar', 'evoplay', 'ebet', 'popk', 'cq9', 'evoplay', 'jili', 'playstar', 'joker', 'evoplay'].map((name, index) => ({ key: `alliance-2-${index}`, name, url: `/assets/asset-pc/images/alliance/${name}.webp` }));
const ARCHIVE_GAMES: ArchiveGame[] = REFERENCE_GAMES.map(({ name, url }) => ({ name, imageUrl: url }));
const RANK_ART = [V47_ASSETS.rank1, V47_ASSETS.rank2, V47_ASSETS.rank3] as const;
const TOURNAMENT_SCORES = [20, 17, 13, 11, 9, 8, 6, 5] as const;
const LEADERBOARD_ITEMS = [
  { name: 'Saba', user: '090XXXX284', wins: '7,000', image: ARCHIVE_GAMES[0]!.imageUrl },
  { name: 'Wild Bounty Showdown', user: '099XXXX917', wins: '5,760', image: ARCHIVE_GAMES[1]!.imageUrl },
  { name: 'Sexy Baccarat', user: '063XXXX452', wins: '5,700', image: ARCHIVE_GAMES[2]!.imageUrl },
  { name: 'Lucky Neko', user: '084XXXX608', wins: '5,690', image: ARCHIVE_GAMES[3]!.imageUrl },
  { name: 'Treasures of Aztec', user: '090XXXX762', wins: '5,120', image: ARCHIVE_GAMES[4]!.imageUrl },
] as const;

const MATCH_CARDS = [
  { time: 'LIVE', league: 'ปารากวัย - ปรีเมร่า ดิวิซิโอน', home: 'ทีมเหย้า', away: 'ทีมเยือน' },
  { time: 'LIVE', league: 'แคนาดา - แคนาเดียน แชมเปี้ยนชิพ', home: 'เจ้าบ้าน', away: 'ทีมเยือน' },
  { time: 'LIVE', league: 'อุรุกวัย - ปรีเมร่า ดิวิซิโอน', home: 'ทีม A', away: 'ทีม B' },
];

export function DesktopHomeScaffold({ content, icons, siteName, showPromotion, games, isGamesLoading, gamesMessage }: DesktopHomeProps) {
  const configuredFaqs = Array.isArray(content?.faqs) ? content.faqs.filter((faq) => faq?.enabled).slice(0, 5) : [];
  const guideFaqs = completeFaqs(configuredFaqs);
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const featured = fillGames(games.featured, allGames, 8);
  const popular = fillGames(games.popular, allGames, 10);
  const online = fillGames(allGames.slice(3), allGames, 6);
  const classic = fillGames(allGames.slice(8), allGames, 6);
  const providerLogos = ALLIANCE_ROW_ONE;

  const assets = {
    tournament: findCmsAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']),
    jackpot: findCmsAsset(content, ['jackpot', 'jackpots', 'แจ็คพอต']),
    featured: findCmsAsset(content, ['featured', 'highlight', 'recommended', 'เกมไฮไลท์', 'เกมไฮไลต์']),
    popular: findCmsAsset(content, ['popular', 'top10', 'hot game', 'ยอดนิยม']),
    online: findCmsAsset(content, ['online', 'most online', 'player', 'ผู้เล่น']),
    live: findCmsAsset(content, ['live', 'live now', 'stream', 'ถ่ายทอดสด']),
    classic: findCmsAsset(content, ['classic', 'arcade', 'คลาสสิก']),
    guide: findCmsAsset(content, ['guide', 'help', 'faq', 'คู่มือ']),
    partner: findCmsAsset(content, ['partner', 'provider', 'พันธมิตร']),
  };

  return (
    <section className="desktop-home desktop-reference-home" aria-label="หน้าแรกเดสก์ท็อป">
      <DesktopHeroCarousel content={content} siteName={siteName} showPromotion={showPromotion} />

      <div className="desktop-home__body">
        <main className="desktop-home__main reference-main-column">
          <div className="reference-announcement">
            <img src={V47_ASSETS.announcement} alt="" aria-hidden="true" onError={hideBrokenImage} />
            <div className="reference-announcement-viewport">
              <div className="reference-announcement-track">
                <span>{ANNOUNCEMENT_TEXT}</span>
              </div>
            </div>
          </div>

          <section className="reference-promo-row" aria-label="โปรโมชั่น กิจกรรม และข่าวสาร">
            {PROMO_CARDS.map((card, index) => {
              const asset = findCmsAsset(content, card.aliases);
              return (
                <a key={card.title} href={card.href} className={`reference-promo-card reference-promo-card--${index + 1}`}>
                  <img className="reference-promo-background" src={card.backgroundUrl} alt="" aria-hidden="true" onError={hideBrokenImage} />
                  <AssetIcon asset={asset} configured={card.assetUrl} fallback={card.fallback} className="reference-promo-icon" />
                  <span className="reference-promo-copy"><strong>{card.title}</strong><small>{card.subtitle}</small></span>
                </a>
              );
            })}
          </section>

          <a href="/browse/promotions?view=activity" className="reference-tournament-cta">
            <img src={assets.tournament?.url || V47_ASSETS.tournament} alt="เข้าร่วมแข่งขัน Tournament" onError={(event) => swapBrokenImage(event, V47_ASSETS.tournament)} />
            <span><small>ร่วมสนุกกับกิจกรรม Tournament</small><strong>TOURNAMENT เข้าร่วมชิงความเป็นที่ 1</strong></span>
            <b>เข้าแข่งขัน ›</b>
          </a>

          <section className="reference-panel reference-tournament-board" data-section-kind="tournament">
            <PanelHeading configured={V47_ASSETS.tournamentIcon} fallback="🏆" title="ทัวร์นาเมนต์" />
            <div className="reference-tournament-title"><strong>No1. Tournament Football Royale ครั้งที่ 2</strong><a href="/browse/promotions?view=activity">ดูทั้งหมด ›</a></div>
            <div className="reference-tournament-track" data-drag-scroll="true">
              {TOURNAMENT_SCORES.map((score, index) => <article key={index} className="reference-rank-card"><RankMark index={index} /><strong>{maskName(index)}</strong><span>{score}</span><small>● ● ● ● ●</small></article>)}
            </div>
            <div className="reference-panel-dots" aria-hidden="true"><i className="active" /><i /><i /></div>
          </section>

          <SourceHighlightSection asset={assets.featured} apiGames={featured} loading={isGamesLoading} message={gamesMessage} />

          <section className="reference-number-section" data-section-kind="popular"><PanelHeading asset={assets.popular} configured={V47_ASSETS.gameHit} fallback="🔥" title="Top 10 Popular Games" /><div className="reference-number-row" data-drag-scroll="true">
            {popular.length ? popular.map((game, index) => <a key={`${game.id}-${index}`} href="/browse/games" className="reference-number-card" title={safeGameName(game)}><GameImage game={game} /><span>{index + 1}</span><strong>{safeGameName(game)}</strong></a>) : ARCHIVE_GAMES.slice(0, 10).map((game, index) => <ArchiveNumberCard key={game.name} game={game} index={index} />)}
          </div></section>

          <section className="reference-compact-section" data-section-kind="online"><PanelHeading asset={assets.online} configured={V47_ASSETS.mostOnline} fallback="⚡" title="Most Online Now" /><div className="reference-online-row" data-drag-scroll="true">{online.length ? online.map((game, index) => <a key={`${game.id}-${index}`} href="/browse/games" className="reference-online-card"><GameImage game={game} /><span><strong>{safeGameName(game)}</strong><small>♟ {(4195 - index * 437).toLocaleString()}</small></span></a>) : ARCHIVE_GAMES.slice(6, 12).map((game, index) => <ArchiveOnlineCard key={game.name} game={game} index={index} />)}</div></section>

          <section className="reference-compact-section" id="live" data-section-kind="live"><PanelHeading asset={assets.live} configured={V47_ASSETS.liveIcon} fallback="🔴" title="Live Now!!" /><div className="reference-live-row" data-drag-scroll="true">{MATCH_CARDS.map((match, index) => <article key={`${match.league}-${index}`} className="reference-live-card"><header><span>{match.league}</span><b>{match.time}</b></header><div><strong>{match.home}</strong><span>VS</span><strong>{match.away}</strong></div><footer><a href="/login">ดูบอลสด</a><a href="/login">เล่นเกมทันที</a></footer></article>)}</div></section>

          <section className="reference-compact-section" data-section-kind="classic"><PanelHeading asset={assets.classic} configured={V47_ASSETS.gameHit} fallback="💧" title="Classic Games" /><div className="reference-classic-row" data-drag-scroll="true">{classic.length ? classic.map((game) => <GameTile key={game.id} game={game} compact />) : ARCHIVE_GAMES.slice(10, 16).map((game) => <ArchiveGameTile key={game.name} game={game} compact />)}</div></section>

          <section className="reference-guide" id="guide" data-section-kind="guide"><PanelHeading asset={assets.guide} configured={V47_ASSETS.openGold} fallback="?" title="Guide" />{guideFaqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}<a className="reference-guide-more" href="/guide">ดูทั้งหมด</a></section>

          <section className="reference-provider-strip">
            <h2><AssetIcon asset={assets.partner} configured={icons.affiliate} fallback="" className="reference-heading-icon" />พันธมิตรของเรา</h2>
            <div className="reference-provider-rows">
              <div className="reference-provider-row">{providerLogos.map((provider) => <ProviderLogoItem key={`a-${provider.key}`} provider={provider} />)}</div>
              <div className="reference-provider-row reference-provider-row--reverse">{ALLIANCE_ROW_TWO.map((provider) => <ProviderLogoItem key={`b-${provider.key}`} provider={provider} />)}</div>
            </div>
          </section>
        </main>

        <aside className="desktop-home__sidebar reference-sidebar" aria-label="ข้อมูลรางวัลและอันดับ">
          <section className="reference-side-card reference-jackpot"><header><AssetIcon configured={V47_ASSETS.coin} fallback="●" className="reference-side-icon" /><strong>Jackpot</strong></header><div><img className="reference-jackpot-art" src={assets.jackpot?.url || V47_ASSETS.jackpot} alt="Jackpot" onError={(event) => swapBrokenImage(event, V47_ASSETS.jackpotStill)} /><strong>196,464,585</strong></div></section>
          <section className="reference-side-card reference-leaderboard"><header><span className="reference-side-title"><AssetIcon configured={V47_ASSETS.leaderboard} fallback="🏆" className="reference-side-icon" /><strong>Leaderboard</strong></span></header>{LEADERBOARD_ITEMS.map((item, index) => <div key={item.name}><RankMark index={index} /><img className="reference-leaderboard-game-image" src={item.image} alt="" loading="lazy" onError={hideBrokenImage} /><span><strong>{item.name}</strong><small>{item.user}</small><small>ชนะ <b>{item.wins}</b></small></span><em>›</em></div>)}</section>
          <section className="reference-side-card reference-mini-games"><header><span className="reference-side-title"><AssetIcon configured={V47_ASSETS.miniGame} fallback="⚡" className="reference-side-icon" /><strong>Mini Game</strong></span></header><div><a href="/login"><AssetIcon configured={V47_ASSETS.miniGameWheel} fallback="วงล้อ" className="reference-mini-icon" /><span>วงล้อ</span></a><a href="/login"><AssetIcon configured={V47_ASSETS.miniGameMission} fallback="ภารกิจ" className="reference-mini-icon" /><span>ทำภารกิจ</span></a></div></section>
        </aside>
      </div>
    </section>
  );
}

function SourceHighlightSection({ asset, apiGames, loading, message }: { asset?: CmsAsset | undefined; apiGames: Game[]; loading: boolean; message: string }) {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % SOURCE_HIGHLIGHT_BANNERS.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, []);

  const activeGame = apiGames[activeBanner];
  const bannerFallback = activeGame
    ? resolveHomeGameImage(activeGame) || resolveHomeGameFallback(activeGame)
    : ARCHIVE_GAMES[activeBanner % ARCHIVE_GAMES.length]!.imageUrl;

  const highlightGames = Array.from({ length: 8 }, (_, index) => {
    const apiGame = apiGames[index];
    const localFallback = ARCHIVE_GAMES[index % ARCHIVE_GAMES.length]!;
    const fallbackProvider = REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!;
    if (!apiGame) {
      return {
        key: `local-${localFallback.name}-${index}`,
        name: localFallback.name,
        imageUrl: localFallback.imageUrl,
        fallback: localFallback.imageUrl,
        providerLogo: fallbackProvider.url,
        providerName: fallbackProvider.name,
      };
    }

    const fallback = resolveHomeGameFallback(apiGame);
    return {
      key: apiGame.id || `${apiGame.providerGameCode}-${index}`,
      name: safeGameName(apiGame),
      imageUrl: resolveHomeGameImage(apiGame) || fallback,
      fallback,
      providerLogo: resolveHomeProviderLogo(apiGame.provider) || fallbackProvider.url,
      providerName: apiGame.provider?.name || apiGame.provider?.code || fallbackProvider.name,
    };
  });

  return (
    <section
      className="reference-panel reference-featured-section source-highlight-section"
      data-section-kind="featured"
      aria-label={message || 'เกมไฮไลท์'}
      aria-busy={loading}
    >
      <div className="source-highlight-inner">
        <div className="source-highlight-glow" aria-hidden="true" />
        <header className="source-highlight-heading">
          <span className="source-highlight-heading__content">
            <AssetIcon asset={asset} configured={V47_ASSETS.star} fallback="★" className="source-highlight-heading__icon" />
            <strong>เกมไฮไลท์</strong>
          </span>
        </header>

        <div className="source-highlight-content">
          <div className="source-highlight-hero">
            <a className="source-highlight-hero__link" href="/browse/games" target="_blank" rel="noreferrer">
              <img
                key={SOURCE_HIGHLIGHT_BANNERS[activeBanner]}
                className="source-highlight-hero__image"
                src={SOURCE_HIGHLIGHT_BANNERS[activeBanner]}
                alt="เกมไฮไลท์"
                onError={(event) => swapBrokenImage(event, bannerFallback)}
              />
            </a>
            <div className="source-highlight-hero__dots" aria-label="เลือกภาพเกมไฮไลท์">
              {SOURCE_HIGHLIGHT_BANNERS.map((banner, index) => (
                <button
                  key={banner}
                  type="button"
                  className={`source-highlight-hero__dot${index === activeBanner ? ' is-active' : ''}`}
                  onClick={() => setActiveBanner(index)}
                  aria-label={`ภาพที่ ${index + 1}`}
                  aria-current={index === activeBanner ? 'true' : undefined}
                />
              ))}
            </div>
          </div>

          <div className="source-highlight-games">
            {highlightGames.map((game, index) => (
              <a key={game.key} className="source-highlight-game" href="/browse/games" target="_blank" rel="noreferrer" title={game.name}>
                <span className="source-highlight-game__art">
                  <img className="source-highlight-game__blur" src={game.imageUrl} alt="" aria-hidden="true" onError={(event) => swapBrokenImage(event, game.fallback)} />
                  <img className="source-highlight-game__image" src={game.imageUrl} alt={game.name} onError={(event) => swapBrokenImage(event, game.fallback)} />
                  <span className="source-highlight-game__provider"><img src={game.providerLogo} alt={game.providerName} onError={(event) => swapBrokenImage(event, REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!.url)} /></span>
                </span>
                <span className="source-highlight-game__name">{game.name}</span>
                <span className="source-highlight-game__rank" aria-hidden="true">{index + 1}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RankMark({ index }: { index: number }) { const image = RANK_ART[index]; return <b className="reference-rank-medal">{image ? <img src={image} alt={`อันดับ ${index + 1}`} loading="lazy" onError={hideBrokenImage} /> : index + 1}</b>; }
function ArchiveGameTile({ game, large = false, compact = false }: { game: ArchiveGame; large?: boolean; compact?: boolean }) { return <a href="/browse/games" className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}><img src={game.imageUrl} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span><strong>{game.name}</strong><small>NOAH345</small></span></a>; }
function ArchiveNumberCard({ game, index }: { game: ArchiveGame; index: number }) { return <a href="/browse/games" className="reference-number-card" title={game.name}><img src={game.imageUrl} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span>{index + 1}</span><strong>{game.name}</strong></a>; }
function ArchiveOnlineCard({ game, index }: { game: ArchiveGame; index: number }) { return <a href="/browse/games" className="reference-online-card"><img src={game.imageUrl} alt={game.name} loading="lazy" onError={hideBrokenImage} /><span><strong>{game.name}</strong><small>♟ {(4195 - index * 437).toLocaleString()}</small></span></a>; }
function PanelHeading({ asset, configured, fallback, title }: { asset?: CmsAsset | undefined; configured?: string | undefined; fallback: string; title: string }) { return <header className="reference-panel-heading"><AssetIcon asset={asset} configured={configured} fallback={fallback} className="reference-heading-icon" /><strong>{title}</strong></header>; }
function AssetIcon({ asset, configured, fallback, className }: { asset?: CmsAsset | undefined; configured?: string | undefined; fallback: string; className: string }) { const value = asset?.url || configured || ''; return <span className={className} aria-hidden="true">{value ? (isImageValue(value) ? <img src={normalizePublicAssetUrl(value)} alt="" onError={hideBrokenImage} /> : value) : fallback}</span>; }
function ProviderLogoItem({ provider }: { provider: ProviderLogo }) {
  return (
    <span className="reference-provider-logo" title={provider.name}>
      <img
        src={provider.url}
        alt={provider.name}
        loading="eager"
        decoding="sync"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    </span>
  );
}
function GameTile({ game, large = false, compact = false }: { game: Game; large?: boolean; compact?: boolean }) { return <a href="/browse/games" className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}><GameImage game={game} />{game?.isNew && <em>NEW</em>}<span><strong>{safeGameName(game)}</strong><small>{game?.provider?.name || game?.provider?.code || 'Provider'}</small></span></a>; }
function GameImage({ game }: { game: Game }) { const fallback = resolveHomeGameFallback(game); const image = resolveHomeGameImage(game) || fallback; return <img src={image} alt={safeGameName(game)} loading="lazy" onError={(event) => swapBrokenImage(event, fallback)} />; }
function findCmsAsset(content: CmsContent, aliases: string[]) { const normalizedAliases = aliases.map(normalizeSearchText); return (Array.isArray(content?.assets) ? content.assets : []).find((asset) => { if (!asset?.enabled || asset.type !== 'image' || !asset.url) return false; const haystack = normalizeSearchText(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`); return normalizedAliases.some((alias) => haystack.includes(alias)); }); }
function normalizeSearchText(value: string) { return value.toLowerCase().replace(/[\s_\-./\\]+/g, ''); }
function isImageValue(value: string) { return /^https?:\/\//i.test(value) || value.startsWith('/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value); }
function uniqueGames(...groups: Game[][]) { const map = new Map<string, Game>(); groups.flat().forEach((game) => { const key = game?.id || `${game?.providerGameCode || ''}:${game?.name || ''}`; if (key && !map.has(key)) map.set(key, game); }); return Array.from(map.values()); }
function fillGames(primary: Game[], fallback: Game[], count: number) { return uniqueGames(Array.isArray(primary) ? primary : [], fallback).slice(0, count); }
function completeFaqs(configured: GuideFaq[]): GuideFaq[] {
  const result: GuideFaq[] = [];
  const seen = new Set<string>();
  [...configured, ...fallbackFaqs()].forEach((faq) => {
    const key = faq.question.trim().toLowerCase();
    if (!key || seen.has(key) || result.length >= 5) return;
    seen.add(key);
    result.push({ question: faq.question, answer: faq.answer });
  });
  return result;
}
function safeGameName(game: Game) { return typeof game?.name === 'string' && game.name.trim() ? game.name : 'Game'; }
function fallbackFaqs(): GuideFaq[] { return [{ question: 'ฝากเงินแบบ โอนผ่านธนาคาร', answer: 'เลือกธนาคารที่ต้องการและทำตามขั้นตอนบนหน้าฝากเงิน' }, { question: 'ฝากเงินแบบ โอนผ่าน QR Payment', answer: 'สแกน QR และตรวจสอบยอดเงินก่อนยืนยันรายการ' }, { question: 'ฝากเงินแบบ ฝากจุดทศนิยม', answer: 'กรอกยอดที่มีจุดทศนิยมตามที่ระบบแจ้งเพื่อจับคู่รายการ' }, { question: 'วิธีการฝากแบบ TrueWallet', answer: 'กรอกข้อมูลให้ครบและรอระบบตรวจสอบรายการ' }, { question: 'ยอดไม่เข้าทันที ทำยังไงดี?', answer: 'ติดต่อฝ่ายบริการพร้อมหลักฐานการทำรายการ' }]; }
function maskName(index: number) { return ['ZAXXXU709740', 'ZAXXXM664100', 'ZAXXXR440174', 'ZAXXXM154', 'ZAXXXS413', 'ZAXXXXB25', 'ZAXXXJ11', 'ZAXXXP90'][index] || `PLAYER${index + 1}`; }
function swapBrokenImage(event: SyntheticEvent<HTMLImageElement>, fallback: string) { if (!fallback || event.currentTarget.dataset.fallbackApplied === 'true') { hideBrokenImage(event); return; } event.currentTarget.dataset.fallbackApplied = 'true'; event.currentTarget.src = fallback; }
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) { event.currentTarget.style.display = 'none'; }
