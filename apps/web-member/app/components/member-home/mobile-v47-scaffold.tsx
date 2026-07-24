'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import type { CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';
import { V47_ASSETS, resolveV47Asset } from './v47-asset-map';

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
  const faqs = Array.isArray(content.faqs) ? content.faqs.filter((item) => item.enabled).slice(0, 5) : [];
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const popular = fillGames(games.popular, allGames, 6);
  const online = fillGames(allGames.slice(2), allGames, 6);
  const classic = fillGames(allGames.slice(8), allGames, 6);
  const providers = uniqueProviders(allGames).slice(0, 12);
  const [activeBanner, setActiveBanner] = useState(0);
  const hero = banners[activeBanner] ?? banners[0];
  const heroImage = hero?.imageUrl || resolveCmsAssetById(content, hero?.assetId);
  const tournament = findAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']);
  const jackpot = findAsset(content, ['jackpot', 'แจ็คพอต']);
  const leaderboard = findAsset(content, ['leaderboard', 'ranking', 'อันดับ']);
  const partner = findAsset(content, ['partner', 'provider', 'พันธมิตร']);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setActiveBanner((current) => (current + 1) % banners.length), 5000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (activeBanner >= banners.length) setActiveBanner(0);
  }, [activeBanner, banners.length]);

  return (
    <section className="v47-mobile-home" aria-label="หน้าแรกมือถือ">
      <div className="v47-mobile-announcement"><Icon value={V47_ASSETS.announcement} />คาสิโนออนไลน์ครบทุกค่าย เปิดให้บริการตลอด 24 ชั่วโมง</div>

      <a className="v47-mobile-hero" href={hero?.href || '/promotions'}>
        {heroImage ? <img key={heroImage} src={heroImage} alt={hero?.title || siteName} onError={hideBrokenImage} /> : <div className="v47-mobile-hero-fallback">{siteName}</div>}
      </a>
      <div className="v47-mobile-dots" aria-label="เลือกแบนเนอร์">{(banners.length ? banners : Array.from({ length: 5 })).map((_, index) => <button key={index} type="button" className={index === activeBanner ? 'active' : ''} onClick={() => setActiveBanner(index)} aria-label={`แบนเนอร์ ${index + 1}`} />)}</div>

      <div className="v47-mobile-quick-grid">
        <QuickCard icon={V47_ASSETS.quickPromotion} title="โปรโมชั่น" href="/promotions" />
        <QuickCard icon={V47_ASSETS.quickActivity} title="กิจกรรม" href="/promotions" />
        <QuickCard icon={V47_ASSETS.quickNews} title="ข่าวสาร" href="/notifications" />
      </div>

      <a className="v47-mobile-tournament-banner" href="/promotions">
        <img src={resolveV47Asset(tournament?.url, 'tournament')} alt="Tournament" onError={hideBrokenImage} />
        <span><small>TOURNAMENT</small><strong>เข้าร่วมชิงความเป็นที่ 1</strong></span>
        <b>เข้าแข่งขัน ›</b>
      </a>

      <section className="v47-mobile-panel v47-mobile-rank-panel">
        <SectionTitle icon={resolveV47Asset(tournament?.url, 'tournament')} title="ทัวร์นาเมนต์" />
        <div className="v47-mobile-rank-title"><strong>No.1 Tournament Football Royale ครั้งที่ 2</strong><a href="/promotions">ดูทั้งหมด ›</a></div>
        <div className="v47-mobile-ranks">{Array.from({ length: 3 }, (_, index) => <article key={index}><span className="v47-mobile-rank-badge"><img src={V47_ASSETS.rankTop3} alt="" onError={hideBrokenImage} /><b>{index + 1}</b></span><span>ZAX00{[790740, 664100, 844010][index]}</span><strong>{[20, 17, 13][index]}</strong><small>● ● ● ● ●</small></article>)}</div>
      </section>

      <section className="v47-mobile-jackpot"><img src={resolveV47Asset(jackpot?.url, 'jackpot')} alt="Jackpot" onError={hideBrokenImage} /><span><small>JACKPOTS</small><strong>194,428,645</strong><em>Epic of the day</em></span></section>

      <section className="v47-mobile-panel"><SectionTitle icon={leaderboard?.url || icons.vip} title="Leaderboard" action="ดูทั้งหมด" /><div className="v47-mobile-board-head"><span>อันดับ</span><span>ชื่อผู้เล่น</span><span>รางวัล</span></div>{Array.from({ length: 5 }, (_, index) => <div className="v47-mobile-board-row" key={index}><span className="v47-mobile-board-badge"><img src={index < 3 ? V47_ASSETS.rankTop3 : V47_ASSETS.rankOther} alt="" onError={hideBrokenImage} /><b>{index + 1}</b></span><span>0{980000018 - index * 8241}</span><em>{[15000, 5700, 3500, 2904, 2100][index]?.toLocaleString()}</em></div>)}</section>

      <GameSection title="Top 10 Popular Games" icon={V47_ASSETS.mobilePopular} games={popular} loading={isGamesLoading} message={gamesMessage} />
      <GameSection title="Most Online Now" icon={icons.games} games={online} loading={isGamesLoading} message={gamesMessage} />

      <section className="v47-mobile-panel v47-mobile-live"><SectionTitle icon={V47_ASSETS.live} title="Live Now!!" action="ดูทั้งหมด" /><article><small>MEA ฟุตบอลลีก</small><div><span>บลูเวฟ ชลบุรี</span><i>VS</i><span>ภูเก็ต ยูไนเต็ด</span></div><footer><a href="/login">ดูถ่ายทอดสด</a><a href="/login">เดิมพันทันที</a></footer></article></section>

      <GameSection title="Classic Games" icon={icons.games} games={classic} loading={isGamesLoading} message={gamesMessage} />

      <section className="v47-mobile-panel v47-mobile-guide"><SectionTitle icon={V47_ASSETS.mobileFaq} title="Guide" />{(faqs.length ? faqs : fallbackFaqs()).map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}<a className="v47-mobile-guide-more" href="/guide">ดูทั้งหมด</a></section>

      <section className="v47-mobile-panel v47-mobile-partners"><SectionTitle icon={partner?.url || icons.affiliate} title="พันธมิตรของเรา" /><div>{providers.map((provider, index) => <span key={`${provider.code}-${index}`}>{provider.logoUrl ? <img src={normalizeUrl(provider.logoUrl)} alt={provider.name || provider.code || 'Provider'} onError={hideBrokenImage} /> : <b>{provider.code || provider.name}</b>}</span>)}</div></section>
    </section>
  );
}

function QuickCard({ icon, title, href }: { icon: string; title: string; href: string }) { return <a href={href}><Icon value={icon} /><strong>{title}</strong></a>; }
function SectionTitle({ icon, title, action }: { icon: string; title: string; action?: string }) { return <header className="v47-mobile-section-title"><span><Icon value={icon} /><strong>{title}</strong></span>{action ? <a href="/games">{action}</a> : null}</header>; }
function GameSection({ title, icon, games, loading, message }: { title: string; icon: string; games: Game[]; loading: boolean; message: string }) { return <section className="v47-mobile-panel"><SectionTitle icon={icon} title={title} action="ดูทั้งหมด" />{loading ? <div className="v47-mobile-empty">กำลังโหลดเกม...</div> : games.length ? <div className="v47-mobile-game-grid">{games.map((game, index) => <a href="/login?next=%2Fgames" key={`${game.id}-${index}`} className={index < 2 ? 'v47-mobile-game-card--hero' : undefined}><div><GameImage game={game} /><span>{game.isNew ? 'NEW' : 'HOT'}</span></div><span className="v47-mobile-game-meta"><b>{safeName(game)}</b><small>{game.provider?.name || game.provider?.code || 'Provider'}</small></span></a>)}</div> : <div className="v47-mobile-empty">{message || 'ยังไม่มีข้อมูลเกม'}</div>}</section>; }
function Icon({ value }: { value: string }) { return isImageValue(value) ? <img src={normalizeUrl(value)} alt="" onError={hideBrokenImage} /> : <span>{value}</span>; }
function GameImage({ game }: { game: Game }) { const src = resolveGameImage(game); return src ? <img src={src} alt={safeName(game)} loading="lazy" onError={hideBrokenImage} /> : <span className="v47-mobile-game-fallback">{safeName(game).slice(0, 1)}</span>; }
function resolveCmsAssetById(content: CmsContent, assetId?: string) { return assetId ? content.assets?.find((asset) => asset.enabled && asset.id === assetId)?.url || '' : ''; }
function findAsset(content: CmsContent, aliases: string[]) { const keys = aliases.map(normalize); return (content.assets || []).find((asset) => asset.enabled && asset.type === 'image' && asset.url && keys.some((key) => normalize(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`).includes(key))); }
function normalize(value: string) { return value.toLowerCase().replace(/[\s_\-./\\]+/g, ''); }
function uniqueGames(...groups: Game[][]) { const map = new Map<string, Game>(); groups.flat().forEach((game) => { const key = game?.id || `${game?.providerGameCode || ''}:${game?.name || ''}`; if (key && !map.has(key)) map.set(key, game); }); return [...map.values()]; }
function fillGames(primary: Game[], fallback: Game[], count: number) { return uniqueGames(primary || [], fallback).slice(0, count); }
function uniqueProviders(games: Game[]) { const map = new Map<string, NonNullable<Game['provider']>>(); games.forEach((game) => { const provider = game?.provider; const key = provider?.code || provider?.name; if (key && provider && !map.has(key)) map.set(key, provider); }); return [...map.values()]; }
function safeName(game: Game) { return typeof game.name === 'string' && game.name.trim() ? game.name : 'Game'; }
function resolveGameImage(game: Game) { const direct = game.imageUrl || game.iconUrl; if (direct) return normalizeUrl(direct); const media = Array.isArray(game.media) ? game.media : []; const value = media.find((item) => item?.cachedUrl)?.cachedUrl || media.find((item) => item?.sourceUrl)?.sourceUrl || ''; return value ? normalizeUrl(value) : ''; }
function normalizeUrl(value: string) { return /^https?:\/\//i.test(value) || value.startsWith('/') ? value : `/${value.replace(/^\.\//, '')}`; }
function isImageValue(value: string) { return /^(https?:\/\/|\/|\.\/)/i.test(value) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value); }
function fallbackFaqs() { return [{ question: 'ฝากเงินแบบโอนผ่านธนาคาร', answer: 'เลือกธนาคารที่ต้องการและทำตามขั้นตอนบนหน้าฝากเงิน' }, { question: 'ฝากเงินแบบ QR Payment', answer: 'สแกน QR และตรวจสอบยอดเงินก่อนยืนยันรายการ' }, { question: 'เติมเงินไม่เข้า ต้องทำยังไง?', answer: 'ติดต่อฝ่ายบริการพร้อมหลักฐานการทำรายการ' }]; }
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) { event.currentTarget.style.display = 'none'; }
