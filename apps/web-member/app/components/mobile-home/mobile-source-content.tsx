'use client';

import styles from './mobile-source-content.module.css';

const SOURCE_ROOT = '/assets/asset-pc/images';

const TOURNAMENTS = [
  {
    title: 'No1. Tournament Football Royale ครั้งที่ 2',
    players: [
      ['ZAXXXU709740', 20, [17, 0, 0, 0, 7, 0]],
      ['ZAXXXM664100', 17, [13, 3, 0, 4, 4, 0]],
      ['ZAXXXR440174', 13, [13, 2, 0, 3, 5, 1]],
      ['ZAXXXU410005', 11, [13, 2, 0, 1, 7, 1]],
      ['ZAXXXO539314', 9, [11, 3, 0, 4, 3, 3]],
      ['ZAXXXU746289', 8, [14, 0, 0, 0, 10, 0]],
      ['ZAXXXY111105', 6, [10, 4, 0, 2, 6, 2]],
      ['-', 0, [0, 0, 0, 0, 0, 0]],
      ['-', 0, [0, 0, 0, 0, 0, 0]],
      ['-', 0, [0, 0, 0, 0, 0, 0]],
    ],
  },
  {
    title: 'No1. Tournament Football Classic ครั้งที่ 2',
    players: [
      ['ZAXXXU164013', 12, [14, 1, 0, 1, 7, 1]],
      ['ZAXXXX399733', 10, [9, 6, 0, 4, 5, 0]],
      ['ZAXXXW621805', 9, [11, 4, 0, 1, 4, 4]],
      ['ZAXXXO227775', 8, [13, 0, 0, 4, 6, 1]],
      ['ZAXXXR646987', 6, [11, 3, 0, 1, 9, 0]],
      ['ZAXXXO342818', 4, [11, 1, 0, 5, 7, 0]],
      ['ZAXXX923400', 3, [10, 3, 0, 2, 9, 0]],
      ['-', 0, [0, 0, 0, 0, 0, 0]],
      ['-', 0, [0, 0, 0, 0, 0, 0]],
      ['-', 0, [0, 0, 0, 0, 0, 0]],
    ],
  },
] as const;

const LEADERBOARD_ROWS = [
  ['061XXXX220', 'Treasures of Aztec', 'PG SLOT', '4,512', 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png', 'https://cdn.zabbet.com/games/pgslot/vertical/treasures_of_aztec.jpg'],
  ['092XXXX148', 'Crazy Time', 'EVOLUTION', '3,920', 'https://cdn.zabbet.com/providers/set/1_1_v/evt.png', 'https://cdn.zabbet.com/games/1684318646873-73cdc710-185c-4b7e-b5e2-f2bc2c1ee646.jpg'],
  ['084XXXX642', 'SBO Sports', 'SBO', '3,132', 'https://cdn.zabbet.com/providers/set/1_1_v/sbo.png', 'https://cdn.zabbet.com/providers/set/1_1_v/sbo.png'],
  ['086XXXX339', 'Lightning Roulette', 'EVOLUTION', '1,810', 'https://cdn.zabbet.com/providers/set/1_1_v/evt.png', 'https://cdn.zabbet.com/games/1684318646873-73cdc710-185c-4b7e-b5e2-f2bc2c1ee646.jpg'],
  ['062XXXX551', 'Lucky Neko', 'PG SLOT', '1,428', 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png', 'https://cdn.zabbet.com/games/pgslot/vertical/treasures_of_aztec.jpg'],
] as const;

const POPULAR_GAMES = [
  ['JILI', 'Money Coming', 'https://cdn.zabbet.com/providers/set/1_1_badge/jl.png', 'https://cdn.zabbet.com/games/1755656755936-62320722-2f7a-4710-9e52-f598c9406a93.jpeg', 'HOT'],
  ['YGR', 'Lucky Jaguar', 'https://cdn.zabbet.com/providers/set/1_1_badge/ygr.png', 'https://cdn.zabbet.com/games/1704871891426-d938a4ec-5a3c-475f-a1d0-c410e0b30782.jpg', 'HOT'],
  ['NLC', 'El Paso', 'https://cdn.zabbet.com/providers/set/1_1_badge/nlc.png', 'https://cdn.zabbet.com/games/NLC/elpaso0000000000.jpg', 'NEW'],
  ['PP', 'Sweet Bonanza Xmas', 'https://cdn.zabbet.com/providers/set/1_1_badge/pp.png', 'https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png', 'NEW'],
  ['RSG', 'Golden Empire', 'https://cdn.zabbet.com/providers/set/1_1_badge/rsg.png', 'https://cdn.zabbet.com/games/1684776659135-399a7654-b556-4a24-885d-3946c7322fb9.jpg', 'NEW'],
  ['PS', 'Mahjong Ways', 'https://cdn.zabbet.com/providers/set/1_1_badge/ps.png', 'https://cdn.zabbet.com/games/1692882357754-c47b8426-4045-4792-8ee3-58b784ed9a78.jpg', 'NEW'],
  ['KINGM', 'Thai Hi Lo 2', 'https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png', 'https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg', 'NEW'],
  ['PP', 'Starlight Princess', 'https://cdn.zabbet.com/providers/set/1_1_badge/pp.png', 'https://cdn.zabbet.com/games/vertical/PP/starlight_princess.png', 'NEW'],
] as const;

const ONLINE_GAMES = [
  ['4,132', 'https://cdn.zabbet.com/FEZX/highlight/1729314673983-77cc8959-5e30-4372-96a5-75df61251087.jpeg', false],
  ['3,005', 'https://cdn.zabbet.com/FEZX/highlight/1729314682179-2f2cd5b6-cadd-4e83-850d-a6f9f2eb68a6.jpeg', true],
  ['2,200', 'https://cdn.zabbet.com/FEZX/highlight/1729314708585-cf6d4f54-740b-437c-8c68-eeb335650199.jpeg', true],
  ['5,019', 'https://cdn.zabbet.com/FEZX/highlight/1729314712283-8e9a06f9-6d2e-42fd-b096-a8f400df89dc.jpeg', true],
  ['2,235', 'https://cdn.zabbet.com/FEZX/highlight/1731504909009-3b869385-72bb-4d54-a1c5-7a99313b5409.png', true],
  ['1,905', 'https://cdn.zabbet.com/games/vertical/PP/starlight_princess.png', true],
] as const;

const LIVE_MATCHES = [
  ['โปแลนด์ - เอ็คสตราคลาซ่า', 'Aug 1, 01:30', 'Motor Lublin', 'ยาเกียลโลเนีย เบียลี่สต็อค', 'https://googlecdn.live/teams/uploads/logo-none.png', 'https://googlecdn.live/teams/1670.png'],
  ['โรมาเนีย - ลีกา 1', 'Aug 1, 01:30', 'โอเตลุล กาลาติ', 'โวลุนตารี่', 'https://googlecdn.live/teams/1782.png', 'https://googlecdn.live/teams/11607.png'],
  ['โลก - อุ่นเครื่องสโมสร', 'Aug 1, 01:45', 'เรอัล บายาโดลิด', 'เกตาเฟ่', 'https://googlecdn.live/teams/1680.png', 'https://googlecdn.live/teams/694.png'],
] as const;

const CLASSIC_GAMES = [
  ['Bushido Ways', 'NLC', 'https://cdn.zabbet.com/providers/set/1_1_badge/nlc.png', 'https://cdn.zabbet.com/games/NLC/bushidoways00000.jpg', 'NEW'],
  ['Fortune Gems', 'JOKER', 'https://cdn.zabbet.com/providers/set/1_1_badge/jkgx2.png', 'https://cdn.zabbet.com/games/1672859746105-2f854e5f-234b-435f-80f0-df5be2f08d7f.jpg', 'NEW'],
  ['Alice Run', 'CQ9', 'https://cdn.zabbet.com/providers/set/1_1_badge/cq.png', 'https://cdn.zabbet.com/games/vertical/CQ/alice_run.jpg', 'NEW'],
  ['Penalty Series', 'EVP', 'https://cdn.zabbet.com/providers/set/1_1_badge/evp.png', 'https://cdn.zabbet.com/games/vertical/EVP/penalty_series.jpg', 'HOT'],
  ['Fa Chai', 'FACHAI', 'https://cdn.zabbet.com/providers/set/1_1_badge/fachai.png', 'https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png', 'NEW'],
] as const;

const GUIDES = [
  'ฝากเงินแบบ โอนผ่านธนาคาร',
  'ฝากเงินแบบ โอนผ่าน QR Payment',
  'ฝากเงินแบบ ฝากจุดทศนิยม',
  'วิธีการฝากแบบ TrueWallet',
  'ยอดไม่เข้าทันที ทำยังไงดี?',
] as const;

export default function MobileSourceContent() {
  return (
    <div className={styles.root} data-mobile-section-owner="source-content">
      <section className={styles.tournamentSection} aria-labelledby="mobile-tournament-heading">
        <div className={styles.tournamentBanner}>
          <MappedImage
            src="https://cdn.zabbet.com/ZAB1/tournament/647280b5-3a23-4118-80a0-1b7feb340d1a.png"
            alt="Tournament"
          />
        </div>
        <SectionHeading id="mobile-tournament-heading" icon="/images/home/tournament.svg" label="ทัวร์นาเมนต์" />
        <div className={styles.tournamentRail}>
          {TOURNAMENTS.map((tournament) => (
            <article key={tournament.title} className={styles.tournamentCard}>
              <div className={styles.tournamentTitleRow}>
                <strong>{tournament.title}</strong>
                <button type="button">ดูทั้งหมด <Chevron /></button>
              </div>
              <div className={styles.tournamentStatus}><span>สิ้นสุดแล้ว</span><InfoIcon /></div>
              <div className={styles.rankRail}>
                {tournament.players.map(([name, score, stats], index) => (
                  <div key={`${tournament.title}-${index}`} className={styles.rankCard}>
                    <div className={styles.rankBadge}>
                      <MappedImage
                        src={index < 3 ? '/images/predict/mobile/rankBadgeTop3.svg' : '/images/predict/mobile/rankBadgeOther.svg'}
                        alt=""
                      />
                      <strong>{index + 1}</strong>
                    </div>
                    <span className={styles.rankName}>{name}</span>
                    <strong className={index < 3 ? styles.rankScoreTop : styles.rankScore}>{score}</strong>
                    <div className={styles.rankStats}>
                      {stats.map((value, statIndex) => (
                        <span key={statIndex}>
                          <i data-stat={statIndex} />
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.jackpotBanner} aria-label="ยอดรางวัลรวม">
        <MappedImage src="https://cdn.zabbet.com/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif" alt="" />
        <strong>197,676,002</strong>
      </section>

      <section className={styles.leaderboardSection} aria-labelledby="mobile-leaderboard-heading">
        <SectionHeading id="mobile-leaderboard-heading" icon="/images/home/leader-board.svg" label="Leaderboard" />
        <div className={styles.leaderboardTable}>
          <div className={styles.tableHead}><span>ลำดับ</span><span>ชื่อผู้ใช้</span><span>เกม</span><span>รายได้ที่ได้รับ</span></div>
          {LEADERBOARD_ROWS.map(([user, game, provider, amount, providerIcon, gameImage], index) => (
            <div key={user} className={styles.tableRow}>
              <strong>{index + 1}</strong>
              <span>{user}</span>
              <span className={styles.tableGame}>
                <MappedImage src={gameImage} alt="" />
                <span><b>{game}</b><small><MappedImage src={providerIcon} alt="" />{provider}</small></span>
              </span>
              <strong>{amount}</strong>
            </div>
          ))}
        </div>
      </section>

      <GameRailSection id="mobile-popular-heading" title="Top 10 Popular Games" icon="/images/home/fire.svg" games={POPULAR_GAMES} />

      <section className={styles.onlineSection} aria-labelledby="mobile-online-heading">
        <SectionHeading id="mobile-online-heading" icon="/images/home/mostonline.svg" label="Most Online Now" />
        <div className={styles.onlineGrid}>
          {ONLINE_GAMES.map(([count, image, hot]) => (
            <article key={`${count}-${image}`} className={styles.onlineCard}>
              <div className={styles.onlineImage}>
                <MappedImage src={image} alt="" />
                {hot ? <span className={styles.hotBadge}>HOT</span> : null}
              </div>
              <div><span>ออนไลน์</span><strong>{count}</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.liveSection} aria-labelledby="mobile-live-heading">
        <SectionHeading id="mobile-live-heading" icon="/images/home/live.svg" label="Live Now!!" />
        <div className={styles.liveList}>
          {LIVE_MATCHES.map(([league, time, home, away, homeLogo, awayLogo]) => (
            <article key={`${league}-${home}`} className={styles.liveCard}>
              <div className={styles.liveMeta}>
                <span><MappedImage src="/images/home/sports_soccer.svg" alt="" />{league}</span>
                <strong>LIVE <small>{time}</small></strong>
              </div>
              <div className={styles.liveTeams}>
                <span><MappedImage src={homeLogo} alt="" /><b>{home}</b></span>
                <strong>VS</strong>
                <span><MappedImage src={awayLogo} alt="" /><b>{away}</b></span>
              </div>
              <div className={styles.liveActions}>
                <button type="button"><MappedImage src="/images/home/white_live.svg" alt="" />ดูถ่ายทอดสด</button>
                <button type="button">เดิมพันทันที</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GameRailSection id="mobile-classic-heading" title="Classic Games" icon="/images/home/fire.svg" games={CLASSIC_GAMES} />

      <section className={styles.guideSection} aria-labelledby="mobile-guide-heading">
        <SectionHeading id="mobile-guide-heading" icon="/images/home/faq.svg" label="Guide" />
        <div className={styles.guideGrid}>
          {GUIDES.map((guide, index) => (
            <button key={guide} type="button"><span>{index + 1}</span><strong>{guide}</strong><Chevron /></button>
          ))}
        </div>
        <button type="button" className={styles.viewAllButton}>ดูทั้งหมด <Chevron /></button>
      </section>
    </div>
  );
}

function GameRailSection({ id, title, icon, games }: {
  id: string;
  title: string;
  icon: string;
  games: ReadonlyArray<readonly [string, string, string, string, string]>;
}) {
  return (
    <section className={styles.gameSection} aria-labelledby={id}>
      <SectionHeading id={id} icon={icon} label={title} />
      <div className={styles.gameRail}>
        {games.map(([name, provider, providerIcon, image, badge]) => (
          <article key={`${provider}-${name}`} className={styles.gameCard}>
            <div className={styles.gamePoster}>
              <MappedImage src={image} alt={name} />
              <span className={badge === 'HOT' ? styles.hotBadge : styles.newBadge}>{badge}</span>
            </div>
            <div className={styles.gameMeta}>
              <MappedImage src={providerIcon} alt="" />
              <span><strong>{name}</strong><small>{provider}</small></span>
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
  const localSrc = mapAssetToLocal(src);
  return (
    <img
      src={localSrc}
      alt={alt}
      loading="lazy"
      data-cdn-fallback={localSrc === src ? undefined : src}
      onError={(event) => {
        const image = event.currentTarget;
        const fallback = image.dataset.cdnFallback;
        if (!fallback || image.dataset.fallbackUsed === 'true') return;
        image.dataset.fallbackUsed = 'true';
        image.src = fallback;
      }}
    />
  );
}

function mapAssetToLocal(src: string) {
  if (src.startsWith('https://cdn.zabbet.com/')) {
    return `${SOURCE_ROOT}/${src.slice('https://cdn.zabbet.com/'.length)}`;
  }
  if (src.startsWith('/images/')) {
    return `${SOURCE_ROOT}/${src.slice('/images/'.length)}`;
  }
  return src;
}

function Chevron() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>;
}

function InfoIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></svg>;
}
