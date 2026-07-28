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

export default function MemberHome(props: MemberHomeProps) {
  const features = props.features ?? defaultFeatureFlags;
  const icons = props.icons ?? defaultIconSettings;
  const [popupClosed, setPopupClosed] = useState(false);
  const [promotionOpen, setPromotionOpen] = useState(false);
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

  const openPromotion = () => setPromotionOpen(true);

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
        onOpenPromotion={openPromotion}
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
        onOpenPromotion={openPromotion}
      />
    );
  }

  return (
    <>
      {homeContent}
      {promotionOpen && <SourcePromotionPopup onClose={() => setPromotionOpen(false)} />}
      {props.cmsContent.popup.enabled && !popupClosed && !promotionOpen && (
        <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />
      )}
    </>
  );
}

function SourcePromotionPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="home-promotion-popup" data-state="open" role="dialog" aria-modal="true" aria-labelledby="home-promotion-popup-title">
      <button type="button" className="home-promotion-popup__backdrop" aria-label="ปิดหน้าต่างโปรโมชั่น" onClick={onClose} />

      <section className="home-promotion-popup__panel">
        <div className="home-promotion-popup__shine" aria-hidden="true" />
        <header className="home-promotion-popup__header">
          <div className="home-promotion-popup__title">
            <span className="home-promotion-popup__gift" aria-hidden="true">
              <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
                <path d="M26.4936 25.969V14.2852H5.39062V25.969C5.39062 27.0736 6.28606 27.969 7.39062 27.969H24.4936C25.5982 27.969 26.4936 27.0736 26.4936 25.969Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.9375 27.9688V14.2812M28.2157 11.082V12.2837C28.2157 13.3882 27.3203 14.2837 26.2157 14.2837H5.66406C4.5595 14.2837 3.66406 13.3882 3.66406 12.2837V11.082C3.66406 9.97747 4.5595 9.08203 5.66406 9.08203H26.2157C27.3203 9.08203 28.2157 9.97747 28.2157 11.082Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.9393 9.08334C15.9393 7.33334 13.8977 3.25 10.8352 3.25C5.85297 3.25 7.66787 9.08334 10.0525 9.08334M15.9375 9.08334C15.9375 7.33334 17.9792 3.25 21.0417 3.25C26.0239 3.25 24.2089 9.08334 21.8244 9.08334" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 id="home-promotion-popup-title">โปรโมชั่น</h2>
          </div>
          <button type="button" className="home-promotion-popup__close" onClick={onClose} aria-label="ปิดโปรโมชั่น">×</button>
        </header>

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
      </section>
    </div>
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
