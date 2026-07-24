'use client';

import type { CmsContent } from '../../site-settings';
import type { Game } from '../../types/member-api';
import { HomePromotionCarousel } from './home-promotion-carousel';

type DesktopGameSections = {
  featured: Game[];
  popular: Game[];
  recent: Game[];
  favorites: Game[];
};

export function DesktopHomeScaffold({
  content,
  siteName,
  showPromotion,
  games,
  isGamesLoading,
  gamesMessage,
}: {
  content: CmsContent;
  siteName: string;
  showPromotion: boolean;
  games: DesktopGameSections;
  isGamesLoading: boolean;
  gamesMessage: string;
}) {
  const sections = [
    { title: 'เกมไฮไลต์', items: games.featured },
    { title: 'Top 10 Games', items: games.popular },
    { title: 'เล่นล่าสุด', items: games.recent },
    { title: 'เกมโปรด', items: games.favorites },
  ];

  return (
    <section className="desktop-home" aria-label="หน้าแรกเดสก์ท็อป">
      <div className="desktop-home__main">
        <section className="desktop-home__hero-grid">
          <div className="desktop-home__hero-primary">
            {showPromotion ? (
              <HomePromotionCarousel content={content} siteName={siteName} />
            ) : (
              <div className="desktop-home__placeholder desktop-home__placeholder--hero">PROMOTION</div>
            )}
          </div>
          <div className="desktop-home__hero-stack">
            <a className="desktop-home__feature-tile desktop-home__feature-tile--activity" href="/promotions">
              <span>ACTIVITY</span>
              <strong>กิจกรรมประจำสัปดาห์</strong>
              <small>ดูสิทธิ์และรางวัลทั้งหมด</small>
            </a>
            <a className="desktop-home__feature-tile desktop-home__feature-tile--news" href="/notifications">
              <span>NEWS</span>
              <strong>ข่าวสารและประกาศ</strong>
              <small>ติดตามรายการอัปเดตล่าสุด</small>
            </a>
          </div>
        </section>

        <section className="desktop-home__quick-strip" aria-label="เมนูลัด">
          {[
            ['ฝากเงิน', '/deposit'],
            ['ถอนเงิน', '/withdraw'],
            ['โปรโมชั่น', '/promotions'],
            ['เกมทั้งหมด', '/games'],
          ].map(([label, href]) => (
            <a key={href} href={href}><strong>{label}</strong><span>เปิดเมนู</span></a>
          ))}
        </section>

        <section className="desktop-home__promo-row" aria-label="โปรโมชั่นเด่น">
          {['โปรโมชั่น', 'กิจกรรม', 'ข่าวสาร'].map((label, index) => (
            <article key={label} className="desktop-home__promo-card">
              <div className={`desktop-home__promo-art desktop-home__promo-art--${index + 1}`}><span>{label}</span></div>
              <div className="desktop-home__promo-copy">
                <strong>{label}</strong>
                <span>รวมรายการสำคัญสำหรับสมาชิก</span>
              </div>
            </article>
          ))}
        </section>

        <section className="desktop-home__tournament">
          <div className="desktop-home__section-heading">
            <div><span>TOURNAMENT</span><h2>การแข่งขันล่าสุด</h2></div>
            <a href="/promotions">ดูทั้งหมด</a>
          </div>
          <div className="desktop-home__tournament-banner">
            <div><span>WEEKLY TOURNAMENT</span><strong>แข่งขันสะสมแต้มประจำสัปดาห์</strong><small>พื้นที่พร้อมเชื่อม Tournament API</small></div>
          </div>
          <div className="desktop-home__match-row">
            {['รายการแข่งขัน', 'อันดับผู้เล่น', 'รางวัลล่าสุด'].map((label) => (
              <div key={label} className="desktop-home__match-card"><span>{label}</span><strong>รอข้อมูลแบบเรียลไทม์</strong></div>
            ))}
          </div>
        </section>

        {sections.map((section) => (
          <GameSection
            key={section.title}
            title={section.title}
            games={section.items}
            loading={isGamesLoading}
            message={gamesMessage}
          />
        ))}

        <section className="desktop-home__guide">
          <div className="desktop-home__section-heading"><h2>คู่มือการใช้งาน</h2></div>
          {['วิธีสมัครสมาชิก', 'วิธีฝากเงิน', 'วิธีถอนเงิน'].map((item) => (
            <details key={item}><summary>{item}</summary><p>ข้อมูลคู่มือจะเชื่อมจาก CMS ของระบบ</p></details>
          ))}
        </section>
      </div>

      <aside className="desktop-home__sidebar" aria-label="ข้อมูลเสริม">
        <section className="desktop-home__side-card desktop-home__side-card--jackpot">
          <span>JACKPOT</span><strong>฿ 88,888,888.00</strong><small>เตรียมเชื่อมข้อมูลรางวัล</small>
        </section>
        <section className="desktop-home__side-card">
          <div className="desktop-home__side-title"><strong>Leaderboard</strong><span>วันนี้</span></div>
          {[1, 2, 3, 4, 5].map((rank) => <div key={rank} className="desktop-home__leader-row"><b>{rank}</b><span>Player {rank}</span><strong>฿0.00</strong></div>)}
        </section>
        <section className="desktop-home__side-card desktop-home__mini-game"><span>MINI GAME</span><strong>Lucky Wheel</strong><button type="button">เล่นเลย</button></section>
        <section className="desktop-home__side-card">
          <div className="desktop-home__side-title"><strong>ผู้ชนะล่าสุด</strong><span>LIVE</span></div>
          {[1, 2, 3, 4].map((item) => <div key={item} className="desktop-home__winner-row"><div className="desktop-home__winner-avatar" /><div><strong>สมาชิก***{item}</strong><span>ได้รับรางวัลล่าสุด</span></div></div>)}
        </section>
      </aside>
    </section>
  );
}

function GameSection({ title, games, loading, message }: { title: string; games: Game[]; loading: boolean; message: string }) {
  const visibleGames = games.slice(0, 8);
  return (
    <section className="desktop-home__games">
      <div className="desktop-home__section-heading desktop-home__section-heading--games"><h2>{title}</h2><a href="/games">ดูทั้งหมด</a></div>
      {loading ? <div className="desktop-home__empty">กำลังโหลดเกมจาก API...</div> : visibleGames.length ? (
        <div className="desktop-home__game-grid">
          {visibleGames.map((game) => <GameCard key={game.id} game={game} />)}
        </div>
      ) : <div className="desktop-home__empty">{message || 'ยังไม่มีข้อมูลเกมในหมวดนี้'}</div>}
    </section>
  );
}

function GameCard({ game }: { game: Game }) {
  const media = Array.isArray(game.media) ? game.media : [];
  const image = media.find((item) => item?.cachedUrl)?.cachedUrl || media.find((item) => item?.sourceUrl)?.sourceUrl || '';
  const provider = game.provider?.name || game.provider?.code || 'Provider';
  return (
    <a className="desktop-home__game-card" href={`/games/${encodeURIComponent(game.id)}`}>
      <div className="desktop-home__game-art">
        {image ? <img src={image} alt={game.name} loading="lazy" /> : <span>{game.name.slice(0, 1).toUpperCase()}</span>}
        {game.isNew && <em>NEW</em>}
      </div>
      <div className="desktop-home__game-meta"><strong>{game.name}</strong><span>{provider}</span></div>
    </a>
  );
}
