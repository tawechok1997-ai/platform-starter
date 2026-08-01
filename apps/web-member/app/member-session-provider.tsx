'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  MEMBER_WALLET_REFRESH_EVENT,
  normalizeMemberWallet,
  type MemberWalletSummary,
} from '../src/features/wallet/member-wallet';
import { clearMemberSession, hasMemberSessionTokens, memberApiFetch } from './member-api';

type MemberSessionContextValue = {
  ready: boolean;
  isLoggedIn: boolean;
  wallet: MemberWalletSummary | null;
  walletLoading: boolean;
  refreshWallet: () => Promise<void>;
  verify: () => Promise<boolean>;
  logout: () => void;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);
const SESSION_TIMEOUT_MS = 12000;
const FOCUS_REFRESH_COOLDOWN_MS = 15000;

export function MemberSessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wallet, setWallet] = useState<MemberWalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const lastWalletRefreshAtRef = useRef(0);
  const walletRefreshInFlightRef = useRef(false);

  const verify = useCallback(async () => {
    const hadSession = hasMemberSessionTokens();
    if (!hadSession) {
      setIsLoggedIn(false);
      setWallet(null);
      setWalletLoading(false);
      setReady(true);
      return false;
    }

    // A stored session can reveal the stable authenticated shell immediately.
    // The wallet request continues in the background and remains the authority
    // for detecting an expired token without flashing the guest page first.
    setIsLoggedIn(true);
    setReady(true);
    setWalletLoading(true);
    walletRefreshInFlightRef.current = true;

    let ok = true;
    try {
      const result = await fetchMemberWallet(true);
      ok = result.authenticated;
      setWallet(result.wallet);
      lastWalletRefreshAtRef.current = Date.now();
    } catch {
      // Network and server failures do not prove that the session expired.
      ok = true;
    } finally {
      walletRefreshInFlightRef.current = false;
      setIsLoggedIn(ok);
      setWalletLoading(false);
    }
    return ok;
  }, []);

  const refreshWallet = useCallback(async () => {
    if (document.visibilityState === 'hidden' || walletRefreshInFlightRef.current) return;

    walletRefreshInFlightRef.current = true;
    try {
      const result = await fetchMemberWallet(false);
      if (!result.authenticated) {
        setIsLoggedIn(false);
        setWallet(null);
      } else if (result.wallet) {
        setWallet((currentWallet) => (
          JSON.stringify(currentWallet) === JSON.stringify(result.wallet) ? currentWallet : result.wallet
        ));
      }
      lastWalletRefreshAtRef.current = Date.now();
    } catch {
      // Keep the last known balance during transient network failures.
    } finally {
      walletRefreshInFlightRef.current = false;
    }
  }, []);

  const logout = useCallback(() => {
    clearMemberSession();
    setIsLoggedIn(false);
    setWallet(null);
    window.location.replace('/');
  }, []);

  useLayoutEffect(() => {
    const navigationEntry = window.performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const legacyNavigationType = (
      window.performance as Performance & { navigation?: { type?: number } }
    ).navigation?.type;
    const isReload = navigationEntry?.type === 'reload' || legacyNavigationType === 1;
    if (!isReload) return;

    const previousScrollRestoration = window.history.scrollRestoration;
    let animationFrame = 0;
    let resetTimer = 0;

    const resetScroll = () => {
      document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    const finishReset = () => {
      resetScroll();
      animationFrame = window.requestAnimationFrame(() => {
        resetScroll();
        resetTimer = window.setTimeout(() => {
          resetScroll();
          window.history.scrollRestoration = previousScrollRestoration;
        }, 0);
      });
    };

    window.history.scrollRestoration = 'manual';
    resetScroll();

    if (document.readyState === 'complete') finishReset();
    else window.addEventListener('load', finishReset, { once: true });

    return () => {
      window.removeEventListener('load', finishReset);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(resetTimer);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const refreshAfterFocus = () => {
      if (Date.now() - lastWalletRefreshAtRef.current < FOCUS_REFRESH_COOLDOWN_MS) return;
      void refreshWallet();
    };
    const refreshFromWalletEvent = () => {
      void refreshWallet();
    };

    window.addEventListener('focus', refreshAfterFocus);
    window.addEventListener(MEMBER_WALLET_REFRESH_EVENT, refreshFromWalletEvent);
    return () => {
      window.removeEventListener('focus', refreshAfterFocus);
      window.removeEventListener(MEMBER_WALLET_REFRESH_EVENT, refreshFromWalletEvent);
    };
  }, [isLoggedIn, refreshWallet]);

  const value = useMemo(
    () => ({ ready, isLoggedIn, wallet, walletLoading, refreshWallet, verify, logout }),
    [ready, isLoggedIn, wallet, walletLoading, refreshWallet, verify, logout],
  );
  return <MemberSessionContext.Provider value={value}>{children}</MemberSessionContext.Provider>;
}

export function useMemberSession() {
  const value = useContext(MemberSessionContext);
  if (!value) throw new Error('useMemberSession must be used inside MemberSessionProvider');
  return value;
}

async function fetchMemberWallet(suppressSessionExpiryRedirect: boolean) {
  if (!hasMemberSessionTokens()) return { authenticated: false, wallet: null };

  const response = await fetchWithTimeout('/member/wallet', suppressSessionExpiryRedirect);
  if (response.ok) {
    const payload = await response.json().catch(() => null);
    return { authenticated: true, wallet: normalizeMemberWallet(payload) };
  }
  return { authenticated: response.status !== 401, wallet: null };
}

async function fetchWithTimeout(path: string, suppressSessionExpiryRedirect: boolean) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
  try {
    return await memberApiFetch(path, { signal: controller.signal, suppressSessionExpiryRedirect });
  } finally {
    window.clearTimeout(timeout);
  }
}
