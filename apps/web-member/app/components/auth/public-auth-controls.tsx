'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';
import MemberAuthOverlay, { type MemberAuthMode } from './member-auth-overlay';

export default function PublicAuthControls() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { ready, isLoggedIn, verify } = useMemberSession();
  const [mode, setMode] = useState<MemberAuthMode | null>(null);
  const isPublicSurface = pathname === '/' || pathname.startsWith('/browse');

  const close = useCallback(() => setMode(null), []);

  const complete = useCallback(async () => {
    const authenticated = await verify();
    if (!authenticated) return;
    setMode(null);
    router.refresh();
  }, [router, verify]);

  if (!isPublicSurface || (ready && isLoggedIn)) return null;

  return (
    <>
      <div className="noah-public-auth-controls" aria-label="บัญชีสมาชิก">
        <button
          type="button"
          className="noah-public-auth-button noah-public-auth-button--login"
          onClick={() => setMode('login')}
        >
          เข้าสู่ระบบ
        </button>
        <button
          type="button"
          className="noah-public-auth-button noah-public-auth-button--register"
          onClick={() => setMode('register')}
        >
          สมัครสมาชิก
        </button>
      </div>
      {mode ? (
        <MemberAuthOverlay
          mode={mode}
          onModeChange={setMode}
          onClose={close}
          onSuccess={complete}
        />
      ) : null}
    </>
  );
}
