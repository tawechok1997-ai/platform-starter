'use client';

import { useEffect } from 'react';

export type MemberAuthMode = 'login' | 'register';

type MemberAuthOverlayProps = {
  mode: MemberAuthMode;
  onModeChange: (mode: MemberAuthMode) => void;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function MemberAuthOverlay({ mode, onModeChange, onClose, onSuccess }: MemberAuthOverlayProps) {
  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
      const data = event.data as { type?: unknown; mode?: unknown };
      if (data.type === 'member-auth-close') onClose();
      if (data.type === 'member-auth-success') void onSuccess();
      if (data.type === 'member-auth-mode' && (data.mode === 'login' || data.mode === 'register')) {
        onModeChange(data.mode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [onClose, onModeChange, onSuccess]);

  const path = mode === 'register' ? '/register?embed=1' : '/login?embed=1';

  return (
    <div className="member-auth-overlay" role="dialog" aria-modal="true" aria-label={mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}>
      <iframe
        className="member-auth-overlay__frame"
        src={path}
        title={mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        allow="clipboard-write"
      />
    </div>
  );
}
