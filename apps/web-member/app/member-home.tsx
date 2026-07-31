'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
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
import MobileHomeMotionRuntime from './components/mobile-home/mobile-home-motion-runtime';
import MobileHomeRoot from './components/mobile-home/mobile-home-root';
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
  const [viewportMode, setViewportMode] = useState<ViewportMode | null>(null);

  useLayoutEffect(() => {
    const media = window.matchMedia(MOBILE_HOME_QUERY);
    const syncViewport = () => setViewportMode(media.matches ? 'mobile' : 'desktop');

    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  if (viewportMode === null) return null;
  if (viewportMode === 'mobile') {
    return (
      <>
        <MobileHomeRoot content={props.cmsContent} showPromotion={props.showPromotion} />
        <MobileHomeMotionRuntime contentVersion={mobileHomeMotionVersion(props.cmsContent)} />
      </>
    );
  }

  return <DesktopMemberHome {...props} />;
}

function DesktopMemberHome(props: MemberHomeProps) {
  const features = props.features ?? defaultFeatureFlags;
  const icons = props.icons ?? defaultIconSettings;
  const [popupClosed, setPopupClosed] = useState(false);
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

  function closePopup() {
    writeClosedPopupVersion(popupVersion);
    setPopupClosed(true);
  }

  const openHomePopup = (kind: HomePopupKind) => () => openMemberSharedPopup(kind);

  return (
    <>
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
      <MemberHomeRuntimeController />
      <MemberGameSectionRuntimeController />
      {props.cmsContent.popup.enabled && !popupClosed ? (
        <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />
      ) : null}
    </>
  );
}

function mobileHomeMotionVersion(content: CmsContent) {
  const banners = content.banners.map((banner) => [
    banner.id ?? '',
    banner.enabled ? '1' : '0',
    banner.lifecycle ?? '',
    banner.mobileAssetId ?? '',
    banner.mobileImageUrl ?? '',
    banner.desktopAssetId ?? '',
    banner.desktopImageUrl ?? '',
    banner.assetId ?? '',
    banner.imageUrl ?? '',
  ].join(':'));

  const announcements = content.announcements.map((announcement) => [
    announcement.id ?? '',
    announcement.enabled ? '1' : '0',
    announcement.lifecycle ?? '',
    announcement.title,
    announcement.message,
  ].join(':'));

  return [...banners, ...announcements].join('|');
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
