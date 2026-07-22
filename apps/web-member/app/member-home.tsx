'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CmsContent,
  MemberFeatureFlags,
  SiteIconSettings,
  defaultFeatureFlags,
  defaultIconSettings,
} from './site-settings';
import {
  AnnouncementList,
  CmsPopup,
  HomeHero,
  PendingRequests,
} from './components/member-home-sections';
import { HomeActivitiesPanel } from './components/member-home/home-activities-panel';
import { HomeHighlightsPanel } from './components/member-home/home-highlights-panel';
import { HomePromotionsPanel } from './components/member-home/home-promotions-panel';
import { GameCategoryNavigation } from './components/member-home/game-category-navigation';
import { SourceHomeTabs, type HomeTab } from './components/member-home/source-home-tabs';
import { createGameCategoryNavigationConfig } from './brand/game-category-navigation';
import { useMemberHomeData } from './hooks/use-member-home-data';
import { useSiteSettings } from './site-settings-provider';

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
  const { settings } = useSiteSettings();
  const categoryConfig = useMemo(
    () => createGameCategoryNavigationConfig(settings),
    [settings],
  );
  const baseIcons = useMemo(
    () => normalizeSiteIcons(settings.icons, props.icons),
    [settings.icons, props.icons],
  );

  useEffect(() => {
    setPopupClosed(readClosedPopupVersion() === popupVersion);
  }, [popupVersion]);

  function closePopup() {
    writeClosedPopupVersion(popupVersion);
    setPopupClosed(true);
  }

  return (
    <section className="member-shell member-home-shell member-source-home">
      <div className="member-home-zone member-home-zone--primary">
        {props.showPromotion && features.games && (
          <HomeHero
            siteName={props.siteName}
            description={props.description}
            primaryColor={props.primaryColor}
            content={props.cmsContent}
          />
        )}
        <AnnouncementList content={props.cmsContent} />
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

      {props.showCategories && features.games && (
        <GameCategoryNavigation
          categories={data.categories}
          config={categoryConfig}
          baseIcons={baseIcons}
        />
      )}

      <HomeHighlightsPanel
        active={activeTab === 'highlights'}
        data={data}
        primaryColor={props.primaryColor}
        showCategories={false}
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

function normalizeSiteIcons(
  runtimeIcons: Record<string, unknown> | undefined,
  explicitIcons: SiteIconSettings | undefined,
): SiteIconSettings {
  const normalizedRuntime = Object.fromEntries(
    Object.entries(runtimeIcons ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1].trim()),
    ),
  );

  return {
    ...defaultIconSettings,
    ...normalizedRuntime,
    ...explicitIcons,
  };
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
