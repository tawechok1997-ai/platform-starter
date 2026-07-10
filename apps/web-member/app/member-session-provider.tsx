'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL, clearMemberSession, refreshMemberToken } from './member-api';

type MemberSessionContextValue = {
  ready: boolean;
  isLoggedIn: boolean;
  verify: () => Promise<boolean>;
  logout: () => void;
};

const MemberSessionContext = createContext<MemberSessionContextValue | null>(null);

export function MemberSessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const verify = useCallback(async () => {
    const ok = await verifyMemberSession();
    setIsLoggedIn(ok);
    setReady(true);
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

async function verifyMemberSession() {
  const token = window.localStorage.getItem('member_access_token');
  const refreshToken = window.localStorage.getItem('member_refresh_token');
  if (!token && !refreshToken) return false;
  if (token) {
    const res = await fetch(`${API_URL}/member/wallet`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return true;
    if (res.status !== 401) return false;
  }
  const refreshed = await refreshMemberToken();
  if (!refreshed) { clearMemberSession(); return false; }
  const retry = await fetch(`${API_URL}/member/wallet`, { headers: { Authorization: `Bearer ${refreshed}` } });
  if (retry.ok) return true;
  clearMemberSession();
  return false;
}
