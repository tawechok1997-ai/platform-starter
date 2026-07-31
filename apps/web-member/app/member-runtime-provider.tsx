'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import MemberNavigationStateController from './components/member-navigation-state-controller';
import { useMemberLocale } from './member-locale-provider';
import { memberApiFetch } from './member-api';
import { buildMemberHomeDataRuntime, type MemberHomeDataRuntime } from './member-home-data-runtime';
import { buildConfiguredMemberNavigation } from './member-navigation-runtime';
import { useMemberSession } from './member-session-provider';
import { useSiteSettings } from './site-settings-provider';
import { usePendingCount } from './hooks/use-pending-count';
import {
  buildMemberFeatureVisibility,
  buildMemberGameSections,
  buildMemberHomeContentRuntime,
  buildMemberIconRuntime,
  buildMemberSummaryRuntime,
  buildMemberThemeRuntime,
  memberThemeCssVariables,
  resolveMemberAsset,
  type MemberRuntimeProfile,
  type MemberRuntimeSnapshot,
} from './member-runtime-contract';

export type MemberRuntimeContextValue = MemberRuntimeSnapshot & {
  homeData: MemberHomeDataRuntime;
  profile: MemberRuntimeProfile | null;
  profileLoading: boolean;
  reloadProfile: () => Promise<void>;
  resolveAsset: (options: {
    configured?: unknown;
    aliases?: string[];
    localFallback?: string;
    remoteFallback?: string;
  }) => string;
};

const MemberRuntimeContext = createContext<MemberRuntimeContextValue | null>(null);
const PROFILE_TIMEOUT_MS = 12_000;
const PROFILE_FOCUS_COOLDOWN_MS = 30_000;

export function MemberRuntimeProvider({ children }: { children: ReactNode }) {
  const { locale } = useMemberLocale();
  const { typedSettings } = useSiteSettings();
  const { ready, isLoggedIn, wallet } = useMemberSession();
  const { pendingCount } = usePendingCount(isLoggedIn);
  const [profile, setProfile] = useState<MemberRuntimeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const profileRequest = useRef<AbortController | null>(null);
  const lastProfileRefreshAt = useRef(0);

  const content = typedSettings.features.cms_content;
  const features = useMemo(() => buildMemberFeatureVisibility(typedSettings), [typedSettings]);
  const theme = useMemo(() => buildMemberThemeRuntime(typedSettings), [typedSettings]);
  const icons = useMemo(() => buildMemberIconRuntime(typedSettings, content), [content, typedSettings]);
  const navigation = useMemo(
    () => buildConfiguredMemberNavigation(typedSettings, locale, features, icons),
    [features, icons, locale, typedSettings],
  );
  const home = useMemo(
    () => buildMemberHomeContentRuntime(typedSettings, content, locale, icons, features),
    [content, features, icons, locale, typedSettings],
  );
  const homeData = useMemo(
    () => buildMemberHomeDataRuntime(typedSettings, home),
    [home, typedSettings],
  );
  const gameSections = useMemo(
    () => buildMemberGameSections(home, icons, features),
    [features, home, icons],
  );
  const summary = useMemo(
    () => buildMemberSummaryRuntime({ ready, isLoggedIn, profile, wallet, pendingCount }),
    [isLoggedIn, pendingCount, profile, ready, wallet],
  );

  const reloadProfile = useCallback(async () => {
    profileRequest.current?.abort();
    if (!isLoggedIn) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const controller = new AbortController();
    profileRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);
    setProfileLoading(true);

    try {
      const response = await memberApiFetch('/member/auth/profile', {
        signal: controller.signal,
        suppressSessionExpiryRedirect: true,
      });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted || profileRequest.current !== controller) return;
      if (response.ok && payload && typeof payload === 'object') {
        setProfile(normalizeRuntimeProfile(payload));
        lastProfileRefreshAt.current = Date.now();
      }
    } catch {
      // Keep the last profile during transient network failures.
    } finally {
      window.clearTimeout(timeout);
      if (profileRequest.current === controller) {
        profileRequest.current = null;
        setProfileLoading(false);
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!ready) return;
    void reloadProfile();
    return () => profileRequest.current?.abort();
  }, [ready, reloadProfile]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const refreshWhenActive = () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastProfileRefreshAt.current < PROFILE_FOCUS_COOLDOWN_MS) return;
      void reloadProfile();
    };
    window.addEventListener('focus', refreshWhenActive);
    document.addEventListener('visibilitychange', refreshWhenActive);
    return () => {
      window.removeEventListener('focus', refreshWhenActive);
      document.removeEventListener('visibilitychange', refreshWhenActive);
    };
  }, [isLoggedIn, reloadProfile]);

  useEffect(() => {
    const root = document.documentElement;
    const variables = memberThemeCssVariables(theme);
    Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
    root.dataset.memberMotion = theme.motion;
    return () => {
      Object.keys(variables).forEach((name) => root.style.removeProperty(name));
      delete root.dataset.memberMotion;
    };
  }, [theme]);

  const resolveAsset = useCallback(
    (options: Parameters<typeof resolveMemberAsset>[1]) => resolveMemberAsset(content, options),
    [content],
  );

  const value = useMemo<MemberRuntimeContextValue>(() => ({
    icons,
    navigation,
    features,
    theme,
    home,
    homeData,
    gameSections,
    summary,
    profile,
    profileLoading,
    reloadProfile,
    resolveAsset,
  }), [
    features,
    gameSections,
    home,
    homeData,
    icons,
    navigation,
    profile,
    profileLoading,
    reloadProfile,
    resolveAsset,
    summary,
    theme,
  ]);

  return (
    <MemberRuntimeContext.Provider value={value}>
      <MemberNavigationStateController />
      {children}
    </MemberRuntimeContext.Provider>
  );
}

export function useMemberRuntime() {
  const context = useContext(MemberRuntimeContext);
  if (!context) throw new Error('useMemberRuntime must be used inside MemberRuntimeProvider');
  return context;
}

function normalizeRuntimeProfile(payload: unknown): MemberRuntimeProfile {
  const source = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const kyc = source.kyc && typeof source.kyc === 'object' ? source.kyc as Record<string, unknown> : {};
  const vip = source.vip && typeof source.vip === 'object' ? source.vip as Record<string, unknown> : {};
  const id = optionalText(source.id);
  const username = optionalText(source.username);
  const status = optionalText(source.status);

  return {
    ...(id ? { id } : {}),
    ...(username ? { username } : {}),
    displayName: nullableText(source.displayName),
    phone: nullableText(source.phone),
    email: nullableText(source.email),
    ...(status ? { status } : {}),
    phoneVerifiedAt: nullableText(source.phoneVerifiedAt),
    emailVerifiedAt: nullableText(source.emailVerifiedAt),
    kycStatus: nullableText(source.kycStatus ?? kyc.status),
    vipLevel: normalizeScalar(source.vipLevel ?? vip.level ?? vip.name),
  };
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function nullableText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeScalar(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}
