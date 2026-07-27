'use client';

import { usePathname } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';

export default function PublicAuthControls() {
  const pathname = usePathname() ?? '/';
  const { ready, isLoggedIn } = useMemberSession();
  const isPublicSurface = pathname === '/' || pathname.startsWith('/browse');

  if (!isPublicSurface || (ready && isLoggedIn)) return null;

  return (
    <div className="noah-public-auth-controls" aria-label="บัญชีสมาชิก">
      <a className="noah-public-auth-button noah-public-auth-button--login" href="/login">
        เข้าสู่ระบบ
      </a>
      <a className="noah-public-auth-button noah-public-auth-button--register" href="/register">
        สมัครสมาชิก
      </a>
    </div>
  );
}
