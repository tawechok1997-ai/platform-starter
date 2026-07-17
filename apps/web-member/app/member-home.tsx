'use client';

import { useEffect, useState } from 'react';
import {
  CmsContent,
  MemberFeatureFlags,
  SiteIconSettings,
  defaultFeatureFlags,
} from './site-settings';
import {
  AnnouncementList,
  CategoryList,
  CmsPopup,
  FaqList,
  GameRail,
  HomeHero,
  TournamentSection,
  PendingRequests,
  PromotionSlotGrid,
  RecentActivity,
  GameRailSkeleton,
  GameLobbyState,
  SupportCard,
} from './components/member-home-sections';
import { MemberIcon } from './components/member-icon';
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

type HomeTab = 'highlights' | 'promotions' | 'activities';

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

      <section
        className="member-source-panel member-source-panel--highlights"
        hidden={activeTab !== 'highlights'}
        aria-label="ไฮไลท์"
      >
        {features.games && <TournamentSection />}

        <div className="member-source-games">
          {features.games && data.isGamesLoading && <GameRailSkeleton />}
          {features.games && !data.isGamesLoading && data.gamesMessage && (
            <GameLobbyState tone="error" message={data.gamesMessage} onRetry={data.reloadGames} />
          )}
          {features.games && !data.isGamesLoading && !data.gamesMessage && data.featured.length === 0 && data.popular.length === 0 && (
            <GameLobbyState tone="empty" />
          )}
          {features.games && data.recentGames.length > 0 && (
            <GameRail title="เล่นล่าสุด" href="/games" items={data.recentGames} primaryColor={props.primaryColor} />
          )}
          {features.games && props.showCategories && (
            <CategoryList categories={data.categories} primaryColor={props.primaryColor} />
          )}
          {features.games && props.showRecommended && (
            <GameRail title="เกมแนะนำ" href="/games" items={data.featured} primaryColor={props.primaryColor} />
          )}
          {features.games && data.favoriteGames.length > 0 && (
            <GameRail title="เกมโปรด" href="/games" items={data.favoriteGames} primaryColor={props.primaryColor} />
          )}
          {features.games && data.popular.length > 0 && (
            <GameRail title="ยอดนิยม" href="/games" items={data.popular} primaryColor={props.primaryColor} />
          )}
        </div>
      </section>

      <section
        className="member-source-panel member-source-panel--promotions"
        hidden={activeTab !== 'promotions'}
        aria-label="โปรโมชั่นแนะนำ"
      >
        {props.showPromotion ? (
          <PromotionSlotGrid content={props.cmsContent} />
        ) : (
          <div className="member-source-state">โปรโมชั่นถูกปิดใช้งานชั่วคราว</div>
        )}
      </section>

      <section
        className="member-source-panel member-source-panel--activities"
        hidden={activeTab !== 'activities'}
        aria-label="กิจกรรม"
      >
        <RecentActivity
          ledgers={data.ledgers}
          loading={data.isActivityLoading}
          message={data.activityMessage}
          onRetry={data.reloadActivity}
          primaryColor={props.primaryColor}
          depositEnabled={features.deposit}
        />
        <FaqList content={props.cmsContent} />
        {features.support && <SupportCard />}
      </section>

      {props.cmsContent.popup.enabled && !popupClosed && (
        <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />
      )}
    </section>
  );
}

function SourceHomeTabs({ activeTab, onChange }: { activeTab: HomeTab; onChange: (tab: HomeTab) => void }) {
  const tabs: Array<{ key: HomeTab; label: string; icon: 'games' | 'promotion' | 'bonus' }> = [
    { key: 'highlights', label: 'ไฮไลท์', icon: 'games' },
    { key: 'promotions', label: 'โปรโมชั่นแนะนำ', icon: 'promotion' },
    { key: 'activities', label: 'กิจกรรม', icon: 'bonus' },
  ];

  return (
    <nav className="member-source-tabs" aria-label="เมนูหน้า Home">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`member-source-tab${activeTab === tab.key ? ' is-active' : ''}`}
          onClick={() => onChange(tab.key)}
          aria-pressed={activeTab === tab.key}
        >
          <MemberIcon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
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
