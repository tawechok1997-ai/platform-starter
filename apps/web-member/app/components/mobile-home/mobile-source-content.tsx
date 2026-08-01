'use client';

import { useMemberLocale } from '../../member-locale-provider';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import { V47_ASSETS } from '../member-home/v47-asset-map';
import type { MobileSourceGame, MobileSourceTournament } from './mobile-source-runtime';
import { useMobileSourceRuntime } from './mobile-source-runtime';
import styles from './mobile-source-content.module.css';

const MOBILE_TOURNAMENT_ART = '/assets/asset-pc/images/home/tournament-mobile-source.svg';

export default function MobileSourceContent() {
  const { locale } = useMemberLocale();
  const runtime = useMobileSourceRuntime();
  const copy = COPY[locale];
  const tournamentIcon = runtime.icons.tournament || V47_ASSETS.tournamentIcon;
  const leaderboardIcon = runtime.icons.leaderboard || V47_ASSETS.leaderboard;

  return (
    <div className={styles.root} data-mobile-section-owner="source-content" data-central-catalog={runtime.catalogConnected ? 'connected' : runtime.catalogStatus}>
      {runtime.features.tournament ? (
        <section className={styles.tournamentSection} aria-labelledby="mobile-tournament-heading">
          <div className={styles.tournamentBanner}>
            <MappedImage src={MOBILE_TOURNAMENT_ART} alt={runtime.tournament.title || copy.tournament} />
          </div>
          <SectionHeading id="mobile-tournament-heading" icon={tournamentIcon} label={copy.tournament} />
          {runtime.tournaments.length > 0 ? (
            <div className={styles.tournamentRail}>
              {runtime.tournaments.map((item) => <TournamentCard key={item.id} item={item} copy={copy} />)}
            </div>
          ) : <DataState status={runtime.tournamentStatus} empty={copy.noTournaments} error={copy.tournamentError} loading={copy.loading} />}
        </section>
      ) : null}

      {runtime.jackpot.enabled && runtime.jackpot.amount ? (
        <section className={styles.jackpotBanner} aria-label={runtime.jackpot.title || copy.jackpot}>
          <MappedImage src={runtime.jackpot.image || V47_ASSETS.jackpot} alt="" />
          <strong>{runtime.jackpot.amount}</strong>
        </section>
      ) : null}

      {runtime.features.leaderboard ? (
        <section className={styles.leaderboardSection} aria-labelledby="mobile-leaderboard-heading">
          <SectionHeading id="mobile-leaderboard-heading" icon={leaderboardIcon} label={runtime.leaderboardTitle || copy.leaderboard} />
          {runtime.leaderboard.length > 0 ? (
            <div className={styles.leaderboardTable}>
              <div className={styles.tableHead}><span>{copy.rank}</span><span>{copy.user}</span><span>{copy.game}</span><span>{copy.score}</span></div>
              {runtime.leaderboard.slice(0, 5).map((row, index) => (
                <div key={`${row.user}-${row.rank}-${index}`} className={styles.tableRow}>
                  <strong>{row.rank || index + 1}</strong>
                  <span>{row.user || '-'}</span>
                  <span className={styles.tableGame}>
                    <MappedImage src={row.gameImage} alt="" />
                    <span><b>{row.game}</b><small><MappedImage src={row.providerIcon} alt="" />{row.provider}</small></span>
                  </span>
                  <strong>{row.amount}</strong>
                </div>
              ))}
            </div>
          ) : <DataState status={runtime.tournamentStatus} empty={copy.noLeaderboard} error={copy.tournamentError} loading={copy.loading} />}
        </section>
      ) : null}

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

function SectionHeading({ id, icon, label }: { id: string; icon: string; label: string }) {
  return <div className={styles.sectionHeading}><div aria-hidden="true" /><span><MappedImage src={icon} alt="" /><strong id={id}>{label}</strong></span></div>;
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
  if (value === 'ENDED' || value === 'FINISHED') return copy.ended;
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
  th: { tournament: 'ทัวร์นาเมนต์', leaderboard: 'อันดับผู้เล่น', jackpot: 'ยอดรางวัลรวม', rank: 'ลำดับ', user: 'ชื่อผู้ใช้', game: 'เกม', score: 'คะแนน', popular: 'เกมยอดนิยม', onlineNow: 'เกมที่มีผู้เล่นออนไลน์', online: 'ออนไลน์', liveNow: 'ถ่ายทอดสด', classic: 'เกมคลาสสิก', guide: 'คู่มือการใช้งาน', viewAll: 'ดูทั้งหมด', watchLive: 'ดูถ่ายทอดสด', playNow: 'เล่นทันที', play: 'เล่น', loading: 'กำลังโหลดข้อมูลล่าสุด...', catalogError: 'โหลดเกมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', tournamentError: 'โหลดข้อมูลทัวร์นาเมนต์ไม่สำเร็จ', noTournaments: 'ยังไม่มีทัวร์นาเมนต์ที่เผยแพร่', noTournamentEntries: 'ยังไม่มีอันดับผู้เล่น', noLeaderboard: 'ยังไม่มีข้อมูลอันดับผู้เล่น', noGames: 'ยังไม่มีเกมในส่วนนี้', noOnlineGames: 'ยังไม่มีข้อมูลผู้เล่นออนไลน์', noGuides: 'ยังไม่มีคู่มือที่เผยแพร่', active: 'กำลังแข่งขัน', scheduled: 'เร็ว ๆ นี้', ended: 'สิ้นสุดแล้ว', published: 'เผยแพร่แล้ว' },
  en: { tournament: 'Tournaments', leaderboard: 'Leaderboard', jackpot: 'Total jackpot', rank: 'Rank', user: 'Player', game: 'Game', score: 'Score', popular: 'Popular games', onlineNow: 'Most online now', online: 'Online', liveNow: 'Live now', classic: 'Classic games', guide: 'Usage guide', viewAll: 'View all', watchLive: 'Watch live', playNow: 'Play now', play: 'Play', loading: 'Loading the latest data...', catalogError: 'Unable to load games. Please try again.', tournamentError: 'Unable to load tournaments.', noTournaments: 'No published tournaments yet', noTournamentEntries: 'No leaderboard entries yet', noLeaderboard: 'No leaderboard data yet', noGames: 'No games in this section yet', noOnlineGames: 'No online player data yet', noGuides: 'No published guides yet', active: 'In progress', scheduled: 'Coming soon', ended: 'Ended', published: 'Published' },
} as const;
