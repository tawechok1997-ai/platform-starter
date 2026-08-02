'use client';

import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import { V47_ASSETS } from '../member-home/v47-asset-map';
import { useMemberJackpotLabel } from '../member-home/member-jackpot-runtime';
import type {
  MobileSourceGame,
  MobileSourceLeaderboardRow,
  MobileSourceTournament,
} from './mobile-source-runtime';
import { useMobileSourceRuntime } from './mobile-source-runtime';
import styles from './mobile-source-content.module.css';

const SOURCE_TOURNAMENTS: readonly MobileSourceTournament[] = [
  {
    id: 'football-royale-2',
    title: 'No1. Tournament Football Royale ครั้งที่ 2',
    status: 'ENDED',
    href: '/mobile/member/tournament',
    players: [
      { name: 'ZAXXXU709740', score: 20, stats: [17, 0, 0, 0, 7, 0] },
      { name: 'ZAXXXM664100', score: 17, stats: [13, 3, 0, 4, 4, 0] },
      { name: 'ZAXXXR440174', score: 13, stats: [13, 2, 0, 3, 5, 1] },
      { name: 'ZAXXXU410005', score: 11, stats: [13, 2, 0, 1, 7, 1] },
      { name: 'ZAXXXO539314', score: 9, stats: [11, 3, 0, 4, 3, 3] },
    ],
  },
  {
    id: 'football-classic-2',
    title: 'No1. Tournament Football Classic ครั้งที่ 2',
    status: 'ENDED',
    href: '/mobile/member/tournament',
    players: [
      { name: 'ZAXXXU164013', score: 12, stats: [14, 1, 0, 1, 7, 1] },
      { name: 'ZAXXXX399733', score: 10, stats: [9, 6, 0, 4, 5, 0] },
      { name: 'ZAXXXW621805', score: 9, stats: [11, 4, 0, 1, 4, 4] },
      { name: 'ZAXXXO227775', score: 8, stats: [13, 0, 0, 4, 6, 1] },
      { name: 'ZAXXXR646987', score: 6, stats: [11, 3, 0, 1, 9, 0] },
    ],
  },
  {
    id: 'football-royale-1',
    title: 'No1. Tournament Football Royale ครั้งที่ 1',
    status: 'ENDED',
    href: '/mobile/member/tournament',
    players: [
      { name: 'ZAXXXM651112', score: 13, stats: [15, 2, 0, 1, 8, 1] },
      { name: 'ZAXXX1360752', score: 12, stats: [13, 3, 2, 1, 6, 2] },
      { name: 'ZAXXX0319280', score: 10, stats: [14, 1, 2, 1, 7, 2] },
      { name: 'ZAXXX1452618', score: 9, stats: [15, 0, 0, 3, 8, 1] },
      { name: 'ZAXXXV511163', score: 6, stats: [14, 0, 1, 0, 11, 0] },
    ],
  },
  {
    id: 'football-classic-1',
    title: 'No1. Tournament Football Classic ครั้งที่ 1',
    status: 'ENDED',
    href: '/mobile/member/tournament',
    players: [
      { name: 'ZAXXXX231972', score: 20, stats: [16, 1, 0, 3, 3, 2] },
      { name: 'ZAXXXO536010', score: 15, stats: [13, 4, 0, 1, 6, 1] },
      { name: 'ZAXXXR648845', score: 11, stats: [13, 3, 0, 0, 6, 3] },
      { name: 'ZAXXXR440174', score: 9, stats: [12, 3, 1, 0, 7, 2] },
      { name: 'ZAXXXO585554', score: 5, stats: [10, 4, 0, 3, 7, 1] },
    ],
  },
];

const SOURCE_LEADERBOARD: readonly MobileSourceLeaderboardRow[] = [
  {
    rank: 1,
    user: '084XXXX728',
    game: 'EVOLUTION',
    provider: '',
    amount: '8,400',
    providerIcon: '',
    gameImage: 'https://cdn.zabbet.com/providers/set/1_1_v/evt.png',
  },
  {
    rank: 2,
    user: '061XXXX493',
    game: 'Fortune Tiger',
    provider: 'PG SLOT',
    amount: '5,600',
    providerIcon: 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png',
    gameImage: 'https://cdn.zabbet.com/games/pgslot/vertical/fortune_tiger.jpg',
  },
  {
    rank: 3,
    user: '091XXXX339',
    game: 'ไฮโลไทย 2',
    provider: 'KingMidas',
    amount: '5,000',
    providerIcon: 'https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png',
    gameImage: 'https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg',
  },
  {
    rank: 4,
    user: '093XXXX507',
    game: 'Lalika',
    provider: '',
    amount: '4,600',
    providerIcon: '',
    gameImage: 'https://cdn.zabbet.com/providers/set/1_1_v/lali.png',
  },
  {
    rank: 5,
    user: '095XXXX955',
    game: 'SBO',
    provider: '',
    amount: '3,277',
    providerIcon: '',
    gameImage: 'https://cdn.zabbet.com/providers/set/1_1_v/sbo.png',
  },
];

export default function MobileSourceContent() {
  const { locale } = useMemberLocale();
  const runtime = useMobileSourceRuntime();
  const copy = COPY[locale];
  const tournamentIcon = runtime.icons.tournament || V47_ASSETS.tournamentIcon;
  const leaderboardIcon = runtime.icons.leaderboard || V47_ASSETS.leaderboard;
  const jackpotLabel = useMemberJackpotLabel(runtime.jackpot.amount);
  const tournaments = runtime.tournaments.length > 0 ? runtime.tournaments : SOURCE_TOURNAMENTS;
  const leaderboard = runtime.leaderboard.length > 0 ? runtime.leaderboard : SOURCE_LEADERBOARD;

  return (
    <div className={styles.root} data-mobile-section-owner="source-content" data-central-catalog={runtime.catalogConnected ? 'connected' : runtime.catalogStatus}>
      <section className={styles.tournamentSection} aria-labelledby="mobile-tournament-heading" data-mobile-source-tournament="true">
        <SectionHeading id="mobile-tournament-heading" icon={tournamentIcon} label={copy.tournament} />
        <div className={styles.tournamentRail} style={{ marginTop: 4 }}>
          {tournaments.map((item) => <TournamentCard key={item.id} item={item} copy={copy} />)}
        </div>
      </section>

      {runtime.jackpot.enabled ? (
        <section className={styles.jackpotBanner} aria-label={runtime.jackpot.title || copy.jackpot}>
          <MappedImage src={runtime.jackpot.image || V47_ASSETS.jackpot} alt="" />
          <strong aria-live="off">{jackpotLabel}</strong>
        </section>
      ) : null}

      <section className={styles.leaderboardSection} aria-labelledby="mobile-leaderboard-heading" data-mobile-source-leaderboard="true">
        <SectionHeading
          id="mobile-leaderboard-heading"
          icon={leaderboardIcon}
          label={copy.leaderboard}
          infoLabel={copy.leaderboardInformation}
        />
        <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' }}>
          <div className={styles.leaderboardTable} style={{ minWidth: 400 }}>
            <div
              className={styles.tableHead}
              style={{ gridTemplateColumns: '38px 86px minmax(150px, 1fr) 72px 28px' }}
            >
              <span>{copy.rank}</span>
              <span>{copy.user}</span>
              <span>{copy.game}</span>
              <span>{copy.score}</span>
              <span aria-hidden="true" />
            </div>
            {leaderboard.slice(0, 5).map((row, index) => (
              <div
                key={`${row.user}-${row.rank}-${index}`}
                className={styles.tableRow}
                style={{
                  gridTemplateColumns: '38px 86px minmax(150px, 1fr) 72px 28px',
                  background: index % 2 === 0 ? '#373147' : '#24212d',
                }}
              >
                <LeaderboardRank rank={row.rank || index + 1} />
                <span>{row.user || '-'}</span>
                <span className={styles.tableGame}>
                  <MappedImage src={row.gameImage} alt="" />
                  <span>
                    <b>{row.game}</b>
                    {row.provider || row.providerIcon ? (
                      <small><MappedImage src={row.providerIcon} alt="" />{row.provider}</small>
                    ) : null}
                  </span>
                </span>
                <strong>{row.amount}</strong>
                <button
                  type="button"
                  aria-label={`${copy.openGame} ${row.game}`}
                  onClick={() => navigate('/browse/games')}
                  style={{
                    display: 'grid',
                    width: 24,
                    height: 20,
                    padding: 0,
                    placeItems: 'center',
                    borderRadius: 5,
                    color: '#b68bc2',
                    background: 'rgba(21,18,30,.7)',
                  }}
                >
                  <PlayIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {runtime.section.popular?.enabled !== false ? (
        <GameRailSection
          id="mobile-popular-heading"
          title={runtime.section.popular?.title || copy.popular}
          icon={runtime.section.popular?.icon || runtime.icons.popular || V47_ASSETS.mobilePopular}
          games={runtime.popularGames}
          status={runtime.catalogStatus}
          copy={copy}
        />
      ) : null}

      {runtime.section.online?.enabled !== false ? (
        <section className={styles.onlineSection} aria-labelledby="mobile-online-heading">
          <SectionHeading id="mobile-online-heading" icon={runtime.section.online?.icon || runtime.icons.online || V47_ASSETS.mostOnline} label={runtime.section.online?.title || copy.onlineNow} />
          {runtime.onlineGames.length > 0 ? (
            <div className={styles.onlineGrid}>
              {runtime.onlineGames.slice(0, 6).map((item) => (
                <button key={`${item.provider}-${item.id}`} type="button" className={styles.onlineCard} {...gameLaunchData(item)} aria-label={`${copy.play} ${item.name}`}>
                  <div className={styles.onlineImage}>
                    <MappedImage src={item.image} alt={item.name} />
                    {item.badge === 'HOT' ? <span className={styles.hotBadge}>HOT</span> : null}
                  </div>
                  <div><span>{copy.online}</span><strong>{item.players.toLocaleString('en-US')}</strong></div>
                </button>
              ))}
            </div>
          ) : <DataState status={runtime.catalogStatus} empty={copy.noOnlineGames} error={copy.catalogError} loading={copy.loading} />}
        </section>
      ) : null}

      {runtime.section.live?.enabled !== false && runtime.liveMatches.length > 0 ? (
        <section className={styles.liveSection} aria-labelledby="mobile-live-heading">
          <SectionHeading id="mobile-live-heading" icon={runtime.section.live?.icon || runtime.icons.live || V47_ASSETS.liveIcon} label={runtime.section.live?.title || copy.liveNow} />
          <div className={styles.liveList}>
            {runtime.liveMatches.map((item) => (
              <article key={item.id} className={styles.liveCard}>
                <div className={styles.liveMeta}><span><SoccerIcon />{item.league}</span><strong>LIVE <small>{item.time}</small></strong></div>
                <div className={styles.liveTeams}>
                  <span><MappedImage src={item.homeLogo} alt="" /><b>{item.home}</b></span><strong>VS</strong><span><MappedImage src={item.awayLogo} alt="" /><b>{item.away}</b></span>
                </div>
                <div className={styles.liveActions}>
                  <button type="button" onClick={() => navigate(item.watchHref)}><LiveIcon />{copy.watchLive}</button>
                  <button type="button" onClick={() => navigate(item.playHref)}>{copy.playNow}</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {runtime.section.classic?.enabled !== false ? (
        <GameRailSection
          id="mobile-classic-heading"
          title={runtime.section.classic?.title || copy.classic}
          icon={runtime.section.classic?.icon || runtime.icons.classic || V47_ASSETS.mobilePopular}
          games={runtime.classicGames}
          status={runtime.catalogStatus}
          copy={copy}
        />
      ) : null}

      {runtime.features.usageGuide ? (
        <section className={styles.guideSection} aria-labelledby="mobile-guide-heading">
          <SectionHeading id="mobile-guide-heading" icon={V47_ASSETS.mobileFaq} label={runtime.guideTitle || copy.guide} />
          {runtime.guides.length > 0 ? (
            <>
              <div className={styles.guideGrid}>
                {runtime.guides.map((guide, index) => (
                  <button key={guide.id} type="button" onClick={() => navigate(guide.href)}><span>{index + 1}</span><strong>{guide.title}</strong><Chevron /></button>
                ))}
              </div>
              <button type="button" className={styles.viewAllButton} onClick={() => navigate('/guide')}>{copy.viewAll} <Chevron /></button>
            </>
          ) : <DataState status="ready" empty={copy.noGuides} error={copy.noGuides} loading={copy.loading} />}
        </section>
      ) : null}
    </div>
  );
}

function TournamentCard({ item, copy }: { item: MobileSourceTournament; copy: typeof COPY.th | typeof COPY.en }) {
  return (
    <article className={styles.tournamentCard}>
      <div className={styles.tournamentTitleRow}><strong>{item.title}</strong><button type="button" onClick={() => navigate(item.href)}>{copy.viewAll} <Chevron /></button></div>
      <div className={styles.tournamentStatus}><span>{tournamentStatus(item.status, copy)}</span><InfoIcon /></div>
      {item.players.length > 0 ? (
        <div className={styles.rankRail}>
          {item.players.map((entry, index) => (
            <div key={`${item.id}-${entry.name}-${index}`} className={styles.rankCard}>
              <div className={styles.rankBadge}><MappedImage src={index < 3 ? V47_ASSETS.rankTop3 : V47_ASSETS.rankOther} alt="" /><strong>{index + 1}</strong></div>
              <span className={styles.rankName}>{entry.name}</span><strong className={index < 3 ? styles.rankScoreTop : styles.rankScore}>{entry.score}</strong>
              <div className={styles.rankStats}>{entry.stats.map((value, statIndex) => <span key={statIndex}><i data-stat={statIndex} />{value}</span>)}</div>
            </div>
          ))}
        </div>
      ) : <div style={dataStateStyle}>{copy.noTournamentEntries}</div>}
    </article>
  );
}

function LeaderboardRank({ rank }: { rank: number }) {
  const badge = rank >= 1 && rank <= 4
    ? `/assets/asset-pc/images/LeaderBoard/rank${rank}.webp`
    : '';

  return (
    <span
      style={{
        display: 'grid',
        width: 34,
        height: 34,
        margin: '0 auto',
        placeItems: 'center',
        backgroundImage: badge ? `url(${badge})` : undefined,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        fontSize: 12,
        fontWeight: 900,
        textShadow: '2px 2px 4px rgba(0,0,0,.5)',
      }}
    >
      {rank}
    </span>
  );
}

function GameRailSection({ id, title, icon, games, status, copy }: {
  id: string;
  title: string;
  icon: string;
  games: MobileSourceGame[];
  status: 'loading' | 'ready' | 'error';
  copy: typeof COPY.th | typeof COPY.en;
}) {
  return (
    <section className={styles.gameSection} aria-labelledby={id}>
      <SectionHeading id={id} icon={icon} label={title} />
      {games.length > 0 ? (
        <div className={styles.gameRail}>
          {games.map((item) => (
            <button key={`${item.provider}-${item.id}`} type="button" className={styles.gameCard} {...gameLaunchData(item)} aria-label={`${copy.play} ${item.name}`}>
              <div className={styles.gamePoster}><MappedImage src={item.image} alt={item.name} />{item.badge ? <span className={item.badge === 'HOT' ? styles.hotBadge : styles.newBadge}>{item.badge}</span> : null}</div>
              <div className={styles.gameMeta}><MappedImage src={item.providerIcon} alt="" /><span><strong>{item.name}</strong><small>{item.provider}</small></span></div>
            </button>
          ))}
        </div>
      ) : <DataState status={status} empty={copy.noGames} error={copy.catalogError} loading={copy.loading} />}
    </section>
  );
}

function DataState({ status, empty, error, loading }: { status: 'loading' | 'ready' | 'error'; empty: string; error: string; loading: string }) {
  return <div style={dataStateStyle} role="status">{status === 'loading' ? loading : status === 'error' ? error : empty}</div>;
}

function gameLaunchData(item: MobileSourceGame) {
  return {
    'data-game-id': item.id,
    'data-game-code': item.providerGameCode,
    'data-game-name': item.name,
    'data-provider-code': item.provider,
    'data-game-category': item.category,
  };
}

function SectionHeading({ id, icon, label, infoLabel }: { id: string; icon: string; label: string; infoLabel?: string }) {
  return (
    <div className={styles.sectionHeading}>
      <div aria-hidden="true" />
      <span>
        <MappedImage src={icon} alt="" />
        <strong id={id} style={{ flex: 1 }}>{label}</strong>
        {infoLabel ? (
          <button
            type="button"
            aria-label={infoLabel}
            title={infoLabel}
            style={{
              display: 'grid',
              width: 22,
              height: 22,
              padding: 0,
              placeItems: 'center',
              color: '#bb5bea',
              background: 'transparent',
            }}
          >
            <InfoIcon />
          </button>
        ) : null}
      </span>
    </div>
  );
}

function MappedImage({ src, alt }: { src: string; alt: string }) {
  const source = src.trim();
  if (!source) return null;
  const resolvedSrc = resolveLocalAssetByBasename(source, 'any') || source;
  return <img src={resolvedSrc} alt={alt} loading="lazy" data-asset-filename={assetFileName(source)} onError={(event) => {
    if (resolvedSrc !== source && /^https?:\/\//i.test(source)) { event.currentTarget.src = source; return; }
    event.currentTarget.hidden = true;
  }} />;
}

function tournamentStatus(status: string, copy: typeof COPY.th | typeof COPY.en) {
  const value = status.trim().toUpperCase();
  if (value === 'ACTIVE') return copy.active;
  if (value === 'SCHEDULED') return copy.scheduled;
  if (value === 'ENDED' || value === 'FINISHED' || value === 'COMPLETED') return copy.ended;
  return status || copy.published;
}

function assetFileName(value: string) {
  const pathname = safePathname(value);
  return pathname.split('/').filter(Boolean).pop()?.split(/[?#]/, 1)[0] ?? '';
}

function safePathname(value: string) {
  const normalized = value.trim().replace(/\\/g, '/');
  if (!/^https?:\/\//i.test(normalized)) return normalized.split(/[?#]/, 1)[0] ?? '';
  try { return new URL(normalized).pathname; } catch { return ''; }
}

function navigate(href: string) { if (href) window.location.assign(href); }
function Chevron() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>; }
function InfoIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>; }
function PlayIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m10.5 8-4 2.31V5.69L10.5 8Z" fill="currentColor" /></svg>; }
function SoccerIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="m12 7 3 2-1 4h-4L9 9l3-2ZM10 13l-3 2M14 13l3 2M9 9 6-1M7 15l1 3M17 15l-1 3" /></svg>; }
function LiveIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></svg>; }

const dataStateStyle = {
  display: 'grid',
  minHeight: 74,
  marginTop: 10,
  padding: 14,
  placeItems: 'center',
  border: '1px solid rgba(255,255,255,.08)',
  borderRadius: 8,
  color: 'rgba(255,255,255,.62)',
  background: 'rgba(21,19,26,.62)',
  fontSize: 11,
  textAlign: 'center',
} as const;

const COPY = {
  th: {
    tournament: 'ทัวร์นาเมนต์',
    leaderboard: 'Leaderboard',
    leaderboardInformation: 'ข้อมูล Leaderboard',
    jackpot: 'ยอดรางวัลรวม',
    rank: 'ลำดับ',
    user: 'ชื่อผู้ใช้',
    game: 'เกม',
    score: 'รายได้ที่ได้รับ',
    openGame: 'เปิดเกม',
    popular: 'เกมยอดนิยม',
    onlineNow: 'เกมที่มีผู้เล่นออนไลน์',
    online: 'ออนไลน์',
    liveNow: 'ถ่ายทอดสด',
    classic: 'เกมคลาสสิก',
    guide: 'คู่มือการใช้งาน',
    viewAll: 'ดูทั้งหมด',
    watchLive: 'ดูถ่ายทอดสด',
    playNow: 'เล่นทันที',
    play: 'เล่น',
    loading: 'กำลังโหลดข้อมูลล่าสุด...',
    catalogError: 'โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    tournamentError: 'โหลดข้อมูลทัวร์นาเมนต์ไม่สำเร็จ',
    noTournaments: 'ยังไม่มีทัวร์นาเมนต์ที่เผยแพร่',
    noTournamentEntries: 'ยังไม่มีอันดับผู้เล่น',
    noLeaderboard: 'ยังไม่มีข้อมูลอันดับผู้เล่น',
    noGames: 'ยังไม่มีเกมในส่วนนี้',
    noOnlineGames: 'ยังไม่มีข้อมูลผู้เล่นออนไลน์',
    noGuides: 'ยังไม่มีคู่มือที่เผยแพร่',
    active: 'กำลังแข่งขัน',
    scheduled: 'เร็ว ๆ นี้',
    ended: 'สิ้นสุดแล้ว',
    published: 'เผยแพร่แล้ว',
  },
  en: {
    tournament: 'Tournaments',
    leaderboard: 'Leaderboard',
    leaderboardInformation: 'Leaderboard information',
    jackpot: 'Total jackpot',
    rank: 'Rank',
    user: 'Player',
    game: 'Game',
    score: 'Earnings',
    openGame: 'Open game',
    popular: 'Popular games',
    onlineNow: 'Most online now',
    online: 'Online',
    liveNow: 'Live now',
    classic: 'Classic games',
    guide: 'Usage guide',
    viewAll: 'View all',
    watchLive: 'Watch live',
    playNow: 'Play now',
    play: 'Play',
    loading: 'Loading the latest data...',
    catalogError: 'Unable to load games. Please try again.',
    tournamentError: 'Unable to load tournaments.',
    noTournaments: 'No published tournaments yet',
    noTournamentEntries: 'No leaderboard entries yet',
    noLeaderboard: 'No leaderboard data yet',
    noGames: 'No games in this section yet',
    noOnlineGames: 'No online player data yet',
    noGuides: 'No published guides yet',
    active: 'In progress',
    scheduled: 'Coming soon',
    ended: 'Ended',
    published: 'Published',
  },
} as const;
