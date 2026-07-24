'use client';

import type { CmsContent } from '../../site-settings';
import { HomePromotionCarousel } from './home-promotion-carousel';

const GAME_SECTIONS = [
  'เกมไฮไลต์',
  'Top 10 Games',
  'Most Online',
  'Live Now',
  'Classic Games',
];

const GAME_CARDS = Array.from({ length: 8 }, (_, index) => index + 1);

export function DesktopHomeScaffold({
  content,
  siteName,
  showPromotion,
}: {
  content: CmsContent;
  siteName: string;
  showPromotion: boolean;
}) {
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
            <div className="desktop-home__placeholder">ACTIVITY</div>
            <div className="desktop-home__placeholder">NEWS</div>
          </div>
        </section>

        <section className="desktop-home__promo-row" aria-label="โปรโมชั่นเด่น">
          {['โปรโมชั่น', 'กิจกรรม', 'ข่าวสาร'].map((label) => (
            <article key={label} className="desktop-home__promo-card">
              <div className="desktop-home__promo-art">{label}</div>
              <div className="desktop-home__promo-copy">
                <strong>{label}</strong>
                <span>รายละเอียดและปุ่มดำเนินการ</span>
              </div>
            </article>
          ))}
        </section>

        <section className="desktop-home__tournament">
          <div className="desktop-home__section-heading">
            <div>
              <span>TOURNAMENT</span>
              <h2>การแข่งขันล่าสุด</h2>
            </div>
            <a href="/promotions">ดูทั้งหมด</a>
          </div>
          <div className="desktop-home__tournament-banner">TOURNAMENT BANNER</div>
          <div className="desktop-home__match-row">
            {['รายการแข่งขัน', 'อันดับผู้เล่น', 'รางวัลล่าสุด'].map((label) => (
              <div key={label} className="desktop-home__match-card">
                <span>{label}</span>
                <strong>กำลังรอเชื่อมข้อมูล</strong>
              </div>
            ))}
          </div>
        </section>

        {GAME_SECTIONS.map((title) => (
          <section key={title} className="desktop-home__games">
            <div className="desktop-home__section-heading desktop-home__section-heading--games">
              <h2>{title}</h2>
              <a href="/games">ดูทั้งหมด</a>
            </div>
            <div className="desktop-home__game-grid">
              {GAME_CARDS.map((card) => (
                <article key={card} className="desktop-home__game-card">
                  <div className="desktop-home__game-art">GAME</div>
                  <div className="desktop-home__game-meta">
                    <strong>Game name</strong>
                    <span>Provider</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <section className="desktop-home__guide">
          <div className="desktop-home__section-heading"><h2>คู่มือการใช้งาน</h2></div>
          {['วิธีสมัครสมาชิก', 'วิธีฝากเงิน', 'วิธีถอนเงิน'].map((item) => (
            <details key={item}>
              <summary>{item}</summary>
              <p>พื้นที่สำหรับข้อมูลคู่มือจาก CMS</p>
            </details>
          ))}
        </section>
      </div>

      <aside className="desktop-home__sidebar" aria-label="ข้อมูลเสริม">
        <section className="desktop-home__side-card desktop-home__side-card--jackpot">
          <span>JACKPOT</span>
          <strong>฿ 88,888,888.00</strong>
          <small>ยอดตัวอย่างก่อนเชื่อม API</small>
        </section>

        <section className="desktop-home__side-card">
          <div className="desktop-home__side-title"><strong>Leaderboard</strong><span>วันนี้</span></div>
          {[1, 2, 3, 4, 5].map((rank) => (
            <div key={rank} className="desktop-home__leader-row">
              <b>{rank}</b><span>Player {rank}</span><strong>฿0.00</strong>
            </div>
          ))}
        </section>

        <section className="desktop-home__side-card desktop-home__mini-game">
          <span>MINI GAME</span>
          <strong>Lucky Wheel</strong>
          <button type="button">เล่นเลย</button>
        </section>

        <section className="desktop-home__side-card">
          <div className="desktop-home__side-title"><strong>ผู้ชนะล่าสุด</strong><span>LIVE</span></div>
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="desktop-home__winner-row">
              <div className="desktop-home__winner-avatar" />
              <div><strong>สมาชิก***{item}</strong><span>ได้รับรางวัลล่าสุด</span></div>
            </div>
          ))}
        </section>
      </aside>
    </section>
  );
}
