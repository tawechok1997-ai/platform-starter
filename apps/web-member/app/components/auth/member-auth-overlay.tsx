'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';

export type MemberAuthMode = 'login' | 'register';

type MemberAuthOverlayProps = {
  mode: MemberAuthMode;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function MemberAuthOverlay({ mode, onClose, onSuccess }: MemberAuthOverlayProps) {
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    setFrameReady(false);
  }, [mode]);

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
      const type = (event.data as { type?: unknown }).type;
      if (type === 'member-auth-close') onClose();
      if (type === 'member-auth-success') void onSuccess();
      if (type === 'member-auth-ready') setFrameReady(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [onClose, onSuccess]);

  const path = mode === 'register' ? '/register?embed=1' : '/login?embed=1';

  function revealFrameWhenEmbedded(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;
    let attempts = 0;

    const checkEmbeddedMode = () => {
      const embeddedPage = frame.contentDocument?.querySelector('[data-embedded="true"]');
      if (embeddedPage || attempts >= 120) {
        setFrameReady(true);
        return;
      }
      attempts += 1;
      window.requestAnimationFrame(checkEmbeddedMode);
    };

    window.requestAnimationFrame(checkEmbeddedMode);
  }

  return (
    <div
      className="member-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
      aria-busy={!frameReady}
      data-frame-ready={frameReady ? 'true' : 'false'}
    >
      <iframe
        key={path}
        className="member-auth-overlay__frame"
        src={path}
        title={mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        allow="clipboard-write"
        onLoad={revealFrameWhenEmbedded}
        style={{
          opacity: frameReady ? 1 : 0,
          visibility: frameReady ? 'visible' : 'hidden',
          transition: 'opacity 160ms ease',
        }}
      />
    </div>
  );
}
