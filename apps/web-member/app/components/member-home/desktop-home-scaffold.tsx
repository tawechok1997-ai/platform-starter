'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { useMemberLocale, type MemberLocale } from '../../member-locale-provider';
import type { CmsAsset, CmsContent, SiteIconSettings } from '../../site-settings';
import type { Game } from '../../types/member-api';
import { useMemberSession } from '../../member-session-provider';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from '../reference-asset-catalog';
import { DesktopHeroCarousel } from './desktop-hero-carousel';
import { DesktopJackpotCard } from './desktop-jackpot-card';
import DesktopMiniGameSource from './desktop-mini-game-source';
import { SourceLiveSection, SourceOnlineSection, SourcePopularSection } from './member-source-feed-sections';
import { DesktopTournamentBoard } from './desktop-tournament-board';
import UsageGuidePreview from './usage-guide-preview';
import {
  normalizePublicAssetUrl,
  resolveHomeGameFallback,
  resolveHomeGameImage,
  resolveHomeProviderLogo,
} from './local-game-asset-resolver';
import { V47_ASSETS } from './v47-asset-map';

type DesktopGameSections = { featured: Game[]; popular: Game[]; recent: Game[]; favorites: Game[] };
type DesktopHomeProps = {
  content: CmsContent;
  icons: SiteIconSettings;
  siteName: string;
  showPromotion: boolean;
  games: DesktopGameSections;
  isGamesLoading: boolean;
  gamesMessage: string;
  onOpenPromotion?: () => void;
  onOpenActivity?: () => void;
  onOpenNews?: () => void;
};
type PromoCard = {
  key: 'promotion' | 'activity' | 'news';
  href: string;
  aliases: string[];
  fallback: string;
  assetUrl: string;
  backgroundUrl: string;
};
type ArchiveGame = { name: string; imageUrl: string };
type DesktopHomeCopy = {
  pageLabel: string;
  announcement: string;
  promoGroup: string;
  promoCards: Record<PromoCard['key'], { title: string; subtitle: string; openLabel: string }>;
  tournamentImageAlt: string;
  tournamentEyebrow: string;
  tournamentTitle: string;
  tournamentAction: string;
  classicTitle: string;
  sidebarLabel: string;
  leaderboardTitle: string;
  rank: string;
  gameJackpot: string;
  won: string;
  highlightTitle: string;
  highlightPicker: string;
  image: string;
  gameFallback: string;
};

const DESKTOP_HOME_COPY: Record<MemberLocale, DesktopHomeCopy> = {
  th: {
    pageLabel: 'หน้าแรกเดสก์ท็อป',
    announcement: 'ยินดีต้อนรับสู่ NOAH345 โปรโมชั่น กิจกรรม และเกมใหม่อัปเดตตลอด 24 ชั่วโมง',
    promoGroup: 'โปรโมชั่น กิจกรรม และข่าวสาร',
    promoCards: {
      promotion: { title: 'โปรโมชั่นพิเศษ', subtitle: 'โปรโมชั่นพิเศษเฉพาะคุณ', openLabel: 'เปิดโปรโมชั่นพิเศษ' },
      activity: { title: 'กิจกรรม', subtitle: 'กิจกรรมตลอด 24 ชั่วโมง', openLabel: 'เปิดกิจกรรม' },
      news: { title: 'ข่าวสาร', subtitle: 'ข่าวสารที่คุณไม่ควรพลาด', openLabel: 'เปิดข่าวสาร' },
    },
    tournamentImageAlt: 'เข้าร่วมการแข่งขันทัวร์นาเมนต์',
    tournamentEyebrow: 'ร่วมสนุกกับกิจกรรมทัวร์นาเมนต์',
    tournamentTitle: 'เข้าร่วมชิงความเป็นที่ 1',
    tournamentAction: 'เข้าแข่งขัน ›',
    classicTitle: 'เกมคลาสสิก',
    sidebarLabel: 'ข้อมูลรางวัลและอันดับ',
    leaderboardTitle: 'ตารางอันดับ',
    rank: 'ลำดับ',
    gameJackpot: 'เกม/แจ็กพอต',
    won: 'ชนะ',
    highlightTitle: 'เกมไฮไลท์',
    highlightPicker: 'เลือกภาพเกมไฮไลท์',
    image: 'ภาพที่',
    gameFallback: 'เกม',
  },
  en: {
    pageLabel: 'Desktop home',
    announcement: 'Welcome to NOAH345. Promotions, activities, and new games are updated around the clock.',
    promoGroup: 'Promotions, activities, and news',
    promoCards: {
      promotion: { title: 'Special Promotions', subtitle: 'Offers selected for you', openLabel: 'Open special promotions' },
      activity: { title: 'Activities', subtitle: 'Activities available around the clock', openLabel: 'Open activities' },
      news: { title: 'News', subtitle: 'Updates you should not miss', openLabel: 'Open news' },
    },
    tournamentImageAlt: 'Join the tournament',
    tournamentEyebrow: 'Take part in tournament activities',
    tournamentTitle: 'Compete for the number one spot',
    tournamentAction: 'Join now ›',
    classicTitle: 'Classic Games',
    sidebarLabel: 'Rewards and rankings',
    leaderboardTitle: 'Leaderboard',
    rank: 'Rank',
    gameJackpot: 'Game/Jackpot',
    won: 'Won',
    highlightTitle: 'Featured Games',
    highlightPicker: 'Choose a featured-game image',
    image: 'Image',
    gameFallback: 'Game',
  },
};

const PROMO_CARDS: PromoCard[] = [
  {
    key: 'promotion',
    href: '/browse/promotions?view=promotion',
    aliases: ['promotion', 'promo', 'bonus', 'reward', 'โปรโมชั่น'],
    fallback: '✦',
    assetUrl: V47_ASSETS.quickPromotion,
    backgroundUrl: V47_ASSETS.promoBackgroundPromotion,
  },
  {
    key: 'activity',
    href: '/browse/promotions?view=activity',
    aliases: ['activity', 'event', 'mission', 'กิจกรรม'],
    fallback: '♤',
    assetUrl: V47_ASSETS.quickActivity,
    backgroundUrl: V47_ASSETS.promoBackgroundActivity,
  },
  {
    key: 'news',
    href: '/browse/promotions?view=news',
    aliases: ['news', 'announcement', 'notice', 'ข่าว'],
    fallback: '◇',
    assetUrl: V47_ASSETS.quickNews,
    backgroundUrl: V47_ASSETS.promoBackgroundNews,
  },
];

const SOURCE_HIGHLIGHT_BANNERS = [
  '/assets/asset-pc/images/_INIT/highlight/1731332886257-a7188fa9-8abc-4e47-9ea5-cfd777cb1abe.webp',
  '/assets/asset-pc/images/_INIT/highlight/1731332839344-d4557c6c-9f8f-4124-aa87-f533927c3885.webp',
  '/assets/asset-pc/images/_INIT/highlight/1731332920882-dee83096-8353-49b1-8a14-29c66a564c13.webp',
  '/assets/asset-pc/images/_INIT/highlight/1731332806809-ca83b9e9-d625-44e7-8185-b5122990a373.webp',
] as const;

const ARCHIVE_GAMES: ArchiveGame[] = REFERENCE_GAMES.map(({ name, url }) => ({ name, imageUrl: url }));
const RANK_ART = [V47_ASSETS.rank1, V47_ASSETS.rank2, V47_ASSETS.rank3] as const;
const LEADERBOARD_ITEMS = [
  { name: 'Fortune Dragon', user: '062XXXXX176', wins: '2,800', image: ARCHIVE_GAMES[12]!.imageUrl },
  { name: 'Lalika', user: '061XXXXX197', wins: '2,288', image: ARCHIVE_GAMES[13]!.imageUrl },
  { name: 'Fortune Gems 500', user: '081XXXXX58', wins: '2,135', image: ARCHIVE_GAMES[9]!.imageUrl },
  { name: 'DJ BOOM BOOM', user: '081XXXXX89', wins: '2,024', image: ARCHIVE_GAMES[3]!.imageUrl },
  { name: 'Funky Fortunes', user: '048XXXXX31', wins: '1,351', image: ARCHIVE_GAMES[6]!.imageUrl },
] as const;

export function DesktopHomeScaffold({
  content,
  siteName,
  showPromotion,
  games,
  isGamesLoading,
  gamesMessage,
  onOpenPromotion = () => undefined,
  onOpenActivity = () => undefined,
  onOpenNews = () => undefined,
}: DesktopHomeProps) {
  const { locale } = useMemberLocale();
  const copy = DESKTOP_HOME_COPY[locale];
  const { isLoggedIn } = useMemberSession();
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const featured = fillGames(games.featured, allGames, 8);
  const classic = fillGames(allGames.slice(8), allGames, 6);
  const popupActions = [onOpenPromotion, onOpenActivity, onOpenNews] as const;

  const assets = {
    tournament: findCmsAsset(content, ['tournament', 'competition', 'cup', 'ทัวร์นาเมนต์']),
    jackpot: findCmsAsset(content, ['jackpot', 'jackpots', 'แจ็คพอต']),
    featured: findCmsAsset(content, ['featured', 'highlight', 'recommended', 'เกมไฮไลท์', 'เกมไฮไลต์']),
    classic: findCmsAsset(content, ['classic', 'arcade', 'คลาสสิก']),
  };

  const openLiveAction = () => {
    if (isLoggedIn) {
      window.location.assign('/browse/games?category=sport');
      return;
    }

    const loginButton = document.querySelector<HTMLButtonElement>('button.member-guest-action--login');
    if (loginButton) loginButton.click();
    else window.location.assign('/?auth=login&next=%2Fbrowse%2Fgames%3Fcategory%3Dsport');
  };

  return (
    <section className="desktop-home desktop-reference-home" aria-label={copy.pageLabel}>
      <DesktopHeroCarousel content={content} siteName={siteName} showPromotion={showPromotion} />

      <div className="desktop-home__body">
        <main className="desktop-home__main reference-main-column">
          <div className="reference-announcement">
            <img src={V47_ASSETS.announcement} alt="" aria-hidden="true" onError={hideBrokenImage} />
            <div className="reference-announcement-viewport">
              <div className="reference-announcement-track">
                <span>{copy.announcement}</span>
              </div>
            </div>
          </div>

          <section className="reference-promo-row" aria-label={copy.promoGroup}>
            {PROMO_CARDS.map((card, index) => {
              const asset = findCmsAsset(content, card.aliases);
              const cardCopy = copy.promoCards[card.key];
              return (
                <button
                  key={card.key}
                  type="button"
                  className={`reference-promo-card reference-promo-card--${index + 1}`}
                  onClick={popupActions[index]}
                  aria-label={cardCopy.openLabel}
                >
                  <img
                    className="reference-promo-background"
                    src={card.backgroundUrl}
                    alt=""
                    aria-hidden="true"
                    onError={hideBrokenImage}
                  />
                  <AssetIcon
                    asset={asset}
                    configured={card.assetUrl}
                    fallback={card.fallback}
                    className="reference-promo-icon"
                  />
                  <span className="reference-promo-copy">
                    <strong>{cardCopy.title}</strong>
                    <small>{cardCopy.subtitle}</small>
                  </span>
                </button>
              );
            })}
          </section>

          <a href="/browse/promotions?view=activity" className="reference-tournament-cta">
            <img
              src={assets.tournament?.url || V47_ASSETS.tournament}
              alt={copy.tournamentImageAlt}
              onError={(event) => swapBrokenImage(event, V47_ASSETS.tournament)}
            />
            <span>
              <small>{copy.tournamentEyebrow}</small>
              <strong>TOURNAMENT {copy.tournamentTitle}</strong>
            </span>
            <b>{copy.tournamentAction}</b>
          </a>

          <DesktopTournamentBoard />
          <SourceHighlightSection
            asset={assets.featured}
            apiGames={featured}
            loading={isGamesLoading}
            message={gamesMessage}
            copy={copy}
          />
          <SourcePopularSection />
          <SourceOnlineSection />
          <SourceLiveSection onAction={openLiveAction} />

          <section className="reference-compact-section" data-section-kind="classic">
            <PanelHeading asset={assets.classic} configured={V47_ASSETS.gameHit} fallback="💧" title={copy.classicTitle} />
            <div className="reference-classic-row" data-drag-scroll="true">
              {classic.length
                ? classic.map((game) => <GameTile key={game.id} game={game} compact fallbackName={copy.gameFallback} />)
                : ARCHIVE_GAMES.slice(10, 16).map((game) => <ArchiveGameTile key={game.name} game={game} compact />)}
            </div>
          </section>

          <section className="reference-guide" id="guide" data-section-kind="guide">
            <UsageGuidePreview />
          </section>
        </main>

        <aside className="desktop-home__sidebar reference-sidebar" aria-label={copy.sidebarLabel}>
          <DesktopJackpotCard
            artUrl={assets.jackpot?.url || V47_ASSETS.jackpot}
            fallbackUrl={V47_ASSETS.jackpotStill}
            iconUrl={V47_ASSETS.coin}
          />
          <section className="reference-side-card reference-leaderboard">
            <header>
              <span className="reference-side-title">
                <AssetIcon configured={V47_ASSETS.leaderboard} fallback="🏆" className="reference-side-icon" />
                <strong>{copy.leaderboardTitle}</strong>
              </span>
            </header>
            <div className="reference-leaderboard-head" aria-hidden="true">
              <span>{copy.rank}</span>
              <strong>{copy.gameJackpot}</strong>
            </div>
            {LEADERBOARD_ITEMS.map((item, index) => (
              <div key={item.name}>
                <RankMark index={index} />
                <img
                  className="reference-leaderboard-game-image"
                  src={item.image}
                  alt=""
                  loading="lazy"
                  onError={hideBrokenImage}
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.user}</small>
                  <small>
                    {copy.won} <b>{item.wins}</b>
                  </small>
                </span>
                <em>›</em>
              </div>
            ))}
          </section>
          <DesktopMiniGameSource />
        </aside>
      </div>
    </section>
  );
}

function SourceHighlightSection({
  asset,
  apiGames,
  loading,
  message,
  copy,
}: {
  asset?: CmsAsset | undefined;
  apiGames: Game[];
  loading: boolean;
  message: string;
  copy: DesktopHomeCopy;
}) {
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
      name: safeGameName(apiGame, copy.gameFallback),
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
      aria-label={message || copy.highlightTitle}
      aria-busy={loading}
    >
      <div className="source-highlight-inner">
        <div className="source-highlight-glow" aria-hidden="true" />
        <header className="source-highlight-heading">
          <span className="source-highlight-heading__content">
            <AssetIcon
              asset={asset}
              configured={V47_ASSETS.star}
              fallback="★"
              className="source-highlight-heading__icon"
            />
            <strong>{copy.highlightTitle}</strong>
          </span>
        </header>

        <div className="source-highlight-content">
          <div className="source-highlight-hero">
            <a className="source-highlight-hero__link" href="/browse/games">
              <img
                key={SOURCE_HIGHLIGHT_BANNERS[activeBanner]}
                className="source-highlight-hero__image"
                src={SOURCE_HIGHLIGHT_BANNERS[activeBanner]}
                alt={copy.highlightTitle}
                onError={(event) => swapBrokenImage(event, bannerFallback)}
              />
            </a>
            <div className="source-highlight-hero__dots" aria-label={copy.highlightPicker}>
              {SOURCE_HIGHLIGHT_BANNERS.map((banner, index) => (
                <button
                  key={banner}
                  type="button"
                  className={`source-highlight-hero__dot${index === activeBanner ? ' is-active' : ''}`}
                  onClick={() => setActiveBanner(index)}
                  aria-label={`${copy.image} ${index + 1}`}
                  aria-current={index === activeBanner ? 'true' : undefined}
                />
              ))}
            </div>
          </div>

          <div className="source-highlight-games">
            {highlightGames.map((game, index) => (
              <a key={game.key} className="source-highlight-game" href="/browse/games" title={game.name}>
                <span className="source-highlight-game__art">
                  <img
                    className="source-highlight-game__blur"
                    src={game.imageUrl}
                    alt=""
                    aria-hidden="true"
                    onError={(event) => swapBrokenImage(event, game.fallback)}
                  />
                  <img
                    className="source-highlight-game__image"
                    src={game.imageUrl}
                    alt={game.name}
                    onError={(event) => swapBrokenImage(event, game.fallback)}
                  />
                  <span className="source-highlight-game__provider">
                    <img
                      src={game.providerLogo}
                      alt={game.providerName}
                      onError={(event) =>
                        swapBrokenImage(event, REFERENCE_PROVIDERS[index % REFERENCE_PROVIDERS.length]!.url)
                      }
                    />
                  </span>
                </span>
                <span className="source-highlight-game__name">{game.name}</span>
                <span className="source-highlight-game__rank" aria-hidden="true">
                  {index + 1}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RankMark({ index }: { index: number }) {
  const image = RANK_ART[index];
  return (
    <b className="reference-rank-medal">
      {image ? <img src={image} alt={`อันดับ ${index + 1}`} loading="lazy" onError={hideBrokenImage} /> : index + 1}
    </b>
  );
}

function ArchiveGameTile({
  game,
  large = false,
  compact = false,
}: {
  game: ArchiveGame;
  large?: boolean;
  compact?: boolean;
}) {
  return (
    <a
      href="/browse/games"
      className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}
    >
      <img src={game.imageUrl} alt={game.name} loading="lazy" onError={hideBrokenImage} />
      <span>
        <strong>{game.name}</strong>
        <small>NOAH345</small>
      </span>
    </a>
  );
}

function PanelHeading({
  asset,
  configured,
  fallback,
  title,
}: {
  asset?: CmsAsset | undefined;
  configured?: string | undefined;
  fallback: string;
  title: string;
}) {
  return (
    <header className="reference-panel-heading">
      <AssetIcon asset={asset} configured={configured} fallback={fallback} className="reference-heading-icon" />
      <strong>{title}</strong>
    </header>
  );
}

function AssetIcon({
  asset,
  configured,
  fallback,
  className,
}: {
  asset?: CmsAsset | undefined;
  configured?: string | undefined;
  fallback: string;
  className: string;
}) {
  const value = asset?.url || configured || '';
  return (
    <span className={className} aria-hidden="true">
      {value ? (
        isImageValue(value) ? (
          <img src={normalizePublicAssetUrl(value)} alt="" onError={hideBrokenImage} />
        ) : (
          value
        )
      ) : (
        fallback
      )}
    </span>
  );
}

function GameTile({
  game,
  large = false,
  compact = false,
  fallbackName,
}: {
  game: Game;
  large?: boolean;
  compact?: boolean;
  fallbackName: string;
}) {
  return (
    <a
      href="/browse/games"
      className={`reference-game-tile${large ? ' reference-game-tile--large' : ''}${compact ? ' reference-game-tile--compact' : ''}`}
    >
      <GameImage game={game} fallbackName={fallbackName} />
      {game?.isNew && <em>NEW</em>}
      <span>
        <strong>{safeGameName(game, fallbackName)}</strong>
        <small>{game?.provider?.name || game?.provider?.code || 'Provider'}</small>
      </span>
    </a>
  );
}

function GameImage({ game, fallbackName }: { game: Game; fallbackName: string }) {
  const fallback = resolveHomeGameFallback(game);
  const image = resolveHomeGameImage(game) || fallback;
  return (
    <img src={image} alt={safeGameName(game, fallbackName)} loading="lazy" onError={(event) => swapBrokenImage(event, fallback)} />
  );
}

function findCmsAsset(content: CmsContent, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeSearchText);
  return (Array.isArray(content?.assets) ? content.assets : []).find((asset) => {
    if (!asset?.enabled || asset.type !== 'image' || !asset.url) return false;
    const haystack = normalizeSearchText(`${asset.id} ${asset.name} ${asset.tag || ''} ${asset.url}`);
    return normalizedAliases.some((alias) => haystack.includes(alias));
  });
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[\s_\-./\\]+/g, '');
}
function isImageValue(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('/') || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(value);
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
function safeGameName(game: Game, fallbackName = 'Game') {
  return typeof game?.name === 'string' && game.name.trim() ? game.name : fallbackName;
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
