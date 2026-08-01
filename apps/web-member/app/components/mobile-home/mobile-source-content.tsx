'use client';

import type {
  MobileSourceGame,
  MobileSourceLeaderboardRow,
  MobileSourceTournament,
} from './mobile-source-runtime';
import { useMobileSourceRuntime } from './mobile-source-runtime';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import { V47_ASSETS } from '../member-home/v47-asset-map';
import styles from './mobile-source-content.module.css';

const MOBILE_TOURNAMENT_ART = '/assets/asset-mobile/images/home/tournament-mobile-source.svg';

const FALLBACK_TOURNAMENTS: MobileSourceTournament[] = [
  tournament('football-royale-2', 'No1. Tournament Football Royale ครั้งที่ 2', [
    player('ZAXXXU709740', 20, [17, 0, 0, 0, 7, 0]),
    player('ZAXXXM664100', 17, [13, 3, 0, 4, 4, 0]),
    player('ZAXXXR440174', 13, [13, 2, 0, 3, 5, 1]),
    player('ZAXXXU410005', 11, [13, 2, 0, 1, 7, 1]),
    player('ZAXXXO539314', 9, [11, 3, 0, 4, 3, 3]),
    player('ZAXXXU746289', 8, [14, 0, 0, 0, 10, 0]),
    player('ZAXXXY111105', 6, [10, 4, 0, 2, 6, 2]),
  ]),
  tournament('football-classic-2', 'No1. Tournament Football Classic ครั้งที่ 2', [
    player('ZAXXXU164013', 12, [14, 1, 0, 1, 7, 1]),
    player('ZAXXXX399733', 10, [9, 6, 0, 4, 5, 0]),
    player('ZAXXXW621805', 9, [11, 4, 0, 1, 4, 4]),
    player('ZAXXXO227775', 8, [13, 0, 0, 4, 6, 1]),
    player('ZAXXXR646987', 6, [11, 3, 0, 1, 9, 0]),
    player('ZAXXXO342818', 4, [11, 1, 0, 5, 7, 0]),
    player('ZAXXX923400', 3, [10, 3, 0, 2, 9, 0]),
  ]),
];

const FALLBACK_LEADERBOARD: MobileSourceLeaderboardRow[] = [
  leaderboard(1, '061XXXX220', 'Treasures of Aztec', 'PG SLOT', '4,512', 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png', 'https://cdn.zabbet.com/games/pgslot/vertical/treasures_of_aztec.jpg'),
  leaderboard(2, '092XXXX148', 'Crazy Time', 'EVOLUTION', '3,920', 'https://cdn.zabbet.com/providers/set/1_1_v/evt.png', 'https://cdn.zabbet.com/games/1684318646873-73cdc710-185c-4b7e-b5e2-f2bc2c1ee646.jpg'),
  leaderboard(3, '084XXXX642', 'SBO Sports', 'SBO', '3,132', 'https://cdn.zabbet.com/providers/set/1_1_v/sbo.png', 'https://cdn.zabbet.com/providers/set/1_1_v/sbo.png'),
  leaderboard(4, '086XXXX339', 'Lightning Roulette', 'EVOLUTION', '1,810', 'https://cdn.zabbet.com/providers/set/1_1_v/evt.png', 'https://cdn.zabbet.com/games/1684318646873-73cdc710-185c-4b7e-b5e2-f2bc2c1ee646.jpg'),
  leaderboard(5, '062XXXX551', 'Lucky Neko', 'PG SLOT', '1,428', 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png', 'https://cdn.zabbet.com/games/pgslot/vertical/treasures_of_aztec.jpg'),
];

const FALLBACK_POPULAR_GAMES: MobileSourceGame[] = [
  game('money-coming', 'Money Coming', 'JILI', 'https://cdn.zabbet.com/providers/set/1_1_badge/jl.png', 'https://cdn.zabbet.com/games/1755656755936-62320722-2f7a-4710-9e52-f598c9406a93.jpeg', 'HOT', 4132, 'slot'),
  game('lucky-jaguar', 'Lucky Jaguar', 'YGR', 'https://cdn.zabbet.com/providers/set/1_1_badge/ygr.png', 'https://cdn.zabbet.com/games/1704871891426-d938a4ec-5a3c-475f-a1d0-c410e0b30782.jpg', 'HOT', 3005, 'slot'),
  game('el-paso', 'El Paso', 'NLC', 'https://cdn.zabbet.com/providers/set/1_1_badge/nlc.png', 'https://cdn.zabbet.com/games/NLC/elpaso0000000000.jpg', 'NEW', 2200, 'slot'),
  game('sweet-bonanza-xmas', 'Sweet Bonanza Xmas', 'PP', 'https://cdn.zabbet.com/providers/set/1_1_badge/pp.png', 'https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png', 'NEW', 5019, 'slot'),
  game('golden-empire', 'Golden Empire', 'RSG', 'https://cdn.zabbet.com/providers/set/1_1_badge/rsg.png', 'https://cdn.zabbet.com/games/1684776659135-399a7654-b556-4a24-885d-3946c7322fb9.jpg', 'NEW', 2235, 'slot'),
  game('mahjong-ways', 'Mahjong Ways', 'PS', 'https://cdn.zabbet.com/providers/set/1_1_badge/ps.png', 'https://cdn.zabbet.com/games/1692882357754-c47b8426-4045-4792-8ee3-58b784ed9a78.jpg', 'NEW', 1905, 'slot'),
  game('thai-hi-lo-2', 'Thai Hi Lo 2', 'KINGM', 'https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png', 'https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg', 'NEW', 1788, 'card'),
  game('starlight-princess', 'Starlight Princess', 'PP', 'https://cdn.zabbet.com/providers/set/1_1_badge/pp.png', 'https://cdn.zabbet.com/games/vertical/PP/starlight_princess.png', 'NEW', 1650, 'slot'),
];

const FALLBACK_ONLINE_GAMES: MobileSourceGame[] = [
  game('online-1', '', '', '', 'https://cdn.zabbet.com/FEZX/highlight/1729314673983-77cc8959-5e30-4372-96a5-75df61251087.jpeg', '', 4132, 'slot'),
  game('online-2', '', '', '', 'https://cdn.zabbet.com/FEZX/highlight/1729314682179-2f2cd5b6-cadd-4e83-850d-a6f9f2eb68a6.jpeg', 'HOT', 3005, 'slot'),
  game('online-3', '', '', '', 'https://cdn.zabbet.com/FEZX/highlight/1729314708585-cf6d4f54-740b-437c-8c68-eeb335650199.jpeg', 'HOT', 2200, 'slot'),
  game('online-4', '', '', '', 'https://cdn.zabbet.com/FEZX/highlight/1729314712283-8e9a06f9-6d2e-42fd-b096-a8f400df89dc.jpeg', 'HOT', 5019, 'slot'),
  game('online-5', '', '', '', 'https://cdn.zabbet.com/FEZX/highlight/1731504909009-3b869385-72bb-4d54-a1c5-7a99313b5409.png', 'HOT', 2235, 'slot'),
  game('online-6', '', '', '', 'https://cdn.zabbet.com/games/vertical/PP/starlight_princess.png', 'HOT', 1905, 'slot'),
];

const FALLBACK_CLASSIC_GAMES: MobileSourceGame[] = [
  game('bushido-ways', 'Bushido Ways', 'NLC', 'https://cdn.zabbet.com/providers/set/1_1_badge/nlc.png', 'https://cdn.zabbet.com/games/NLC/bushidoways00000.jpg', 'NEW', 1320, 'arcade'),
  game('fortune-gems', 'Fortune Gems', 'JOKER', 'https://cdn.zabbet.com/providers/set/1_1_badge/jkgx2.png', 'https://cdn.zabbet.com/games/1672859746105-2f854e5f-234b-435f-80f0-df5be2f08d7f.jpg', 'NEW', 1180, 'arcade'),
  game('alice-run', 'Alice Run', 'CQ9', 'https://cdn.zabbet.com/providers/set/1_1_badge/cq.png', 'https://cdn.zabbet.com/games/vertical/CQ/alice_run.jpg', 'NEW', 1050, 'arcade'),
  game('penalty-series', 'Penalty Series', 'EVP', 'https://cdn.zabbet.com/providers/set/1_1_badge/evp.png', 'https://cdn.zabbet.com/games/vertical/EVP/penalty_series.jpg', 'HOT', 960, 'arcade'),
  game('fa-chai', 'Fa Chai', 'FACHAI', 'https://cdn.zabbet.com/providers/set/1_1_badge/fachai.png', 'https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png', 'NEW', 840, 'arcade'),
];

const LIVE_MATCHES = [
  ['โปแลนด์ - เอ็คสตราคลาซ่า', 'Aug 1, 01:30', 'Motor Lublin', 'ยาเกียลโลเนีย เบียลี่สต็อค', 'https://googlecdn.live/teams/uploads/logo-none.png', 'https://googlecdn.live/teams/1670.png'],
  ['โรมาเนีย - ลีกา 1', 'Aug 1, 01:30', 'โอเตลุล กาลาติ', 'โวลุนตารี่', 'https://googlecdn.live/teams/1782.png', 'https://googlecdn.live/teams/11607.png'],
  ['โลก - อุ่นเครื่องสโมสร', 'Aug 1, 01:45', 'เรอัล บายาโดลิด', 'เกตาเฟ่', 'https://googlecdn.live/teams/1680.png', 'https://googlecdn.live/teams/694.png'],
] as const;

const GUIDES = [
  'ฝากเงินแบบ โอนผ่านธนาคาร',
  'ฝากเงินแบบ โอนผ่าน QR Payment',
  'ฝากเงินแบบ ฝากจุดทศนิยม',
  'วิธีการฝากแบบ TrueWallet',
  'ยอดไม่เข้าทันที ทำยังไงดี?',
] as const;

export default function MobileSourceContent() {
  const runtime = useMobileSourceRuntime();
  const tournaments = runtime.tournaments.length ? runtime.tournaments : FALLBACK_TOURNAMENTS;
  const leaderboardRows = runtime.leaderboard.length ? runtime.leaderboard : FALLBACK_LEADERBOARD;
  const popularGames = runtime.popularGames.length ? runtime.popularGames : FALLBACK_POPULAR_GAMES;
  const onlineGames = runtime.onlineGames.length ? runtime.onlineGames : FALLBACK_ONLINE_GAMES;
  const classicGames = runtime.classicGames.length ? runtime.classicGames : FALLBACK_CLASSIC_GAMES;
  const tournamentIcon = runtime.icons.tournament || V47_ASSETS.tournamentIcon;
  const leaderboardIcon = runtime.icons.leaderboard || V47_ASSETS.leaderboard;

  return (
    <div className={styles.root} data-mobile-section-owner="source-content" data-central-catalog={runtime.catalogConnected ? 'connected' : 'fallback'}>
      {runtime.features.tournament ? (
        <section className={styles.tournamentSection} aria-labelledby="mobile-tournament-heading">
          <div className={styles.tournamentBanner}>
            <MappedImage src={MOBILE_TOURNAMENT_ART} alt={runtime.tournament.title || 'Tournament'} />
          </div>
          <SectionHeading id="mobile-tournament-heading" icon={tournamentIcon} label="ทัวร์นาเมนต์" />
          <div className={styles.tournamentRail}>
            {tournaments.map((item) => (
              <article key={item.id} className={styles.tournamentCard}>
                <div className={styles.tournamentTitleRow}>
                  <strong>{item.title}</strong>
                  <button type="button" onClick={() => navigate(item.href)}>ดูทั้งหมด <Chevron /></button>
                </div>
                <div className={styles.tournamentStatus}><span>{item.status || 'ยังไม่มีข้อมูล'}</span><InfoIcon /></div>
                <div className={styles.rankRail}>
                  {padTournamentPlayers(item.players).map((entry, index) => (
                    <div key={`${item.id}-${index}`} className={styles.rankCard}>
                      <div className={styles.rankBadge}>
                        <MappedImage src={index < 3 ? V47_ASSETS.rankTop3 : V47_ASSETS.rankOther} alt="" />
                        <strong>{index + 1}</strong>
                      </div>
                      <span className={styles.rankName}>{entry.name}</span>
                      <strong className={index < 3 ? styles.rankScoreTop : styles.rankScore}>{entry.score}</strong>
                      <div className={styles.rankStats}>
                        {entry.stats.map((value, statIndex) => (
                          <span key={statIndex}><i data-stat={statIndex} />{value}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {runtime.jackpot.enabled ? (
        <section className={styles.jackpotBanner} aria-label={runtime.jackpot.title || 'ยอดรางวัลรวม'}>
          <MappedImage src={runtime.jackpot.image || V47_ASSETS.jackpot} alt="" />
          <strong>{runtime.jackpot.amount}</strong>
        </section>
      ) : null}

      {runtime.features.leaderboard ? (
        <section className={styles.leaderboardSection} aria-labelledby="mobile-leaderboard-heading">
          <SectionHeading id="mobile-leaderboard-heading" icon={leaderboardIcon} label={runtime.leaderboardTitle || 'Leaderboard'} />
          <div className={styles.leaderboardTable}>
            <div className={styles.tableHead}><span>ลำดับ</span><span>ชื่อผู้ใช้</span><span>เกม</span><span>รายได้ที่ได้รับ</span></div>
            {leaderboardRows.slice(0, 5).map((row, index) => (
              <div key={`${row.user}-${row.rank}-${index}`} className={styles.tableRow}>
                <strong>{row.rank || index + 1}</strong>
                <span>{row.user || '-'}</span>
                <span className={styles.tableGame}>
                  <MappedImage src={row.gameImage} alt="" />
                  <span><b>{row.game}</b><small><MappedImage src={row.providerIcon} alt="" />{row.provider || 'GAME'}</small></span>
                </span>
                <strong>{row.amount}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {runtime.section.popular?.enabled !== false ? (
        <GameRailSection
          id="mobile-popular-heading"
          title={runtime.section.popular?.title || 'Top 10 Popular Games'}
          icon={runtime.section.popular?.icon || runtime.icons.popular || V47_ASSETS.mobilePopular}
          games={popularGames}
        />
      ) : null}

      {runtime.section.online?.enabled !== false ? (
        <section className={styles.onlineSection} aria-labelledby="mobile-online-heading">
          <SectionHeading id="mobile-online-heading" icon={runtime.section.online?.icon || runtime.icons.online || V47_ASSETS.mostOnline} label={runtime.section.online?.title || 'Most Online Now'} />
          <div className={styles.onlineGrid}>
            {onlineGames.slice(0, 6).map((item) => (
              <article key={`${item.provider}-${item.id}`} className={styles.onlineCard}>
                <div className={styles.onlineImage}>
                  <MappedImage src={item.image} alt={item.name} />
                  {item.badge === 'HOT' ? <span className={styles.hotBadge}>HOT</span> : null}
                </div>
                <div><span>ออนไลน์</span><strong>{item.players.toLocaleString('en-US')}</strong></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {runtime.section.live?.enabled !== false ? (
        <section className={styles.liveSection} aria-labelledby="mobile-live-heading">
          <SectionHeading id="mobile-live-heading" icon={runtime.section.live?.icon || runtime.icons.live || V47_ASSETS.liveIcon} label={runtime.section.live?.title || 'Live Now!!'} />
          <div className={styles.liveList}>
            {LIVE_MATCHES.map(([league, time, home, away, homeLogo, awayLogo]) => (
              <article key={`${league}-${home}`} className={styles.liveCard}>
                <div className={styles.liveMeta}>
                  <span><SoccerIcon />{league}</span>
                  <strong>LIVE <small>{time}</small></strong>
                </div>
                <div className={styles.liveTeams}>
                  <span><MappedImage src={homeLogo} alt="" /><b>{home}</b></span>
                  <strong>VS</strong>
                  <span><MappedImage src={awayLogo} alt="" /><b>{away}</b></span>
                </div>
                <div className={styles.liveActions}>
                  <button type="button" onClick={() => navigate(runtime.section.live?.href || '/live')}><LiveIcon />ดูถ่ายทอดสด</button>
                  <button type="button" onClick={() => navigate(runtime.section.live?.href || '/browse/games?category=sport')}>เดิมพันทันที</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {runtime.section.classic?.enabled !== false ? (
        <GameRailSection
          id="mobile-classic-heading"
          title={runtime.section.classic?.title || 'Classic Games'}
          icon={runtime.section.classic?.icon || runtime.icons.classic || V47_ASSETS.mobilePopular}
          games={classicGames}
        />
      ) : null}

      {runtime.features.usageGuide ? (
        <section className={styles.guideSection} aria-labelledby="mobile-guide-heading">
          <SectionHeading id="mobile-guide-heading" icon={V47_ASSETS.mobileFaq} label={runtime.guideTitle || 'Guide'} />
          <div className={styles.guideGrid}>
            {GUIDES.map((guide, index) => (
              <button key={guide} type="button" onClick={() => navigate('/guide')}><span>{index + 1}</span><strong>{guide}</strong><Chevron /></button>
            ))}
          </div>
          <button type="button" className={styles.viewAllButton} onClick={() => navigate('/guide')}>ดูทั้งหมด <Chevron /></button>
        </section>
      ) : null}
    </div>
  );
}

function GameRailSection({ id, title, icon, games }: {
  id: string;
  title: string;
  icon: string;
  games: MobileSourceGame[];
}) {
  return (
    <section className={styles.gameSection} aria-labelledby={id}>
      <SectionHeading id={id} icon={icon} label={title} />
      <div className={styles.gameRail}>
        {games.map((item) => (
          <article key={`${item.provider}-${item.id}`} className={styles.gameCard}>
            <div className={styles.gamePoster}>
              <MappedImage src={item.image} alt={item.name} />
              {item.badge ? <span className={item.badge === 'HOT' ? styles.hotBadge : styles.newBadge}>{item.badge}</span> : null}
            </div>
            <div className={styles.gameMeta}>
              <MappedImage src={item.providerIcon} alt="" />
              <span><strong>{item.name}</strong><small>{item.provider}</small></span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ id, icon, label }: { id: string; icon: string; label: string }) {
  return (
    <div className={styles.sectionHeading}>
      <div aria-hidden="true" />
      <span><MappedImage src={icon} alt="" /><strong id={id}>{label}</strong></span>
    </div>
  );
}

function MappedImage({ src, alt }: { src: string; alt: string }) {
  const source = src.trim();
  if (!source) return null;

  const resolvedSrc = resolveLocalAssetByBasename(source, 'mobile') || source;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      data-asset-filename={assetFileName(source)}
      onError={(event) => {
        if (resolvedSrc !== source && /^https?:\/\//i.test(source)) {
          event.currentTarget.src = source;
          return;
        }
        event.currentTarget.hidden = true;
      }}
    />
  );
}

function assetFileName(value: string) {
  const pathname = safePathname(value);
  return pathname.split('/').filter(Boolean).pop()?.split(/[?#]/, 1)[0] ?? '';
}

function safePathname(value: string) {
  const normalized = value.trim().replace(/\\/g, '/');
  if (!/^https?:\/\//i.test(normalized)) return normalized.split(/[?#]/, 1)[0] ?? '';
  try {
    return new URL(normalized).pathname;
  } catch {
    return '';
  }
}

function padTournamentPlayers(players: MobileSourceTournament['players']) {
  return Array.from({ length: 10 }, (_, index) => players[index] ?? player('-', 0, [0, 0, 0, 0, 0, 0]));
}

function navigate(href: string) {
  if (!href) return;
  window.location.assign(href);
}

function tournament(id: string, title: string, players: MobileSourceTournament['players']): MobileSourceTournament {
  return { id, title, status: 'สิ้นสุดแล้ว', href: '/browse/tournaments', players: padTournamentPlayers(players) };
}

function player(name: string, score: number, stats: [number, number, number, number, number, number]) {
  return { name, score, stats };
}

function leaderboard(rank: number, user: string, gameName: string, provider: string, amount: string, providerIcon: string, gameImage: string): MobileSourceLeaderboardRow {
  return { rank, user, game: gameName, provider, amount, providerIcon, gameImage };
}

function game(id: string, name: string, provider: string, providerIcon: string, image: string, badge: MobileSourceGame['badge'], players: number, category: string): MobileSourceGame {
  return { id, name, provider, providerIcon, image, badge, players, category, popular: badge === 'HOT' };
}

function Chevron() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>;
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>;
}

function SoccerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3 2-1 4h-4L9 9l3-2ZM10 13l-3 2M14 13l3 2M9 9 6-1M7 15l1 3M17 15l-1 3" />
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9 5 3-5 3V9Z" />
    </svg>
  );
}
