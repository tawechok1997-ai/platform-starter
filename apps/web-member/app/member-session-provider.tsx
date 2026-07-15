'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearMemberSession, memberApiFetch } from './member-api';

type MemberSessionContextValue = {
  ready: boolean;
  isLoggedIn: boolean;
  verify: () => Promise<boolean>;
  logout: () => void;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);
const SESSION_TIMEOUT_MS = 12000;

export function MemberSessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const verify = useCallback(async () => {
    let ok = false;
    try {
      ok = await verifyMemberSession();
    } catch {
      clearMemberSession();
    } finally {
      setIsLoggedIn(ok);
      setReady(true);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    clearMemberSession();
    setIsLoggedIn(false);
    window.location.href = '/login';
  }, []);

  useEffect(() => { void verify(); }, [verify]);

  const value = useMemo(() => ({ ready, isLoggedIn, verify, logout }), [ready, isLoggedIn, verify, logout]);
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

async function verifyMemberSession() {
  const token = getStoredToken('member_access_token');
  const refreshToken = getStoredToken('member_refresh_token');
  if (!token && !refreshToken) return false;

  const response = await fetchWithTimeout('/member/wallet');
  if (response.ok) return true;
  clearMemberSession();
  return false;
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
