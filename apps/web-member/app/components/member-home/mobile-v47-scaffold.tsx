'use client';

import type { SyntheticEvent } from 'react';
import type { CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';

type Props = {
  content: CmsContent;
  icons: SiteIconSettings;
  siteName: string;
  games: { featured: Game[]; popular: Game[]; recent: Game[]; favorites: Game[] };
  isGamesLoading: boolean;
  gamesMessage: string;
};

export function MobileV47Scaffold({ content, icons, siteName, games, isGamesLoading, gamesMessage }: Props) {
  const banners = Array.isArray(content.banners) ? content.banners.filter((item) => item.enabled) : [];
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const popular = fillGames(games.popular, allGames, 2);
  const online = fillGames(allGames.slice(2), allGames, 6);
  const classic = fillGames(allGames.slice(8), allGames, 6);
  const hero = banners[0];
  const heroImage = hero?.imageUrl || resolveCmsAssetById(content, hero?.assetId);
  const tournament = findAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']);
  const jackpot = findAsset(content, ['jackpot', 'แจ็คพอต']);
  const leaderboard = findAsset(content, ['leaderboard', 'ranking', 'อันดับ']);

  return (
    <section className="v47-mobile-home" aria-label="หน้าแรกมือถือ">
      <div className="v47-mobile-announcement">คาสิโนออนไลน์ครบทุกค่าย เปิดให้บริการตลอด 24 ชั่วโมง</div>

      <div className="v47-mobile-hero">
        {heroImage ? <img src={heroImage} alt={hero?.title || siteName} onError={hideBrokenImage} /> : <div className="v47-mobile-hero-fallback">{siteName}</div>}
      </div>
      <div className="v47-mobile-dots" aria-hidden="true"><i className="active" /><i /><i /><i /><i /></div>

      <div className="v47-mobile-quick-grid">
        <QuickCard icon={icons.promotion} title="โปรโมชั่น" href="/promotions" />
        <QuickCard icon={icons.activity} title="กิจกรรม" href="/promotions" />
        <QuickCard icon={icons.news} title="ข่าวสาร" href="/notifications" />
      </div>

      <a className="v47-mobile-tournament-banner" href="/promotions">
        {tournament?.url ? <img src={tournament.url} alt="Tournament" onError={hideBrokenImage} /> : null}
        <span><small>TOURNAMENT</small><strong>เข้าร่วมชิงความเป็นที่ 1</strong></span>
        <b>เข้าแข่งขัน ›</b>
      </a>

      <section className="v47-mobile-panel v47-mobile-rank-panel">
        <SectionTitle icon={tournament?.url || icons.tournament} title="ทัวร์นาเมนต์" />
        <div className="v47-mobile-rank-title"><strong>No.1 Tournament Football Royale ครั้งที่ 2</strong><a href="/promotions">ดูทั้งหมด ›</a></div>
        <div className="v47-mobile-ranks">
          {Array.from({ length: 3 }, (_, index) => <article key={index}><b>{index + 1}</b><span>ZAX00{[790740, 664100, 844010][index]}</span><strong>{[20, 17, 13][index]}</strong><small>● ● ● ● ●</small></article>)}
        </div>
      </section>

      <section className="v47-mobile-jackpot">
        {jackpot?.url ? <img src={jackpot.url} alt="Jackpot" onError={hideBrokenImage} /> : null}
        <span><small>JACKPOTS</small><strong>194,428,645</strong><em>Epic of the day</em></span>
      </section>

      <section className="v47-mobile-panel">
        <SectionTitle icon={leaderboard?.url || icons.leaderboard} title="Leaderboard" action="ดูทั้งหมด" />
        <div className="v47-mobile-board-head"><span>อันดับ</span><span>ชื่อผู้เล่น</span><span>รางวัล</span></div>
        {Array.from({ length: 5 }, (_, index) => <div className="v47-mobile-board-row" key={index}><b>{index + 1}</b><span>0{980000018 - index * 8241}</span><em>{[15000, 5700, 3500, 2904, 2100][index]?.toLocaleString()}</em></div>)}
      </section>

      <GameSection title="Top 10 Popular Games" icon={icons.popular} games={popular} loading={isGamesLoading} message={gamesMessage} />
      <GameSection title="Most Online Now" icon={icons.online} games={online} loading={isGamesLoading} message={gamesMessage} />

      <section className="v47-mobile-panel v47-mobile-live">
        <SectionTitle icon={icons.live} title="Live Now!!" action="ดูทั้งหมด" />
        <article><small>MEA ฟุตบอลลีก</small><div><span>บลูเวฟ ชลบุรี</span><i>VS</i><span>ภูเก็ต ยูไนเต็ด</span></div><footer><a href="/login">ดูถ่ายทอดสด</a><a href="/login">เดิมพันทันที</a></footer></article>
      </section>

      <GameSection title="Classic Games" icon={icons.classic} games={classic} loading={isGamesLoading} message={gamesMessage} />
    </section>
  );
}

function QuickCard({ icon, title, href }: { icon: string; title: string; href: string }) {
  return <a href={href}><Icon value={icon} /><strong>{title}</strong></a>;
}

function SectionTitle({ icon, title, action }: { icon: string; title: string; action?: string }) {
  return <header className="v47-mobile-section-title"><span><Icon value={icon} /><strong>{title}</strong></span>{action ? <a href="/games">{action}</a> : null}</header>;
}

function GameSection({ title, icon, games, loading, message }: { title: string; icon: string; games: Game[]; loading: boolean; message: string }) {
  return <section className="v47-mobile-panel"><SectionTitle icon={icon} title={title} action="ดูทั้งหมด" />{loading ? <div className="v47-mobile-empty">กำลังโหลดเกม...</div> : games.length ? <div className="v47-mobile-game-grid">{games.map((game, index) => <a href="/login?next=%2Fgames" key={`${game.id}-${index}`} className={index < 2 ? 'v47-mobile-game-card--hero' : undefined}><div><GameImage game={game} /><span>{game.isNew ? 'NEW' : 'HOT'}</span></div><span className="v47-mobile-game-meta"><b>{safeName(game)}</b><small>{game.provider?.name || game.provider?.code || 'Provider'}</small></span></a>)}</div> : <div className="v47-mobile-empty">{message || 'ยังไม่มีข้อมูลเกม'}</div>}</section>;
}

function Icon({ value }: { value: string }) {
  return isImageValue(value) ? <img src={value} alt="" onError={hideBrokenImage} /> : <span>{value}</span>;
}

function GameImage({ game }: { game: Game }) {
  const src = resolveGameImage(game);
  return src ? <img src={src} alt={safeName(game)} loading="lazy" onError={hideBrokenImage} /> : <span className="v47-mobile-game-fallback">{safeName(game).slice(0, 1)}</span>;
}

function resolveCmsAssetById(content: CmsContent, assetId?: string) { return assetId ? content.assets?.find((asset) => asset.enabled && asset.id === assetId)?.url || '' : ''; }
function findAsset(content: CmsContent, aliases: string[]) { const keys = aliases.map(normalize); return (content.assets || []).find((asset) => asset.enabled && asset.type === 'image' && asset.url && keys.some((key) => normalize(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`).includes(key))); }
function normalize(value: string) { return value.toLowerCase().replace(/[\s_\-./\\]+/g, ''); }
function uniqueGames(...groups: Game[][]) { const map = new Map<string, Game>(); groups.flat().forEach((game) => { const key = game?.id || `${game?.providerGameCode || ''}:${game?.name || ''}`; if (key && !map.has(key)) map.set(key, game); }); return [...map.values()]; }
function fillGames(primary: Game[], fallback: Game[], count: number) { return uniqueGames(primary || [], fallback).slice(0, count); }
function safeName(game: Game) { return typeof game.name === 'string' && game.name.trim() ? game.name : 'Game'; }
function resolveGameImage(game: Game) { const direct = game.imageUrl || game.iconUrl; if (direct) return normalizeUrl(direct); const media = Array.isArray(game.media) ? game.media : []; const value = media.find((item) => item?.cachedUrl)?.cachedUrl || media.find((item) => item?.sourceUrl)?.sourceUrl || ''; return value ? normalizeUrl(value) : ''; }
function normalizeUrl(value: string) { return /^https?:\/\//i.test(value) || value.startsWith('/') ? value : `/${value.replace(/^\.\//, '')}`; }
function isImageValue(value: string) { return /^(https?:\/\/|\/|\.\/)/i.test(value) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value); }
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) { event.currentTarget.style.display = 'none'; }