'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import type { CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';
import { REFERENCE_GAMES, REFERENCE_HERO_SLIDES, type ReferenceAsset } from '../reference-asset-catalog';
import { resolveHomeGameFallback, resolveHomeGameImage } from './local-game-asset-resolver';
import UsageGuidePreview from './usage-guide-preview';
import { V47_ASSETS, resolveV47Asset } from './v47-asset-map';

const PROJECT_FALLBACK_BANNERS: CmsContent['banners'] = REFERENCE_HERO_SLIDES.map((slide) => ({
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
  onOpenPromotion?: () => void;
  onOpenActivity?: () => void;
  onOpenNews?: () => void;
};

export function MobileV47Scaffold({
  content,
  siteName,
  games,
  isGamesLoading,
  gamesMessage,
  onOpenPromotion = () => undefined,
  onOpenActivity = () => undefined,
  onOpenNews = () => undefined,
}: Props) {
  const configuredBanners = Array.isArray(content.banners) ? content.banners.filter((item) => item.enabled) : [];
  const banners = configuredBanners.length ? configuredBanners : PROJECT_FALLBACK_BANNERS;
  const announcements = Array.isArray(content.announcements)
    ? content.announcements.filter((item) => item.enabled)
    : [];
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const popular = fillGames(games.popular, allGames, 6);
  const online = fillGames(allGames.slice(2), allGames, 6);
  const classic = fillGames(allGames.slice(8), allGames, 6);
  const [activeBanner, setActiveBanner] = useState(0);
  const hero = banners[activeBanner] ?? banners[0];
  const heroImage = hero?.imageUrl || resolveCmsAssetById(content, hero?.assetId);
  const heroFallback = REFERENCE_HERO_SLIDES[activeBanner % REFERENCE_HERO_SLIDES.length]!.url;
  const announcement = announcements[0];
  const tournament = findAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']);
  const jackpot = findAsset(content, ['jackpot', 'แจ็คพอต']);
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
      <div className="v47-mobile-announcement">
        <Icon value={V47_ASSETS.announcement} />
        <span>
          {announcement?.message || announcement?.title || 'คาสิโนออนไลน์ครบทุกค่าย เปิดให้บริการตลอด 24 ชั่วโมง'}
        </span>
      </div>

      <a className="v47-mobile-hero" href="/browse/promotions">
        <img
          key={heroImage || heroFallback}
          src={heroImage || heroFallback}
          alt={hero?.title || siteName}
          onError={(event) => swapBrokenImage(event, heroFallback)}
        />
      </a>
      <div className="v47-mobile-dots" aria-label="เลือกแบนเนอร์">
        {banners.map((banner, index) => (
          <button
            key={`${banner.title}-${index}`}
            type="button"
            className={index === activeBanner ? 'active' : ''}
            onClick={() => setActiveBanner(index)}
            aria-label={`แบนเนอร์ ${index + 1}: ${banner.title}`}
          />
        ))}
      </div>

      <div className="v47-mobile-quick-grid">
        <QuickCard icon={V47_ASSETS.quickPromotion} title="โปรโมชั่น" onClick={onOpenPromotion} />
        <QuickCard icon={V47_ASSETS.quickActivity} title="กิจกรรม" onClick={onOpenActivity} />
        <QuickCard icon={V47_ASSETS.quickNews} title="ข่าวสาร" onClick={onOpenNews} />
      </div>

      <a className="v47-mobile-tournament-banner" href="/browse/promotions?view=activity">
        <img
          src={resolveV47Asset(tournament?.url, 'tournament')}
          alt="Tournament"
          onError={(event) => swapBrokenImage(event, V47_ASSETS.tournament)}
        />
        <span>
          <small>TOURNAMENT</small>
          <strong>เข้าร่วมชิงความเป็นที่ 1</strong>
        </span>
        <b>เข้าแข่งขัน ›</b>
      </a>

      <section className="v47-mobile-panel v47-mobile-rank-panel" data-section-kind="tournament">
        <SectionTitle icon={V47_ASSETS.tournamentIcon} title="ทัวร์นาเมนต์" />
        <div className="v47-mobile-rank-title">
          <strong>No.1 Tournament Football Royale ครั้งที่ 2</strong>
          <a href="/browse/promotions?view=activity">ดูทั้งหมด ›</a>
        </div>
        <div className="v47-mobile-ranks" data-drag-scroll="true">
          {Array.from({ length: 3 }, (_, index) => (
            <article key={index}>
              <span className="v47-mobile-rank-badge">
                <img src={MOBILE_RANK_ART[index]!} alt={`อันดับ ${index + 1}`} onError={hideBrokenImage} />
                <b>{index + 1}</b>
              </span>
              <span>ZAX00{[790740, 664100, 844010][index]}</span>
              <strong>{[20, 17, 13][index]}</strong>
              <small>● ● ● ● ●</small>
            </article>
          ))}
        </div>
      </section>

      <section className="v47-mobile-jackpot">
        <img
          src={V47_ASSETS.jackpot || jackpot?.url}
          alt="Jackpot"
          onError={(event) => swapBrokenImage(event, V47_ASSETS.jackpotStill)}
        />
        <span>
          <small>JACKPOTS</small>
          <strong>194,428,645</strong>
          <em>Epic of the day</em>
        </span>
      </section>

      <section className="v47-mobile-panel" data-section-kind="leaderboard">
        <SectionTitle icon={V47_ASSETS.leaderboard} title="Leaderboard" action="ดูทั้งหมด" />
        <div className="v47-mobile-board-head">
          <span>อันดับ</span>
          <span>ชื่อผู้เล่น</span>
          <span>รางวัล</span>
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div className="v47-mobile-board-row" key={index}>
            <span className="v47-mobile-board-badge">
              {index < 3 ? (
                <img src={MOBILE_RANK_ART[index]!} alt={`อันดับ ${index + 1}`} onError={hideBrokenImage} />
              ) : (
                <img src={V47_ASSETS.rankOther} alt="" onError={hideBrokenImage} />
              )}
              <b>{index + 1}</b>
            </span>
            <span>0{980000018 - index * 8241}</span>
            <em>{[15000, 5700, 3500, 2904, 2100][index]?.toLocaleString()}</em>
          </div>
        ))}
      </section>

      <section className="v47-mobile-panel v47-mobile-mini-games" data-section-kind="mini">
        <SectionTitle icon={V47_ASSETS.miniGame} title="Mini Game" />
        <div>
          <a href="/?auth=login">
            <img src={V47_ASSETS.miniGameWheel || miniWheel?.url} alt="วงล้อ" onError={hideBrokenImage} />
            <span>
              <strong>วงล้อ</strong>
              <small>ลุ้นรางวัลทุกวัน</small>
            </span>
          </a>
          <a href="/?auth=login">
            <img src={V47_ASSETS.miniGameMission || miniCard?.url} alt="ทายการ์ด" onError={hideBrokenImage} />
            <span>
              <strong>ทายการ์ด</strong>
              <small>เล่นง่าย รับรางวัล</small>
            </span>
          </a>
        </div>
      </section>

      <GameSection
        kind="popular"
        title="Top 10 Popular Games"
        icon={V47_ASSETS.gameHit}
        games={popular}
        loading={isGamesLoading}
        message={gamesMessage}
        fallbackGames={REFERENCE_GAMES.slice(0, 6)}
      />
      <GameSection
        kind="online"
        title="Most Online Now"
        icon={V47_ASSETS.mostOnline}
        games={online}
        loading={isGamesLoading}
        message={gamesMessage}
        fallbackGames={REFERENCE_GAMES.slice(6, 12)}
      />

      <section className="v47-mobile-panel v47-mobile-live" data-section-kind="live">
        <SectionTitle icon={V47_ASSETS.liveIcon} title="Live Now!!" action="ดูทั้งหมด" />
        <article>
          <small>MEA ฟุตบอลลีก</small>
          <div>
            <span>บลูเวฟ ชลบุรี</span>
            <i>VS</i>
            <span>ภูเก็ต ยูไนเต็ด</span>
          </div>
          <footer>
            <a href="/?auth=login">ดูถ่ายทอดสด</a>
            <a href="/?auth=login">เดิมพันทันที</a>
          </footer>
        </article>
      </section>

      <GameSection
        kind="classic"
        title="Classic Games"
        icon={V47_ASSETS.gameHit}
        games={classic}
        loading={isGamesLoading}
        message={gamesMessage}
        fallbackGames={REFERENCE_GAMES.slice(12, 18)}
      />

      <section className="v47-mobile-panel v47-mobile-guide" data-section-kind="guide">
        <UsageGuidePreview mobile />
      </section>
    </section>
  );
}

function QuickCard({
  icon,
  title,
  href,
  onClick,
}: {
  icon: string;
  title: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon value={icon} />
      <strong>{title}</strong>
    </>
  );
  if (onClick)
    return (
      <button type="button" className="v47-mobile-quick-card" onClick={onClick}>
        {content}
      </button>
    );
  return <a href={href}>{content}</a>;
}
function SectionTitle({ icon, title, action }: { icon: string; title: string; action?: string }) {
  return (
    <header className="v47-mobile-section-title">
      <span>
        <Icon value={icon} />
        <strong>{title}</strong>
      </span>
      {action ? <a href="/browse/games">{action}</a> : null}
    </header>
  );
}
function GameSection({
  kind,
  title,
  icon,
  games,
  loading,
  message,
  fallbackGames,
}: {
  kind: 'popular' | 'online' | 'classic';
  title: string;
  icon: string;
  games: Game[];
  loading: boolean;
  message: string;
  fallbackGames: ReferenceAsset[];
}) {
  return (
    <section className="v47-mobile-panel" data-section-kind={kind}>
      <SectionTitle icon={icon} title={title} action="ดูทั้งหมด" />
      {loading ? (
        <div className="v47-mobile-empty">กำลังโหลดเกม...</div>
      ) : games.length ? (
        <div className="v47-mobile-game-grid" data-drag-scroll="true">
          {games.map((game, index) => (
            <a
              href="/browse/games"
              key={`${game.id}-${index}`}
              className={index < 2 ? 'v47-mobile-game-card--hero' : undefined}
            >
              <div>
                <GameImage game={game} />
                <span>{game.isNew ? 'NEW' : 'HOT'}</span>
              </div>
              <span className="v47-mobile-game-meta">
                <b>{safeName(game)}</b>
                <small>{game.provider?.name || game.provider?.code || 'Provider'}</small>
              </span>
            </a>
          ))}
        </div>
      ) : (
        <ReferenceGameGrid games={fallbackGames} message={message} />
      )}
    </section>
  );
}
function ReferenceGameGrid({ games, message }: { games: ReferenceAsset[]; message: string }) {
  return (
    <div className="v47-mobile-game-grid" data-drag-scroll="true" aria-label={message || 'เกมจากชุด asset'}>
      {games.map((game, index) => (
        <a href="/browse/games" key={game.name} className={index < 2 ? 'v47-mobile-game-card--hero' : undefined}>
          <div>
            <img src={game.url} alt={game.name} loading="lazy" onError={hideBrokenImage} />
            <span>HOT</span>
          </div>
          <span className="v47-mobile-game-meta">
            <b>{game.name}</b>
            <small>NOAH345</small>
          </span>
        </a>
      ))}
    </div>
  );
}
function Icon({ value }: { value: string }) {
  return isImageValue(value) ? (
    <img src={normalizeUrl(value)} alt="" onError={hideBrokenImage} />
  ) : (
    <span>{value}</span>
  );
}
function GameImage({ game }: { game: Game }) {
  const fallback = resolveHomeGameFallback(game);
  const src = resolveHomeGameImage(game) || fallback;
  return <img src={src} alt={safeName(game)} loading="lazy" onError={(event) => swapBrokenImage(event, fallback)} />;
}
function resolveCmsAssetById(content: CmsContent, assetId?: string) {
  return assetId ? content.assets?.find((asset) => asset.enabled && asset.id === assetId)?.url || '' : '';
}
function findAsset(content: CmsContent, aliases: string[]) {
  const keys = aliases.map(normalize);
  return (content.assets || []).find(
    (asset) =>
      asset.enabled &&
      asset.type === 'image' &&
      asset.url &&
      keys.some((key) => normalize(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`).includes(key)),
  );
}
function normalize(value: string) {
  return value.toLowerCase().replace(/[\s_\-./\\]+/g, '');
}
function uniqueGames(...groups: Game[][]) {
  const map = new Map<string, Game>();
  groups.flat().forEach((game) => {
    const key = game?.id || `${game?.providerGameCode || ''}:${game?.name || ''}`;
    if (key && !map.has(key)) map.set(key, game);
  });
  return [...map.values()];
}
function fillGames(primary: Game[], fallback: Game[], count: number) {
  return uniqueGames(primary || [], fallback).slice(0, count);
}
function safeName(game: Game) {
  return typeof game.name === 'string' && game.name.trim() ? game.name : 'Game';
}
function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('/') ? value : `/${value.replace(/^\.\//, '')}`;
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
