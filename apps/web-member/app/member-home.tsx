'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  CmsContent,
  MemberFeatureFlags,
  SiteIconSettings,
  defaultFeatureFlags,
  defaultIconSettings,
} from './site-settings';
import MemberGameSectionRuntimeController from './components/member-game-section-runtime-controller';
import MemberHomeRuntimeController from './components/member-home-runtime-controller';
import { CmsPopup } from './components/member-home-sections';
import { DesktopHomeScaffold } from './components/member-home/desktop-home-scaffold';
import { MobileV47Scaffold } from './components/member-home/mobile-v47-scaffold';
import { openMemberSharedPopup } from './components/member-shared-popup-runtime';
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

export default function MemberHome(props: MemberHomeProps) {
  const features = props.features ?? defaultFeatureFlags;
  const icons = props.icons ?? defaultIconSettings;
  const [popupClosed, setPopupClosed] = useState(false);
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

  const openHomePopup = (kind: HomePopupKind) => () => openMemberSharedPopup(kind);

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

  return (
    <>
      {homeContent}
      <MemberHomeRuntimeController />
      <MemberGameSectionRuntimeController />
      {props.cmsContent.popup.enabled && !popupClosed ? (
        <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />
      ) : null}
    </>
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
