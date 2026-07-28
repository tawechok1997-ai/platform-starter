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
const PROMOTION_TRIGGER_SELECTOR = 'a.reference-promo-card--1, .v47-mobile-quick-grid > a:first-child';
const PROMOTION_CATEGORIES = ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย'] as const;
const SOURCE_PROMOTIONS = [
  {
    id: 'source-turnover-reward',
    title: 'ทำยอดเทิร์นรับรางวัลจุใจ🎉',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa.jpg',
    href: '/browse/promotions',
  },
  {
    id: 'source-referral-reward',
    title: 'ชวนเพื่อนปั๊ป รับฟรี 300 บาททันที!! 💜',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1784628973087-c16b022a-8361-4272-8673-819c587c10fd.jpg',
    href: '/browse/promotions',
  },
  {
    id: 'source-repeat-deposit',
    title: 'ฝากซ้ำ ย้ำโบนัส รับทันที 100 บาท✨',
    imageUrl: 'https://cdn.zabbet.com/FEZX/promotions/1782441824805-ed970564-a17a-4a6f-a163-5658651f406c.jpg',
    href: '/browse/promotions',
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

  useEffect(() => {
    const handlePromotionClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest(PROMOTION_TRIGGER_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      setPromotionOpen(true);
    };

    window.addEventListener('click', handlePromotionClick, true);
    return () => window.removeEventListener('click', handlePromotionClick, true);
  }, []);

  function closePopup() {
    writeClosedPopupVersion(popupVersion);
    setPopupClosed(true);
  }

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
    <div className="home-promotion-popup" data-state="open" role="dialog" aria-modal="true" aria-label="โปรโมชั่น">
      <button
        type="button"
        className="home-promotion-popup__backdrop"
        aria-label="ปิดหน้าต่างโปรโมชั่น"
        tabIndex={-1}
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          border: 0,
          background: 'transparent',
          cursor: 'default',
        }}
      />

      <section className="home-promotion-popup__panel" style={{ position: 'relative', zIndex: 1 }}>
        <div className="home-promotion-popup__shine" aria-hidden="true" />
        <header className="home-promotion-popup__header">
          <div className="home-promotion-popup__title">
            <span className="home-promotion-popup__gift" aria-hidden="true">🎁</span>
            <h2>โปรโมชั่น</h2>
          </div>
          <button type="button" className="home-promotion-popup__close" onClick={onClose} aria-label="ปิดโปรโมชั่น">×</button>
        </header>

        <div className="home-promotion-popup__content">
          <div className="home-promotion-popup__tabs" aria-label="หมวดโปรโมชั่น">
            {PROMOTION_CATEGORIES.map((label, index) => (
              <button key={label} type="button" className={index === 0 ? 'is-active' : ''} tabIndex={-1}>{label}</button>
            ))}
          </div>

          <div className="home-promotion-popup__scroll">
            <div className="home-promotion-popup__grid">
              {SOURCE_PROMOTIONS.map((promotion) => (
                <a key={promotion.id} className="home-promotion-popup__card" href={promotion.href}>
                  <div className="home-promotion-popup__media">
                    <img src={promotion.imageUrl} alt={promotion.title} loading="lazy" />
                  </div>
                  <strong>{promotion.title}</strong>
                </a>
              ))}
            </div>
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
