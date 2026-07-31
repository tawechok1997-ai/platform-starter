'use client';

import type { SyntheticEvent } from 'react';
import type { Game } from '../../types/member-api';
import { useMemberRuntime } from '../../member-runtime-provider';
import { REFERENCE_GAMES, type ReferenceAsset } from '../reference-asset-catalog';
import { resolveHomeGameFallback, resolveHomeGameImage } from './local-game-asset-resolver';
import { MOBILE_SOURCE_ASSETS } from './mobile-source-asset-map';
import UsageGuidePreview from './usage-guide-preview';
import { V47_ASSETS } from './v47-asset-map';
import styles from './mobile-source-home-content.module.css';
import parityStyles from './mobile-source-home-content-parity.module.css';

type Props = {
  games: { featured: Game[]; popular: Game[]; recent: Game[]; favorites: Game[] };
  isGamesLoading: boolean;
  gamesMessage: string;
  onOpenPromotion?: () => void;
  onOpenActivity?: () => void;
};

type GameCardModel = {
  id: string;
  name: string;
  provider: string;
  image: string;
  fallback: string;
  isNew: boolean;
};

const LIVE_MATCHES = [
  {
    league: 'อเมริกาใต้ - โคปา ซูดาเมริกาน่า',
    time: 'Jul 31, 07:30',
    home: 'โอฮิกกินส์',
    away: 'โบคา จูเนียร์ส',
  },
] as const;

const FALLBACK_LEADERBOARD = [
  { rank: 1, name: 'Cash Maker 3', user: '089XXXX705', amount: '13,800', image: REFERENCE_GAMES[0]!.url },
  { rank: 2, name: 'Lalika', user: '082XXXX533', amount: '8,000', image: REFERENCE_GAMES[1]!.url },
  { rank: 3, name: 'Jungle King', user: '085XXXX824', amount: '5,264', image: REFERENCE_GAMES[2]!.url },
  { rank: 4, name: 'EVOLUTION', user: '094XXXX485', amount: '4,200', image: REFERENCE_GAMES[3]!.url },
  { rank: 5, name: 'Fortune Gems', user: '098XXXX018', amount: '2,100', image: REFERENCE_GAMES[4]!.url },
] as const;

export default function MobileSourceHomeContent({
  games,
  isGamesLoading,
  gamesMessage,
  onOpenPromotion = () => undefined,
  onOpenActivity = () => undefined,
}: Props) {
  const { features, home, icons } = useMemberRuntime();
  const allGames = uniqueGames(games.featured, games.popular, games.recent, games.favorites);
  const popular = buildGameCards(fillGames(games.popular, allGames, 3), REFERENCE_GAMES.slice(0, 3));
  const online = buildGameCards(fillGames(allGames.slice(2), allGames, 5), REFERENCE_GAMES.slice(6, 11));
  const classic = buildGameCards(fillGames(allGames.slice(8), allGames, 2), REFERENCE_GAMES.slice(12, 14));
  const leaderboard = home.leaderboard.entries.length ? home.leaderboard.entries.slice(0, 5) : FALLBACK_LEADERBOARD;
  const tournamentRanks = leaderboard.slice(0, 3);

  return (
    <section className={`${styles.root} ${parityStyles.root}`} aria-label="เนื้อหาหน้าแรกมือถือ">
      <nav className={styles.highlightTabs} aria-label="หัวข้อหน้าแรก">
        <button type="button" className={styles.activeTab} aria-current="page">ไฮไลท์</button>
        <button type="button" onClick={onOpenPromotion}>โปรโมชั่นแนะนำ</button>
        <button type="button" onClick={onOpenActivity}>กิจกรรม</button>
      </nav>

      {features.tournament ? (
        <section className={styles.section} data-section-kind="tournament">
          <a className={styles.tournamentBanner} href={home.tournament.href || '/browse/promotions?view=activity'}>
            <img
              src={MOBILE_SOURCE_ASSETS.tournamentBanner}
              alt={home.tournament.title || 'Tournament'}
              onError={(event) => swapBrokenImage(event, V47_ASSETS.tournament)}
            />
          </a>
          <div className={styles.tournamentHeader}>
            <strong>{home.tournament.title || 'No1. Tournament Football Royale ครั้งที่ 2'}</strong>
            <button type="button" onClick={onOpenActivity}>ดูทั้งหมด</button>
          </div>
          <div className={styles.rankRail} data-drag-scroll="true">
            {tournamentRanks.map((entry, index) => (
              <article key={`${entry.user}-${index}`}>
                <RankBadge rank={index + 1} />
                <span>{entry.user}</span>
                <strong>{entry.amount}</strong>
                <small>● ● ● ● ●</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {features.jackpot && home.jackpot.enabled ? (
        <section className={styles.jackpot} aria-label={home.jackpot.title || 'Jackpot'}>
          <img
            src={home.jackpot.image || V47_ASSETS.jackpot}
            alt=""
            aria-hidden="true"
            onError={(event) => swapBrokenImage(event, V47_ASSETS.jackpotStill)}
          />
          <div>
            <small>{home.jackpot.title || 'JACKPOTS'}</small>
            <strong>{home.jackpot.amount || '197,453,177'}</strong>
            <span>{home.jackpot.subtitle || 'Epic of the day'}</span>
          </div>
        </section>
      ) : null}

      {features.leaderboard && home.leaderboard.enabled ? (
        <section className={styles.section} data-section-kind="leaderboard">
          <SectionTitle icon={icons.leaderboard || V47_ASSETS.leaderboard} title={home.leaderboard.title || 'Leaderboard'} />
          <div className={styles.boardHead}>
            <span>ลำดับ</span>
            <span>ชื่อผู้ใช้</span>
            <span>เกม</span>
            <span>รายได้ที่ได้รับ</span>
          </div>
          <div className={styles.boardRows}>
            {leaderboard.map((entry, index) => (
              <article key={`${entry.user}-${index}`}>
                <RankBadge rank={entry.rank || index + 1} />
                <span>{entry.user}</span>
                <span className={styles.boardGame}>
                  {entry.image ? <img src={entry.image} alt="" aria-hidden="true" onError={hideBrokenImage} /> : null}
                  <b>{entry.name}</b>
                </span>
                <strong>{entry.amount}</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {features.popularGames ? (
        <GameSection
          kind="popular"
          title={home.sectionTitles.popular || 'Top 10 Popular Games'}
          icon={icons.popular || V47_ASSETS.gameHit}
          games={popular}
          loading={isGamesLoading}
          message={gamesMessage}
          layout="rail"
        />
      ) : null}

      {features.onlineGames ? (
        <GameSection
          kind="online"
          title={home.sectionTitles.online || 'Most Online Now'}
          icon={icons.online || V47_ASSETS.mostOnline}
          games={online}
          loading={isGamesLoading}
          message={gamesMessage}
          layout="grid"
          showOnline
          featuredFirst
        />
      ) : null}

      {features.liveGames ? (
        <section className={styles.section} data-section-kind="live">
          <SectionTitle icon={icons.live || V47_ASSETS.liveIcon} title={home.sectionTitles.live || 'Live Now!!'} />
          <div className={styles.liveList}>
            {LIVE_MATCHES.map((match) => (
              <article key={`${match.league}-${match.time}`}>
                <header>
                  <span>{match.league}</span>
                  <b>LIVE</b>
                  <time>{match.time}</time>
                </header>
                <div className={styles.liveTeams}>
                  <strong>{match.home}</strong>
                  <i>VS</i>
                  <strong>{match.away}</strong>
                </div>
                <footer>
                  <a href="/?auth=login">ดูถ่ายทอดสด</a>
                  <a href="/?auth=login">เดิมพันทันที</a>
                </footer>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {features.classicGames ? (
        <GameSection
          kind="classic"
          title={home.sectionTitles.classic || 'Classic Games'}
          icon={icons.classic || V47_ASSETS.star}
          games={classic}
          loading={isGamesLoading}
          message={gamesMessage}
          layout="grid"
        />
      ) : null}

      {features.usageGuide ? (
        <section className={`${styles.section} ${styles.guide}`} data-section-kind="guide">
          <UsageGuidePreview mobile />
        </section>
      ) : null}
    </section>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <header className={styles.sectionTitle}>
      {icon ? <img src={icon} alt="" aria-hidden="true" onError={hideBrokenImage} /> : null}
      <strong>{title}</strong>
    </header>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const image = rank === 1 ? V47_ASSETS.rank1 : rank === 2 ? V47_ASSETS.rank2 : rank === 3 ? V47_ASSETS.rank3 : V47_ASSETS.rankOther;
  return (
    <span className={styles.rankBadge}>
      <img src={image} alt="" aria-hidden="true" onError={hideBrokenImage} />
      <b>{rank}</b>
    </span>
  );
}

function GameSection({
  kind,
  title,
  icon,
  games,
  loading,
  message,
  layout,
  showOnline = false,
  featuredFirst = false,
}: {
  kind: 'popular' | 'online' | 'classic';
  title: string;
  icon: string;
  games: GameCardModel[];
  loading: boolean;
  message: string;
  layout: 'rail' | 'grid';
  showOnline?: boolean;
  featuredFirst?: boolean;
}) {
  return (
    <section className={styles.section} data-section-kind={kind}>
      <SectionTitle icon={icon} title={title} />
      {loading ? (
        <div className={styles.empty}>กำลังโหลดเกม...</div>
      ) : games.length ? (
        <div
          className={layout === 'rail' ? styles.gameRail : styles.gameGrid}
          data-drag-scroll={layout === 'rail' ? 'true' : undefined}
          data-featured-first={featuredFirst ? 'true' : undefined}
        >
          {games.map((game, index) => (
            <a className={styles.gameCard} href="/?auth=login" key={`${game.id}-${index}`}>
              <div className={styles.gameImage}>
                <img
                  src={game.image}
                  alt={game.name}
                  loading="lazy"
                  onError={(event) => swapBrokenImage(event, game.fallback)}
                />
                <span className={game.isNew ? styles.newBadge : styles.hotBadge}>{game.isNew ? 'NEW' : 'HOT'}</span>
                {showOnline ? <b className={styles.onlineBadge}>ออนไลน์ {onlineCount(index)}</b> : null}
              </div>
              <span className={styles.gameMeta}>
                <strong>{game.name}</strong>
                <small>{game.provider}</small>
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>{message || 'ยังไม่มีข้อมูลเกม'}</div>
      )}
    </section>
  );
}

function buildGameCards(games: Game[], fallbacks: ReferenceAsset[]): GameCardModel[] {
  if (games.length) {
    return games.map((game) => {
      const fallback = resolveHomeGameFallback(game);
      return {
        id: game.id,
        name: safeName(game),
        provider: game.provider?.name || game.provider?.code || 'NOAH345',
        image: resolveHomeGameImage(game) || fallback,
        fallback,
        isNew: Boolean(game.isNew),
      };
    });
  }

  return fallbacks.map((game, index) => ({
    id: `reference-${index}`,
    name: game.name,
    provider: 'NOAH345',
    image: game.url,
    fallback: game.url,
    isNew: index % 3 === 1,
  }));
}

function uniqueGames(...groups: Game[][]) {
  const seen = new Set<string>();
  const result: Game[] = [];
  for (const group of groups) {
    for (const game of group) {
      const key = game.id || `${game.provider?.code || ''}:${game.providerGameCode || game.name}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(game);
    }
  }
  return result;
}

function fillGames(primary: Game[], pool: Game[], limit: number) {
  const selected = uniqueGames(primary, pool);
  return selected.slice(0, limit);
}

function safeName(game: Game) {
  return game.name?.trim() || game.providerGameCode?.trim() || 'Game';
}

function onlineCount(index: number) {
  return ['3,903', '2,990', '2,330', '4,820', '2,282'][index % 5];
}

function swapBrokenImage(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const image = event.currentTarget;
  if (!fallback || image.dataset.fallbackApplied === 'true' || image.src.endsWith(fallback)) {
    image.hidden = true;
    return;
  }
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.hidden = true;
}
