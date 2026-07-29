'use client';

import { applyMemberImageFallback, hideDecorativeImage } from '../image-fallback';
import { V47_ASSETS } from './v47-asset-map';

type PopularItem = {
  name: string;
  imageUrl: string;
  providerLogo: string;
  badge: 'HOT' | 'NEW' | '';
};

type OnlineItem = {
  imageUrl: string;
  players: number;
};

type LiveItem = {
  league: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
};

// The lobby has no live provider feed yet. These stay visibly marked as sample
// content, but every visual comes from the member project's local PC assets.
const POPULAR_ITEMS: PopularItem[] = [
  { name: 'ROMA X 10000', imageUrl: V47_ASSETS.quickPromotion, providerLogo: V47_ASSETS.gameHit, badge: 'HOT' },
  { name: 'Maya Golden City 2', imageUrl: V47_ASSETS.quickActivity, providerLogo: V47_ASSETS.gameHit, badge: 'HOT' },
  { name: 'El Paso Gunfight xNudge', imageUrl: V47_ASSETS.quickNews, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
  { name: 'Sweet Bonanza Xmas', imageUrl: V47_ASSETS.heroWinners, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
  { name: 'Roma', imageUrl: V47_ASSETS.heroLogin, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
  { name: 'TREASURES OF AZTEC Z', imageUrl: V47_ASSETS.heroNews, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
  { name: 'ไฮโลไทย 2', imageUrl: V47_ASSETS.jackpotStill, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
  { name: 'Starlight Princess', imageUrl: V47_ASSETS.tournament, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
  { name: 'Coin Spinner', imageUrl: V47_ASSETS.miniGame, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
  { name: 'Fortune Gems', imageUrl: V47_ASSETS.heroSide, providerLogo: V47_ASSETS.gameHit, badge: 'NEW' },
];

const ONLINE_ITEMS: OnlineItem[] = [
  { imageUrl: V47_ASSETS.quickPromotion, players: 3947 },
  { imageUrl: V47_ASSETS.quickActivity, players: 2979 },
  { imageUrl: V47_ASSETS.quickNews, players: 2201 },
  { imageUrl: V47_ASSETS.heroWinners, players: 5004 },
  { imageUrl: V47_ASSETS.heroLogin, players: 2112 },
  { imageUrl: V47_ASSETS.heroNews, players: 1925 },
];

const LIVE_ITEMS: LiveItem[] = [
  { league: 'เดนมาร์ก - ซูเปอร์ลีกา', home: 'แรนเดอร์ส', away: 'ซิลเคบอร์ก', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'นอร์เวย์ - ทิปเปลีเก้น', home: 'โรเซนบอร์ก', away: 'เฟรดริคสตัด', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'สวีเดน - อัลสเวนส์คาน', home: 'ฮัคเค่น', away: 'เอไอเค โซลน่า', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'ฮังการี - เอ็นบี ไอ', home: 'เอ็มทีเค บูดาเปสต์', away: 'ซาเลเกอร์สเซ็ก ทีอี', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'โรมาเนีย - ลีกา 1', home: 'โบโตซานี่', away: 'ราปิด บูคาเรสต์', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
  { league: 'เอกวาดอร์ - เซเรีย อา', home: 'มูชุค รูน่า', away: 'Libertad', homeLogo: V47_ASSETS.live, awayLogo: V47_ASSETS.tournament },
];

function SourceHeading({ title, icon, iconSize = 25, notice }: { title: string; icon: string; iconSize?: number; notice?: string }) {
  return (
    <header className="source-feed-heading">
      <span className="source-feed-heading__content">
        <img src={icon} alt="" aria-hidden="true" width={iconSize} height={iconSize} onError={hideDecorativeImage} />
        <strong>{title}</strong>
        {notice ? <small className="source-feed-heading__notice">{notice}</small> : null}
      </span>
    </header>
  );
}

export function SourcePopularSection() {
  return (
    <section className="source-feed-host source-feed-host--popular" data-section-kind="popular" data-content-state="demo">
      <div className="member-source-feed-mount member-source-feed-mount--popular">
        <div className="source-feed-section source-popular-section">
          <SourceHeading title="Top 10 Popular Games" icon="/images/highlight/icongamehit.webp" iconSize={24} notice="ข้อมูลตัวอย่าง" />
          <div className="source-popular-track" data-drag-scroll="true">
            {POPULAR_ITEMS.map((item, index) => (
              <a key={`${item.name}-${index}`} className="source-popular-card" href="/browse/games" title={item.name}>
                <span className="source-popular-card__art">
                  <img className="source-popular-card__blur" src={item.imageUrl} alt="" aria-hidden="true" onError={applyMemberImageFallback} />
                  <img className="source-popular-card__image" src={item.imageUrl} alt={item.name} onError={applyMemberImageFallback} />
                  <span className="source-popular-card__provider"><img src={item.providerLogo} alt="" aria-hidden="true" onError={applyMemberImageFallback} /></span>
                  {item.badge ? <span className={`source-popular-card__badge source-popular-card__badge--${item.badge.toLowerCase()}`}>{item.badge}</span> : null}
                </span>
                <span className="source-popular-card__name">{item.name}</span>
                <span className="source-popular-card__rank" aria-hidden="true">{index + 1}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SourceOnlineSection() {
  return (
    <section className="source-feed-host source-feed-host--online" data-section-kind="online" data-content-state="demo">
      <div className="member-source-feed-mount member-source-feed-mount--online">
        <div className="source-feed-section source-online-section">
          <SourceHeading title="Most Online Now" icon="/images/home/mostonline1.webp" notice="จำนวนผู้เล่นตัวอย่าง" />
          <div className="source-online-track" data-drag-scroll="true">
            {ONLINE_ITEMS.map((item, index) => (
              <a key={`${item.imageUrl}-${index}`} className="source-online-card" href="/browse/games">
                <span className="source-online-card__art"><img src={item.imageUrl} alt={`เกมตัวอย่างอันดับ ${index + 1}`} onError={applyMemberImageFallback} /></span>
                <span className="source-online-card__counter"><span className="source-online-card__counter-inner"><UserIcon /><strong>{item.players.toLocaleString('en-US')}</strong></span></span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SourceLiveSection({ onAction }: { onAction: () => void }) {
  return (
    <section className="source-feed-host source-feed-host--live" id="live" data-section-kind="live" data-content-state="demo">
      <div className="member-source-feed-mount member-source-feed-mount--live">
        <div className="source-feed-section source-live-section">
          <SourceHeading title="ตารางการแข่งขัน" icon="/images/home/live1.webp" notice="ข้อมูลตัวอย่าง ไม่ใช่รายการสด" />
          <div className="source-live-track" data-drag-scroll="true">
            {LIVE_ITEMS.map((match, index) => (
              <article key={`${match.league}-${index}`} className="source-live-card">
                <div className="source-live-card__inner">
                  <div className="source-live-card__glow" aria-hidden="true" />
                  <div className="source-live-card__content">
                    <header className="source-live-card__header">
                      <span className="source-live-card__league"><SoccerIcon /><span>{match.league}</span></span>
                      <span className="source-live-card__status"><b>ตัวอย่าง</b><time>กำหนดการจำลอง</time></span>
                    </header>
                    <div className="source-live-card__teams"><Team logo={match.homeLogo} name={match.home} /><strong>VS</strong><Team logo={match.awayLogo} name={match.away} /></div>
                    <footer className="source-live-card__actions">
                      <button type="button" className="source-live-card__watch" onClick={onAction}><LiveIcon /><span>ดูหมวดกีฬา</span></button>
                      <button type="button" className="source-live-card__bet" onClick={onAction}>เลือกเกมกีฬา</button>
                    </footer>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Team({ logo, name }: { logo: string; name: string }) {
  return <span className="source-live-team"><span className="source-live-team__logo"><img src={logo} alt="" aria-hidden="true" onError={applyMemberImageFallback} /></span><span title={name}>{name}</span></span>;
}

function UserIcon() {
  return <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true"><path d="M6 7.41a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666Z" fill="#944fe8" fillOpacity=".86" /><path d="M0 14.805a6 6 0 0 1 12 0 .6.6 0 0 1-.6.606H.6a.6.6 0 0 1-.6-.606Z" fill="#944fe8" fillOpacity=".86" /></svg>;
}

function SoccerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" /><path d="m12 7 3 2.2-1.15 3.5h-3.7L9 9.2 12 7Zm-3 2.2-3.5.4m8.35 3.1 2.2 3.05M10.15 12.7l-2.2 3.05m.05 0-1.25 2.7m9.3-2.7 1.2 2.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}

function LiveIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="white" /><path d="M3.4 3.4a6.5 6.5 0 0 0 0 9.2M12.6 3.4a6.5 6.5 0 0 1 0 9.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
