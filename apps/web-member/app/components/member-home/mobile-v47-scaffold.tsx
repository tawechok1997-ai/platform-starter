'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import type { CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';
import {
  REFERENCE_GAMES,
  REFERENCE_HERO_SLIDES,
  REFERENCE_PROVIDERS,
  type ReferenceAsset,
} from '../reference-asset-catalog';
import { V47_ASSETS, resolveV47Asset } from './v47-asset-map';

const PROJECT_FALLBACK_BANNERS: CmsContent['banners'] = REFERENCE_HERO_SLIDES.map((slide, index) => ({
  id: `fallback-banner-${index + 1}`,
  title: slide.name,
  subtitle: 'โปรโมชั่นแนะนำ',
  imageUrl: slide.url,
  href: '/promotions',
  enabled: true,
}));

const MOBILE_RANK_ART = [V47_ASSETS.rank1, V47_ASSETS.rank2, V47_ASSETS.rank3] as const;

type Props = {
  content: CmsContent;
  icons: SiteIconSettings;
  siteName: string;
  games: { featured: Game[]; popular: Game[]; recent: Game[]; favorites: Game[] };
  isGamesLoading: boolean;
  gamesMessage: string;
};

export function MobileV47Scaffold({ content, icons, siteName, games, isGamesLoading, gamesMessage }: Props) {
  const configuredBanners = Array.isArray(content.banners) ? content.banners.filter((item) => item.enabled) : [];
  const banners = configuredBanners.length ? configuredBanners : PROJECT_FALLBACK_BANNERS;
  const announcements = Array.isArray(content.announcements) ? content.announcements.filter((item) => item.enabled) : [];
  const faqs = Array.isArray(content.faqs) ? content.faqs.filter((item) => item.enabled).slice(0, 5) : [];
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const popular = fillGames(games.popular, allGames, 6);
  const online = fillGames(allGames.slice(2), allGames, 6);
  const classic = fillGames(allGames.slice(8), allGames, 6);
  const providers = uniqueProviders(allGames).slice(0, 12);
  const [activeBanner, setActiveBanner] = useState(0);
  const hero = banners[activeBanner] ?? banners[0];
  const heroImage = hero?.imageUrl || resolveCmsAssetById(content, hero?.assetId);
  const heroFallback = REFERENCE_HERO_SLIDES[activeBanner % REFERENCE_HERO_SLIDES.length]!.url;
  const announcement = announcements[0];
  const tournament = findAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']);
  const jackpot = findAsset(content, ['jackpot', 'แจ็คพอต']);
  const partner = findAsset(content, ['partner', 'provider', 'พันธมิตร']);
  const miniWheel = findAsset(content, ['wheel', 'lucky wheel', 'วงล้อ']);
  const miniCard = findAsset(content, ['card', 'mission', 'ไพ่', 'ภารกิจ']);

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
      <div className="v47-mobile-announcement"><Icon value={V47_ASSETS.announcement} /><span>{announcement?.message || announcement?.title || 'คาสิโนออนไลน์ครบทุกค่าย เปิดให้บริการตลอด 24 ชั่วโมง'}</span></div>

      <a className="v47-mobile-hero" href="/browse/promotions">
        <img key={heroImage || heroFallback} src={heroImage || heroFallback} alt={hero?.title || siteName} onError={(event) => swapBrokenImage(event, heroFallback)} />
      </a>
      <div className="v47-mobile-dots" aria-label="เลือกแบนเนอร์">{banners.map((banner, index) => <button key={`${banner.title}-${index}`} type="button" className={index === activeBanner ? 'active' : ''} onClick={() => setActiveBanner(index)} aria-label={`แบนเนอร์ ${index + 1}`} />)}</div>

      <div className="v47-mobile-promo-grid">
        <PromoTile href="/promotions" image={V47_ASSETS.quickPromotion} background={V47_ASSETS.promoBackgroundPromotion} title="โปรโมชั่นพิเศษ" subtitle="โปรโมชั่นพิเศษเฉพาะคุณ" />
        <PromoTile href="/promotions" image={V47_ASSETS.quickActivity} background={V47_ASSETS.promoBackgroundActivity} title="กิจกรรม" subtitle="กิจกรรมตลอด 24 ชั่วโมง" />
        <PromoTile href="/promotions" image={V47_ASSETS.quickNews} background={V47_ASSETS.promoBackgroundNews} title="ข่าวสาร" subtitle="ข่าวสารที่คุณไม่ควรพลาด" />
      </div>

      <section className="v47-mobile-panel v47-mobile-tournament">
        <PanelTitle icon={V47_ASSETS.tournamentIcon} title="ทัวร์นาเมนต์" href="/promotions" />
        <img className="v47-mobile-tournament-art" src={tournament?.url || V47_ASSETS.tournament} alt="Tournament" onError={(event) => swapBrokenImage(event, V47_ASSETS.tournament)} />
        <div className="v47-mobile-ranking-scroll">{MOBILE_RANK_ART.map((art, index) => <article key={art} className="v47-mobile-rank-card"><img src={art} alt={`อันดับ ${index + 1}`} onError={hideBrokenImage} /><strong>ผู้เล่น {index + 1}</strong><span>{20 - index * 3}</span></article>)}</div>
      </section>

      <section className="v47-mobile-panel"><PanelTitle icon={V47_ASSETS.gameHit} title="Top 10 Popular Games" /><GameRail games={popular} fallback={REFERENCE_GAMES.slice(0, 6)} loading={isGamesLoading} message={gamesMessage} /></section>
      <section className="v47-mobile-panel"><PanelTitle icon={V47_ASSETS.mostOnline} title="Most online game" /><GameRail games={online} fallback={REFERENCE_GAMES.slice(4, 10)} /></section>
      <section className="v47-mobile-panel"><PanelTitle icon={V47_ASSETS.classic} title="Classic games" /><GameRail games={classic} fallback={REFERENCE_GAMES.slice(10, 16)} /></section>

      <section className="v47-mobile-panel v47-mobile-live"><PanelTitle icon={V47_ASSETS.live} title="Live Now" /><img src={V47_ASSETS.liveBackground} alt="Live games" onError={hideBrokenImage} /><strong>ถ่ายทอดสดตลอด 24 ชั่วโมง</strong><a href="/games">เล่นเลย</a></section>

      <section className="v47-mobile-mini-grid">
        <a href="/promotions" className="v47-mobile-mini-card"><img src={jackpot?.url || miniWheel?.url || V47_ASSETS.jackpot} alt="Jackpot" onError={hideBrokenImage} /><strong>แจ็คพอต</strong></a>
        <a href="/promotions" className="v47-mobile-mini-card"><img src={miniCard?.url || V47_ASSETS.tournament} alt="กิจกรรม" onError={hideBrokenImage} /><strong>กิจกรรม</strong></a>
      </section>

      <section className="v47-mobile-panel"><PanelTitle icon={partner?.url || V47_ASSETS.partner} title="พันธมิตรของเรา" /><div className="v47-mobile-provider-grid">{(providers.length ? providers : REFERENCE_PROVIDERS).map((provider) => <span key={provider.name}><img src={provider.url} alt={provider.name} onError={hideBrokenImage} /></span>)}</div></section>

      <section className="v47-mobile-panel"><PanelTitle icon={V47_ASSETS.guide} title="คู่มือช่วยเหลือ" /><div className="v47-mobile-faq-list">{(faqs.length ? faqs : [{ question: 'สมัครสมาชิกอย่างไร', answer: 'กดสมัครสมาชิกและกรอกข้อมูลให้ครบถ้วน' }, { question: 'ฝากเงินอย่างไร', answer: 'เลือกเมนูฝากเงินและทำตามขั้นตอน' }, { question: 'ถอนเงินอย่างไร', answer: 'เลือกบัญชีธนาคารและระบุจำนวนเงิน' }]).map((faq, index) => <details key={`${faq.question}-${index}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>
    </section>
  );
}

function PromoTile({ href, image, background, title, subtitle }: { href: string; image: string; background: string; title: string; subtitle: string }) { return <a href={href} className="v47-mobile-promo-card"><img className="v47-mobile-promo-bg" src={background} alt="" aria-hidden="true" onError={hideBrokenImage} /><img className="v47-mobile-promo-icon" src={image} alt="" aria-hidden="true" onError={hideBrokenImage} /><span><strong>{title}</strong><small>{subtitle}</small></span></a>; }
function PanelTitle({ icon, title, href }: { icon: string; title: string; href?: string }) { return <header className="v47-mobile-panel-title"><Icon value={icon} /><strong>{title}</strong>{href && <a href={href}>ดูทั้งหมด ›</a>}</header>; }
function Icon({ value }: { value: string }) { return <span aria-hidden="true">{isImage(value) ? <img src={resolveV47Asset(value)} alt="" onError={hideBrokenImage} /> : value}</span>; }
function GameRail({ games, fallback, loading = false, message = '' }: { games: Game[]; fallback: readonly ReferenceAsset[]; loading?: boolean; message?: string }) { if (loading) return <p className="v47-mobile-empty">กำลังโหลดเกม...</p>; const items = games.length ? games.slice(0, 8).map((game) => ({ name: safeGameName(game), url: resolveGameImage(game) || fallbackForGame(game) })) : fallback; return <>{message && !games.length ? <p className="v47-mobile-empty">{message}</p> : null}<div className="v47-mobile-game-rail">{items.map((item, index) => <a key={`${item.name}-${index}`} href="/games"><img src={item.url} alt={item.name} onError={(event) => swapBrokenImage(event, fallback[index % fallback.length]?.url || REFERENCE_GAMES[0]!.url)} /><strong>{item.name}</strong></a>)}</div></>; }
function uniqueGames(...groups: Game[][]) { const seen = new Set<string>(); return groups.flat().filter((game) => { const key = String(game?.id || game?.providerGameCode || game?.name || ''); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
function fillGames(primary: Game[], pool: Game[], count: number) { return uniqueGames(primary, pool).slice(0, count); }
function uniqueProviders(games: Game[]) { const seen = new Set<string>(); return games.map((game) => ({ name: game.provider?.name || game.provider?.code || '', url: game.provider?.logoUrl || '' })).filter((item) => { const key = `${item.name}:${item.url}`; if (!item.name || !item.url || seen.has(key)) return false; seen.add(key); return true; }); }
function safeGameName(game: Game) { return String(game?.name || game?.providerGameCode || 'เกม'); }
function resolveGameImage(game: Game) { const asset = game?.media?.find((item) => item?.enabled && item.type === 'image' && item.url); return String(game?.imageUrl || asset?.url || game?.provider?.logoUrl || ''); }
function fallbackForGame(game: Game) { const seed = `${game?.id || ''}:${game?.providerGameCode || ''}:${safeGameName(game)}`; let hash = 0; for (let index = 0; index < seed.length; index += 1) hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0; return REFERENCE_GAMES[Math.abs(hash) % REFERENCE_GAMES.length]!.url; }
function findAsset(content: CmsContent, aliases: string[]) { const normalized = aliases.map(normalize); return (Array.isArray(content.assets) ? content.assets : []).find((asset) => { if (!asset?.enabled || asset.type !== 'image' || !asset.url) return false; const haystack = normalize(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`); return normalized.some((alias) => haystack.includes(alias)); }); }
function resolveCmsAssetById(content: CmsContent, assetId?: string) { if (!assetId) return ''; return content.assets.find((asset) => asset.id === assetId && asset.enabled)?.url || ''; }
function normalize(value: string) { return value.toLowerCase().replace(/[\s_\-./\\]+/g, ''); }
function isImage(value: string) { return /^https?:\/\//i.test(value) || value.startsWith('/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value); }
function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) { event.currentTarget.style.display = 'none'; }
function swapBrokenImage(event: SyntheticEvent<HTMLImageElement>, fallback: string) { const image = event.currentTarget; if (image.dataset.fallbackApplied === 'true') return hideBrokenImage(event); image.dataset.fallbackApplied = 'true'; image.src = fallback; }
