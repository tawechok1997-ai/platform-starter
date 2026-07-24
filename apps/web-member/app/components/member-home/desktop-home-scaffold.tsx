'use client';

import type { SyntheticEvent } from 'react';
import type { CmsContent } from '../../site-settings';
import type { Game } from '../../types/member-api';

type DesktopGameSections = {
  featured: Game[];
  popular: Game[];
  recent: Game[];
  favorites: Game[];
};

const QUICK_LINKS = [
  { label: 'ฝากเงิน', hint: 'เติมเครดิต', href: '/deposit', icon: '＋' },
  { label: 'ถอนเงิน', hint: 'รับเงินรางวัล', href: '/withdraw', icon: '↗' },
  { label: 'โปรโมชั่น', hint: 'รับสิทธิ์ล่าสุด', href: '/promotions', icon: '★' },
  { label: 'เกมทั้งหมด', hint: 'เลือกค่ายและเกม', href: '/games', icon: '▦' },
];

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
  const banners = Array.isArray(content?.banners) ? content.banners : [];
  const announcements = Array.isArray(content?.announcements) ? content.announcements : [];
  const faqs = Array.isArray(content?.faqs) ? content.faqs : [];
  const enabledBanners = banners.filter((banner) => banner?.enabled);
  const heroBanner = enabledBanners[0];
  const featureTiles = enabledBanners.slice(1, 3);
  const promotionCards = enabledBanners.slice(0, 3);
  const announcement = announcements.find((item) => item?.enabled);
  const enabledFaqs = faqs.filter((item) => item?.enabled).slice(0, 5);
  const sections = [
    { title: 'เกมไฮไลต์', eyebrow: 'FEATURED', items: Array.isArray(games?.featured) ? games.featured : [] },
    { title: 'Top 10 Games', eyebrow: 'POPULAR', items: Array.isArray(games?.popular) ? games.popular : [] },
    { title: 'เล่นล่าสุด', eyebrow: 'RECENT', items: Array.isArray(games?.recent) ? games.recent : [] },
    { title: 'เกมโปรด', eyebrow: 'FAVORITES', items: Array.isArray(games?.favorites) ? games.favorites : [] },
  ];

  return (
    <section className="desktop-home" aria-label="หน้าแรกเดสก์ท็อป">
      <div className="desktop-home__main">
        <section className="desktop-home__hero-grid">
          <a className="desktop-home__hero-primary" href={heroBanner?.href || '/promotions'}>
            {showPromotion && heroBanner?.imageUrl ? (
              <img src={heroBanner.imageUrl} alt={heroBanner.title || siteName} onError={hideBrokenImage} />
            ) : null}
            <span className="desktop-home__hero-overlay" />
            <span className="desktop-home__hero-copy">
              <small>FEATURED PROMOTION</small>
              <strong>{heroBanner?.title || 'โปรโมชั่นสมาชิก'}</strong>
              <em>{heroBanner?.subtitle || 'ดูโปรโมชั่นและกิจกรรมล่าสุด'}</em>
            </span>
          </a>

          <div className="desktop-home__hero-stack">
            {featureTiles.length ? featureTiles.map((banner, index) => (
              <a key={`${banner.title || 'banner'}-${index}`} className="desktop-home__feature-tile" href={banner.href || '/promotions'}>
                {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title || 'โปรโมชั่น'} onError={hideBrokenImage} />}
                <span className="desktop-home__feature-tile-overlay" />
                <span className="desktop-home__feature-copy">
                  <small>{index === 0 ? 'ACTIVITY' : 'NEWS'}</small>
                  <strong>{banner.title || 'รายการแนะนำ'}</strong>
                  <em>{banner.subtitle || 'ดูรายละเอียดเพิ่มเติม'}</em>
                </span>
              </a>
            )) : (
              <>
                <a className="desktop-home__feature-tile desktop-home__feature-tile--activity" href="/promotions"><span className="desktop-home__feature-copy"><small>ACTIVITY</small><strong>กิจกรรมประจำสัปดาห์</strong><em>ดูสิทธิ์และรางวัลทั้งหมด</em></span></a>
                <a className="desktop-home__feature-tile desktop-home__feature-tile--news" href="/notifications"><span className="desktop-home__feature-copy"><small>NEWS</small><strong>ข่าวสารและประกาศ</strong><em>ติดตามรายการอัปเดตล่าสุด</em></span></a>
              </>
            )}
          </div>
        </section>

        {announcement && (
          <section className="desktop-home__announcement" aria-label="ประกาศล่าสุด">
            <b>ประกาศ</b><strong>{announcement.title || 'ประกาศล่าสุด'}</strong><span>{announcement.message || ''}</span>
          </section>
        )}

        <nav className="desktop-home__quick-strip" aria-label="เมนูลัด">
          {QUICK_LINKS.map((item) => (
            <a key={item.href} href={item.href}>
              <span className="desktop-home__quick-icon" aria-hidden="true">{item.icon}</span>
              <span><strong>{item.label}</strong><small>{item.hint}</small></span>
            </a>
          ))}
        </nav>

        <section className="desktop-home__promo-row" aria-label="โปรโมชั่นเด่น">
          {(promotionCards.length ? promotionCards : [
            { title: 'โปรโมชั่น', subtitle: 'สิทธิพิเศษสำหรับสมาชิก', imageUrl: '', href: '/promotions' },
            { title: 'กิจกรรม', subtitle: 'กิจกรรมประจำสัปดาห์', imageUrl: '', href: '/promotions' },
            { title: 'ข่าวสาร', subtitle: 'รายการอัปเดตล่าสุด', imageUrl: '', href: '/notifications' },
          ]).map((banner, index) => (
            <a key={`${banner.title || 'promotion'}-${index}`} href={banner.href || '/promotions'} className="desktop-home__promo-card">
              <div className={`desktop-home__promo-art desktop-home__promo-art--${index + 1}`}>
                {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title || 'โปรโมชั่น'} loading="lazy" onError={hideBrokenImage} />}
                <span className="desktop-home__promo-shade" />
              </div>
              <div className="desktop-home__promo-copy"><strong>{banner.title || 'โปรโมชั่น'}</strong><span>{banner.subtitle || 'ดูรายละเอียดเพิ่มเติม'}</span></div>
            </a>
          ))}
        </section>

        <section className="desktop-home__tournament">
          <div className="desktop-home__section-heading">
            <div><span>TOURNAMENT</span><h2>การแข่งขันล่าสุด</h2></div>
            <a href="/promotions">ดูทั้งหมด</a>
          </div>
          <div className="desktop-home__tournament-banner">
            <div><span>WEEKLY TOURNAMENT</span><strong>แข่งขันสะสมแต้มประจำสัปดาห์</strong><small>เตรียมพื้นที่สำหรับข้อมูล Tournament API</small></div>
          </div>
          <div className="desktop-home__match-row">
            {[
              ['รายการแข่งขัน', 'รอบปัจจุบัน'],
              ['อันดับผู้เล่น', 'อัปเดตแบบเรียลไทม์'],
              ['รางวัลล่าสุด', 'ประกาศผลอัตโนมัติ'],
            ].map(([label, value]) => <div key={label} className="desktop-home__match-card"><span>{label}</span><strong>{value}</strong></div>)}
          </div>
        </section>

        {sections.map((section) => (
          <GameSection key={section.title} title={section.title} eyebrow={section.eyebrow} games={section.items} loading={isGamesLoading} message={gamesMessage} />
        ))}

        <section className="desktop-home__guide">
          <div className="desktop-home__section-heading"><div><span>HELP CENTER</span><h2>คู่มือการใช้งาน</h2></div></div>
          {enabledFaqs.map((item) => (
            <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>
          ))}
          {!enabledFaqs.length && ['วิธีสมัครสมาชิก', 'วิธีฝากเงิน', 'วิธีถอนเงิน'].map((item) => (
            <details key={item}><summary>{item}</summary><p>ข้อมูลคู่มือจะเชื่อมจาก CMS ของระบบ</p></details>
          ))}
        </section>
      </div>

      <aside className="desktop-home__sidebar" aria-label="ข้อมูลเสริม">
        <section className="desktop-home__side-card desktop-home__side-card--jackpot"><span>JACKPOT</span><strong>฿ 88,888,888.00</strong><small>ยอดรางวัลรวมวันนี้</small></section>
        <section className="desktop-home__side-card">
          <div className="desktop-home__side-title"><strong>Leaderboard</strong><span>วันนี้</span></div>
          {[1, 2, 3, 4, 5].map((rank) => <div key={rank} className="desktop-home__leader-row"><b>{rank}</b><span>Player {rank}</span><strong>฿0.00</strong></div>)}
        </section>
        <section className="desktop-home__side-card desktop-home__mini-game"><span>MINI GAME</span><strong>Lucky Wheel</strong><small>ลุ้นรับรางวัลประจำวัน</small><button type="button">เล่นเลย</button></section>
        <section className="desktop-home__side-card">
          <div className="desktop-home__side-title"><strong>ผู้ชนะล่าสุด</strong><span>LIVE</span></div>
          {[1, 2, 3, 4].map((item) => <div key={item} className="desktop-home__winner-row"><div className="desktop-home__winner-avatar">{item}</div><div><strong>สมาชิก***{item}</strong><span>ได้รับรางวัลล่าสุด</span></div></div>)}
        </section>
      </aside>
    </section>
  );
}

function GameSection({ title, eyebrow, games, loading, message }: { title: string; eyebrow: string; games: Game[]; loading: boolean; message: string }) {
  const visibleGames = Array.isArray(games) ? games.slice(0, 10) : [];
  return (
    <section className="desktop-home__games">
      <div className="desktop-home__section-heading desktop-home__section-heading--games"><div><span>{eyebrow}</span><h2>{title}</h2></div><a href="/games">ดูทั้งหมด</a></div>
      {loading ? <div className="desktop-home__empty">กำลังโหลดเกมจาก API...</div> : visibleGames.length ? (
        <div className="desktop-home__game-grid">{visibleGames.map((game) => <GameCard key={game.id} game={game} />)}</div>
      ) : <div className="desktop-home__empty">{message || 'ยังไม่มีข้อมูลเกมในหมวดนี้'}</div>}
    </section>
  );
}

function GameCard({ game }: { game: Game }) {
  const media = Array.isArray(game?.media) ? game.media : [];
  const image = resolveGameImage(media);
  const provider = game?.provider?.name || game?.provider?.code || 'Provider';
  const name = typeof game?.name === 'string' && game.name.trim() ? game.name : 'Game';
  const id = typeof game?.id === 'string' ? game.id : '';
  return (
    <a className="desktop-home__game-card" href={id ? `/games/${encodeURIComponent(id)}` : '/games'}>
      <div className="desktop-home__game-art">
        {image ? <img src={image} alt={name} loading="lazy" onError={hideBrokenImage} /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
        {game?.isNew && <em>NEW</em>}
        <span className="desktop-home__game-play">เล่นเกม</span>
      </div>
      <div className="desktop-home__game-meta"><strong>{name}</strong><span>{provider}</span></div>
    </a>
  );
}

function resolveGameImage(media: Game['media']) {
  if (!Array.isArray(media)) return '';
  const candidate = media.find((item) => typeof item?.cachedUrl === 'string' && item.cachedUrl.trim())?.cachedUrl
    || media.find((item) => typeof item?.sourceUrl === 'string' && item.sourceUrl.trim())?.sourceUrl
    || '';
  if (!candidate) return '';
  if (/^https?:\/\//i.test(candidate) || candidate.startsWith('/')) return candidate;
  return `/${candidate.replace(/^\.\//, '')}`;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
