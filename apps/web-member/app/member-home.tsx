'use client';

import { useEffect, useState } from 'react';
import {
  CmsContent,
  MemberFeatureFlags,
  SiteIconSettings,
  defaultFeatureFlags,
} from './site-settings';
import {
  CmsPopup,
  PendingRequests,
} from './components/member-home-sections';
import { HomeActivitiesPanel } from './components/member-home/home-activities-panel';
import { HomeAnnouncementStrip } from './components/member-home/home-announcement-strip';
import { HomeHighlightsPanel } from './components/member-home/home-highlights-panel';
import { HomePromotionsPanel } from './components/member-home/home-promotions-panel';
import { HomePromotionCarousel } from './components/member-home/home-promotion-carousel';
import styles from './components/member-home/home-reference.module.css';
import { SourceHomeTabs, type HomeTab } from './components/member-home/source-home-tabs';
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
  showCategories: boolean;
  showProviders: boolean;
  showRecommended: boolean;
  cmsContent: CmsContent;
  icons?: SiteIconSettings;
  features?: MemberFeatureFlags;
};

const POPUP_CLOSED_VERSION_KEY = 'member_cms_popup_closed_version';

export default function MemberHome(props: MemberHomeProps) {
  const features = props.features ?? defaultFeatureFlags;
  const [popupClosed, setPopupClosed] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>('highlights');
  const popupVersion = props.cmsContent.popup.version ?? 'v1';
  const data = useMemberHomeData(features.games);

  useEffect(() => {
    setPopupClosed(readClosedPopupVersion() === popupVersion);
  }, [popupVersion]);

  function closePopup() {
    writeClosedPopupVersion(popupVersion);
    setPopupClosed(true);
  }

  return (
    <section className={`member-shell member-home-shell member-source-home ${styles.referenceHome}`}>
      <div className="member-home-zone member-home-zone--primary">
        {props.showPromotion && features.games && (
          <HomePromotionCarousel content={props.cmsContent} siteName={props.siteName} />
        )}
        <HomeAnnouncementStrip content={props.cmsContent} />
        <SourceHomeTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="member-source-finance">
        <PendingRequests
          pendingTopups={data.pendingTopups}
          pendingWithdrawals={data.pendingWithdrawals}
          primaryColor={props.primaryColor}
          features={features}
        />
      </div>

      <HomeHighlightsPanel
        active={activeTab === 'highlights'}
        data={data}
        primaryColor={props.primaryColor}
        showCategories={props.showCategories}
        showRecommended={props.showRecommended}
        gamesEnabled={features.games}
      />

      <HomePromotionsPanel
        active={activeTab === 'promotions'}
        enabled={props.showPromotion}
        content={props.cmsContent}
      />

      <HomeActivitiesPanel
        active={activeTab === 'activities'}
        data={data}
        content={props.cmsContent}
        primaryColor={props.primaryColor}
        depositEnabled={features.deposit}
        supportEnabled={features.support}
      />

      {props.cmsContent.popup.enabled && !popupClosed && (
        <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />
      )}
    </section>
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
