'use client';

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';

export type MemberAuthMode = 'login' | 'register';

type MemberAuthOverlayProps = {
  mode: MemberAuthMode;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const EXIT_DURATION_MS = 220;

export default function MemberAuthOverlay({ mode, onClose, onSuccess }: MemberAuthOverlayProps) {
  const [frameReady, setFrameReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const exitTimerRef = useRef<number | null>(null);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const beginClose = useCallback((afterClose: () => void | Promise<void>) => {
    if (closing) return;
    clearExitTimer();
    setClosing(true);
    setVisible(false);
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      void afterClose();
    }, EXIT_DURATION_MS);
  }, [clearExitTimer, closing]);

  const requestClose = useCallback(() => {
    beginClose(onClose);
  }, [beginClose, onClose]);

  const completeAuth = useCallback(() => {
    beginClose(onSuccess);
  }, [beginClose, onSuccess]);

  useEffect(() => {
    clearExitTimer();
    setFrameReady(false);
    setClosing(false);
    setVisible(false);

    const animationFrame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [clearExitTimer, mode]);

  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
      const type = (event.data as { type?: unknown }).type;
      if (type === 'member-auth-close') requestClose();
      if (type === 'member-auth-success') completeAuth();
      if (type === 'member-auth-ready') setFrameReady(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);
    return () => {
      clearExitTimer();
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, [clearExitTimer, completeAuth, requestClose]);

  const path = mode === 'register' ? '/register?embed=1' : '/login?embed=1';

  function revealFrameWhenEmbedded(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;
    let attempts = 0;

    const checkEmbeddedMode = () => {
      const embeddedPage = frame.contentDocument?.querySelector('[data-embedded="true"]');
      if (embeddedPage || attempts >= 120) {
        window.requestAnimationFrame(() => setFrameReady(true));
        return;
      }
      attempts += 1;
      window.requestAnimationFrame(checkEmbeddedMode);
    };

    window.requestAnimationFrame(checkEmbeddedMode);
  }

  const motionState = closing ? 'closing' : visible ? 'open' : 'opening';

  return (
    <div
      className="member-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
      aria-busy={!frameReady}
      data-state={motionState}
      data-frame-ready={frameReady ? 'true' : 'false'}
    >
      <iframe
        key={path}
        className="member-auth-overlay__frame"
        src={path}
        title={mode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        allow="clipboard-write"
        onLoad={revealFrameWhenEmbedded}
      />
    </div>
  );
}
