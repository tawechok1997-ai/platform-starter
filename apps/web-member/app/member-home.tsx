'use client';

import { useEffect, useState } from 'react';
import {
  CmsContent,
  MemberFeatureFlags,
  SiteIconSettings,
  defaultFeatureFlags,
  defaultIconSettings,
} from './site-settings';
import WalletCard from './wallet-card';
import {
  AnnouncementList,
  CategoryList,
  CmsPopup,
  FaqList,
  GameRail,
  LobbyTabs,
  HomeHero,
  TournamentSection,
  PendingRequests,
  PromotionSlotGrid,
  QuickActions,
  RecentActivity,
  GameRailSkeleton,
  GameLobbyState,
} from './components/member-home-sections';
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
  const icons = props.icons ?? defaultIconSettings;
  const features = props.features ?? defaultFeatureFlags;
  const [popupClosed, setPopupClosed] = useState(false);
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
    <section className="member-shell member-home-shell">
      <div className="member-home-zone member-home-zone--primary">
        <AnnouncementList content={props.cmsContent} />
        {props.showPromotion && features.games && (
          <HomeHero
            siteName={props.siteName}
            description={props.description}
            primaryColor={props.primaryColor}
            content={props.cmsContent}
          />
        )}
      </div>

      <div className="member-home-zone member-home-zone--finance member-home-finance-lower">
        {props.showBalanceHeader && (
          <WalletCard
            primaryColor={props.primaryColor}
            cardColor={props.cardColor}
            showButtons={props.showButtons && (features.deposit || features.withdraw)}
          />
        )}
        <QuickActions icons={icons} features={features} />
        <PendingRequests
          pendingTopups={data.pendingTopups}
          pendingWithdrawals={data.pendingWithdrawals}
          primaryColor={props.primaryColor}
          features={features}
        />
      </div>

      <div className="member-home-zone">
        {features.games && data.isGamesLoading && <GameRailSkeleton />}
        {features.games && !data.isGamesLoading && data.gamesMessage && <GameLobbyState tone="error" message={data.gamesMessage} onRetry={data.reloadGames} />}
        {features.games && !data.isGamesLoading && !data.gamesMessage && data.featured.length === 0 && data.popular.length === 0 && <GameLobbyState tone="empty" />}
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

      <div className="member-home-zone member-home-zone--content">
        {features.games && <TournamentSection />}
        {props.showPromotion && <PromotionSlotGrid content={props.cmsContent} />}
        <LobbyTabs />
      </div>

      <div className="member-home-zone member-home-zone--support">
        <RecentActivity
          ledgers={data.ledgers}
          loading={data.isActivityLoading}
          message={data.activityMessage}
          onRetry={data.reloadActivity}
          primaryColor={props.primaryColor}
          depositEnabled={features.deposit}
        />
        <FaqList content={props.cmsContent} />
      </div>

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
