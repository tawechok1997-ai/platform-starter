'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CmsContent,
  MemberFeatureFlags,
  SiteIconSettings,
  defaultFeatureFlags,
  defaultIconSettings,
} from './site-settings';
import { CmsPopup } from './components/member-home-sections';
import { DesktopHomeScaffold } from './components/member-home/desktop-home-scaffold';
import { MobileV47Scaffold } from './components/member-home/mobile-v47-scaffold';
import { useMemberHomeData } from './hooks/use-member-home-data';

type MemberHomeProps = {
  siteName: string;
  description: string;
  primaryColor: string;
  cardColor: string;
  textColor: string;
  showBalanceHeader: boolean;
  showButtons: boolean;
  showPromotion: boolean;
  showProviders: boolean;
  showRecommended: boolean;
  cmsContent: CmsContent;
  icons?: SiteIconSettings;
  features?: MemberFeatureFlags;
};

type ViewportMode = 'desktop' | 'mobile';
type HomePopupKind = 'promotion' | 'activity' | 'news';

const POPUP_CLOSED_VERSION_KEY = 'member_cms_popup_closed_version';
const MOBILE_HOME_QUERY = '(max-width: 900px)';
const PROMOTION_CATEGORIES = ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย'] as const;
const SOURCE_PROMOTIONS = [
  {
    id: 'source-turnover-reward',
    title: 'ทำยอดเทิร์นรับรางวัลจุใจ🎉',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
  },
  {
    id: 'source-referral-reward',
    title: 'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!! 💜',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
  },
  {
    id: 'source-repeat-deposit',
    title: 'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
  },
] as const;

const SOURCE_ACTIVITIES = [
  {
    id: 'lottery-prediction',
    title: 'ทายผลหวย',
    deadline: 'หมดเขต : 2026-08-01',
    imageUrl: 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
  },
  {
    id: 'turnover-reward',
    title: 'ทำยอด Turn รับรางวัลจุใจ',
    deadline: '',
    imageUrl: 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
  },
] as const;

const ACTIVITY_COUNTDOWN = [
  { value: '03', label: 'วัน' },
  { value: '06', label: 'ชั่วโมง' },
  { value: '49', label: 'นาที' },
  { value: '45', label: 'วินาที' },
] as const;

export default function MemberHome(props: MemberHomeProps) {
  const features = props.features ?? defaultFeatureFlags;
  const icons = props.icons ?? defaultIconSettings;
  const [popupClosed, setPopupClosed] = useState(false);
  const [homePopup, setHomePopup] = useState<HomePopupKind | null>(null);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const popupVersion = props.cmsContent.popup.version ?? 'v1';
  const data = useMemberHomeData(features.games);
  const gameSections = {
    featured: data.featured,
    popular: data.popular,
    recent: data.recentGames,
    favorites: data.favoriteGames,
  };

  useEffect(() => {
    setPopupClosed(readClosedPopupVersion() === popupVersion);
  }, [popupVersion]);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_HOME_QUERY);
    const syncViewport = () => setViewportMode(media.matches ? 'mobile' : 'desktop');

    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  function closePopup() {
    writeClosedPopupVersion(popupVersion);
    setPopupClosed(true);
  }

  const openHomePopup = (kind: HomePopupKind) => () => setHomePopup(kind);

  let homeContent: ReactNode;
  if (viewportMode === 'mobile') {
    homeContent = (
      <MobileV47Scaffold
        content={props.cmsContent}
        icons={icons}
        siteName={props.siteName}
        games={gameSections}
        isGamesLoading={data.isGamesLoading}
        gamesMessage={data.gamesMessage}
        onOpenPromotion={openHomePopup('promotion')}
        onOpenActivity={openHomePopup('activity')}
        onOpenNews={openHomePopup('news')}
      />
    );
  } else {
    homeContent = (
      <DesktopHomeScaffold
        content={props.cmsContent}
        icons={icons}
        siteName={props.siteName}
        showPromotion={props.showPromotion && features.games}
        games={gameSections}
        isGamesLoading={data.isGamesLoading}
        gamesMessage={data.gamesMessage}
        onOpenPromotion={openHomePopup('promotion')}
        onOpenActivity={openHomePopup('activity')}
        onOpenNews={openHomePopup('news')}
      />
    );
  }

  const closeHomePopup = () => setHomePopup(null);

  return (
    <>
      {homeContent}
      {homePopup === 'promotion' && <SourcePromotionPopup onClose={closeHomePopup} />}
      {homePopup === 'activity' && <SourceActivityPopup onClose={closeHomePopup} />}
      {homePopup === 'news' && <SourceNewsPopup onClose={closeHomePopup} />}
      {props.cmsContent.popup.enabled && !popupClosed && !homePopup && (
        <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />
      )}
    </>
  );
}

function PopupFrame({
  kind,
  title,
  icon,
  onClose,
  children,
}: {
  kind: HomePopupKind;
  title: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = `home-${kind}-popup-title`;
  return (
    <div className="home-promotion-popup" data-kind={kind} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="home-promotion-popup__backdrop" aria-label={`ปิดหน้าต่าง${title}`} onClick={onClose} />
      <section className={`home-promotion-popup__panel home-promotion-popup__panel--${kind}`}>
        <div className="home-promotion-popup__shine" aria-hidden="true" />
        <header className="home-promotion-popup__header">
          <div className="home-promotion-popup__title">
            <span className="home-promotion-popup__gift" aria-hidden="true">{icon}</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="home-promotion-popup__close" onClick={onClose} aria-label={`ปิด${title}`}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}

function SourcePromotionPopup({ onClose }: { onClose: () => void }) {
  return (
    <PopupFrame kind="promotion" title="โปรโมชั่น" icon={<GiftIcon />} onClose={onClose}>
      <div className="home-promotion-popup__content">
        <div className="home-promotion-popup__tabs" aria-label="หมวดโปรโมชั่น">
          {PROMOTION_CATEGORIES.map((label, index) => (
            <span key={label} className={index === 0 ? 'is-active' : ''}>{label}</span>
          ))}
        </div>
        <div className="home-promotion-popup__grid">
          {SOURCE_PROMOTIONS.map((promotion) => (
            <article key={promotion.id} className="home-promotion-popup__card">
              <div className="home-promotion-popup__media">
                <img src={promotion.imageUrl} alt={promotion.title} loading="lazy" />
              </div>
              <strong>{promotion.title}</strong>
            </article>
          ))}
        </div>
      </div>
    </PopupFrame>
  );
}

function SourceActivityPopup({ onClose }: { onClose: () => void }) {
  return (
    <PopupFrame kind="activity" title="กิจกรรม" icon={<ActivityIcon />} onClose={onClose}>
      <div className="home-activity-popup__body">
        <div className="home-activity-popup__list" aria-label="รายการกิจกรรม">
          {SOURCE_ACTIVITIES.map((activity, index) => (
            <button key={activity.id} type="button" className={`home-activity-popup__item${index === 0 ? ' is-active' : ''}`}>
              <img src={activity.imageUrl} alt="" loading="lazy" />
              <span>
                <strong>{activity.title}</strong>
                <i aria-hidden="true" />
                {activity.deadline ? <small>{activity.deadline}</small> : null}
              </span>
            </button>
          ))}
        </div>

        <div className="home-activity-popup__divider" aria-hidden="true" />

        <div className="home-activity-popup__detail">
          <h3>ทายผลหวย</h3>
          <div className="home-activity-popup__countdown" aria-label="เวลาที่เหลือ">
            {ACTIVITY_COUNTDOWN.map((unit, index) => (
              <span key={unit.label}>
                <b>{unit.value}</b>
                <small>{unit.label}</small>
                {index < ACTIVITY_COUNTDOWN.length - 1 ? <em aria-hidden="true">:</em> : null}
              </span>
            ))}
          </div>
          <img className="home-activity-popup__banner" src="https://cdn.zabbet.com/event/predict/1784904660399-a6cb7821-1abb-4422-bbc2-27606ba0e7b4.jpeg" alt="กิจกรรมทายผลหวย" />
          <h4>กิจกรรมทายผลหวย</h4>
          <p>กรุณาทายผลให้ครบทั้ง 3 ตัวบน และ 2 ตัวล่าง</p>
          <div className="home-activity-popup__inputs">
            <label>
              <strong>ระบุตัวเลขท้าย 3 ตัวบน</strong>
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} aria-label="เลขท้าย 3 ตัวบน" />
            </label>
            <label>
              <strong>ระบุตัวเลขท้าย 2 ตัวล่าง</strong>
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={2} aria-label="เลขท้าย 2 ตัวล่าง" />
            </label>
          </div>
          <details className="home-activity-popup__terms">
            <summary>เงื่อนไขเข้าร่วมกิจกรรม</summary>
            <p>กรอกหมายเลขให้ครบตามจำนวนหลักและตรวจสอบข้อมูลก่อนยืนยัน</p>
          </details>
        </div>
      </div>
    </PopupFrame>
  );
}

function SourceNewsPopup({ onClose }: { onClose: () => void }) {
  return (
    <PopupFrame kind="news" title="ข่าวสาร" icon={<NewsIcon />} onClose={onClose}>
      <div className="home-news-popup__empty">
        <EmptyNewsIcon />
        <strong>ไม่มีข้อความใหม่</strong>
      </div>
    </PopupFrame>
  );
}

function GiftIcon() {
  return (
    <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
      <path d="M26.4936 25.969V14.2852H5.39062V25.969C5.39062 27.0736 6.28606 27.969 7.39062 27.969H24.4936C25.5982 27.969 26.4936 27.0736 26.4936 25.969Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.9375 27.9688V14.2812M28.2157 11.082V12.2837C28.2157 13.3882 27.3203 14.2837 26.2157 14.2837H5.66406C4.5595 14.2837 3.66406 13.3882 3.66406 12.2837V11.082C3.66406 9.97747 4.5595 9.08203 5.66406 9.08203H26.2157C27.3203 9.08203 28.2157 9.97747 28.2157 11.082Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.9393 9.08334C15.9393 7.33334 13.8977 3.25 10.8352 3.25C5.85297 3.25 7.66787 9.08334 10.0525 9.08334M15.9375 9.08334C15.9375 7.33334 17.9792 3.25 21.0417 3.25C26.0239 3.25 24.2089 9.08334 21.8244 9.08334" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="31" height="30" viewBox="0 0 31 30" fill="none">
      <path d="M25.1995 27.4031L11.8394 22.4231C10.2394 21.8266 9.76737 19.8205 10.8794 18.3231L19.2594 9.94307C20.6717 8.61875 22.7829 9.17973 23.3795 11.0031L28.3395 24.3631C28.9816 26.3837 27.1951 28.1102 25.1995 27.4031Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.60156 15.2606C6.48968 14.765 7.52974 14.6154 8.52156 14.8406M10.161 9.56016C9.5946 8.70636 9.35988 7.67496 9.50096 6.66016M14.759 2.44141C14.058 4.58874 14.1503 6.91626 15.019 9.0014" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="3.5" cy="7.5625" r="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
      <path d="M15.863 8.992 23.579 22.355M23.175 21.654 4.155 26.07 2.937 23.96 16.273 9.697M8.293 25.11 9.34 26.923A2.843 2.843 0 0 0 14.25 24.058L14.083 23.768M16.387 5.173V2.666M25.992 14.78H28.5M4.277 14.78H6.784M7.824 6.213 9.597 7.986M23.18 7.986 24.952 6.213" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyNewsIcon() {
  return (
    <svg width="116" height="81" viewBox="0 0 116 81" fill="none" aria-hidden="true">
      <path d="M87.4313 36.6079H23.2148V72.7297C23.2148 77.1639 26.8077 80.7567 31.2419 80.7567H79.4043C83.8385 80.7567 87.4313 77.1639 87.4313 72.7297V36.6079Z" fill="#e0b1f1" />
      <rect x="47.8984" y="46.6665" width="14.7373" height="4.91244" rx="2.45622" fill="#a800cb" />
      <path d="M7.75354 17.3131L64.6129 2.07766C68.7256.97565 72.943 3.41628 74.044 7.75365L76.5215 15.5072C77.6235 19.6199 75.1829 23.8373 70.8455 25.3383L13.9862 40.5737C9.87345 41.6757 5.65611 39.2351 4.15511 34.8977L2.07756 27.1442C.97555 23.0314 3.41618 18.8141 7.75354 17.3131Z" fill="#a800cb" />
      <path d="M68.7734 34.9999C68.7734 34.9999 88.4232 29.4736 85.3529 23.3325C83.6882 20.0027 78.9134 20.2331 76.1421 22.7188C72.9487 25.5831 73.0805 33.1571 77.3702 33.1571C87.8092 33.7712 101.991 25.8924 106.231 16.5776" stroke="#e0b1f1" strokeWidth="1.22811" strokeLinecap="round" strokeDasharray="2.46 2.46" />
    </svg>
  );
}

function readClosedPopupVersion() {
  try {
    return window.localStorage.getItem(POPUP_CLOSED_VERSION_KEY);
  } catch {
    return null;
  }
}

function writeClosedPopupVersion(version: string) {
  try {
    window.localStorage.setItem(POPUP_CLOSED_VERSION_KEY, version);
  } catch {
    // The popup still closes for this session when storage is unavailable.
  }
}
