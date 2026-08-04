'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import {
  CmsContent,
  MemberFeatureFlags,
  SiteIconSettings,
  defaultFeatureFlags,
  defaultIconSettings,
} from './site-settings';
import MemberHomeRuntimeController from './components/member-home-runtime-controller';
import { CmsPopup } from './components/member-home-sections';
import { DesktopHomeScaffold } from './components/member-home/desktop-home-scaffold';
import { DesktopGameFeedProvider } from './components/member-home/member-source-feed-sections';
import HomeSidebarScrollController from './components/member-home/home-sidebar-scroll-controller';
import MobileAuthenticatedAvatarRuntime from './components/mobile-home/mobile-authenticated-avatar-runtime';
import MobileAuthenticatedHomeRuntime from './components/mobile-home/mobile-authenticated-home-runtime';
import MobileCanonicalGameLaunchCapture from './components/mobile-home/mobile-canonical-game-launch-capture';
import MobileCouponPopupBridge from './components/mobile-home/mobile-coupon-popup-bridge';
import MobileHomeGuidePreview from './components/mobile-home/mobile-home-guide-preview';
import MobileHomeImageRecoveryRuntime from './components/mobile-home/mobile-home-image-recovery-runtime';
import MobileHomeMotionRuntime from './components/mobile-home/mobile-home-motion-runtime';
import MobileHomeRoot from './components/mobile-home/mobile-home-root';
import MobileMemberMenuSourceBridge from './components/mobile-home/mobile-member-menu-source-bridge';
import MobileP4P6ClosureRuntime from './components/mobile-home/mobile-p4-p6-closure-runtime';
import MobileP6GuestBottomNavigation from './components/mobile-home/mobile-p6-guest-bottom-navigation';
import MobileP7P9ClosureRuntime from './components/mobile-home/mobile-p7-p9-closure-runtime';
import MobileScrollComfortGuard from './components/mobile-home/mobile-scroll-comfort-guard';
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
const NARROW_HOME_QUERY = '(max-width: 900px)';
const MOBILE_INPUT_QUERY = '(hover: none), (pointer: coarse)';

export default function MemberHome(props: MemberHomeProps) {
  // Keep the server and first client render intentionally lightweight. Rendering
  // the complete Mobile tree first on every Desktop visit caused both viewport
  // owners, their observers and their image work to run during hydration.
  const [viewportMode, setViewportMode] = useState<ViewportMode | null>(null);

  useLayoutEffect(() => {
    const narrow = window.matchMedia(NARROW_HOME_QUERY);
    const mobileInput = window.matchMedia(MOBILE_INPUT_QUERY);
    const syncViewport = () => setViewportMode(isMobileHomeViewport(narrow, mobileInput) ? 'mobile' : 'desktop');

    syncViewport();
    narrow.addEventListener?.('change', syncViewport);
    mobileInput.addEventListener?.('change', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    return () => {
      narrow.removeEventListener?.('change', syncViewport);
      mobileInput.removeEventListener?.('change', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
    };
  }, []);

  if (viewportMode === null) {
    return <div className="member-home-viewport-pending" data-member-home-viewport-pending="true" aria-hidden="true" />;
  }

  if (viewportMode === 'mobile') {
    return (
      <>
        <MobileHomeRoot content={props.cmsContent} showPromotion={props.showPromotion} />
        <MobileCanonicalGameLaunchCapture />
        <MobileP4P6ClosureRuntime />
        <MobileP7P9ClosureRuntime phase="p7" route="/" />
        <MobileP6GuestBottomNavigation />
        <MobileAuthenticatedHomeRuntime />
        <MobileCouponPopupBridge />
        <MobileMemberMenuSourceBridge />
        <MobileAuthenticatedAvatarRuntime />
        <MobileHomeGuidePreview />
        <MobileScrollComfortGuard />
        <MobileHomeImageRecoveryRuntime />
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
      <DesktopGameFeedProvider popular={data.popular} online={data.onlineGames}>
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
      </DesktopGameFeedProvider>
      <HomeSidebarScrollController />
      <MemberHomeRuntimeController />
      {props.cmsContent.popup.enabled && !popupClosed ? (
        <CmsPopup content={props.cmsContent} primaryColor={props.primaryColor} onClose={closePopup} />
      ) : null}
    </>
  );
}

function isMobileHomeViewport(narrow: MediaQueryList, mobileInput: MediaQueryList) {
  if (!narrow.matches) return false;
  if (mobileInput.matches) return true;

  // Browser page zoom changes CSS viewport width on desktop and previously
  // caused the Mobile tree to render inside a desktop browser. Physical screen
  // size keeps zoomed desktop sessions on the Desktop owner while real compact
  // devices continue to use the Mobile owner.
  return Math.min(window.screen.width, window.screen.height) <= 900;
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
