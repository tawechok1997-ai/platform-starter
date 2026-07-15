'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

export function MemberSessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wallet, setWallet] = useState<MemberWalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);

  const verify = useCallback(async () => {
    let ok = false;
    const hadSession = hasMemberSessionTokens();
    setWalletLoading(true);
    try {
      const result = await fetchMemberWallet();
      ok = result.authenticated;
      setWallet(result.wallet);
    } catch {
      // Network and server failures do not prove that the session expired.
      ok = hadSession;
    } finally {
      setIsLoggedIn(ok);
      setReady(true);
      setWalletLoading(false);
    }
    return ok;
  }, []);

  const refreshWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const result = await fetchMemberWallet();
      if (!result.authenticated) {
        setIsLoggedIn(false);
        setWallet(null);
      } else if (result.wallet) {
        setWallet(result.wallet);
      }
    } catch {
      // Keep the last known balance during transient network failures.
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearMemberSession();
    setIsLoggedIn(false);
    setWallet(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const refresh = () => {
      void refreshWallet();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener(MEMBER_WALLET_REFRESH_EVENT, refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener(MEMBER_WALLET_REFRESH_EVENT, refresh);
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

function getStoredToken(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function fetchMemberWallet() {
  const token = getStoredToken('member_access_token');
  const refreshToken = getStoredToken('member_refresh_token');
  if (!token && !refreshToken) return { authenticated: false, wallet: null };

  const response = await fetchWithTimeout('/member/wallet');
  if (response.ok) {
    const payload = await response.json().catch(() => null);
    return { authenticated: true, wallet: normalizeMemberWallet(payload) };
  }
  return { authenticated: response.status !== 401, wallet: null };
}

async function fetchWithTimeout(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
  try {
    return await memberApiFetch(path, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}
