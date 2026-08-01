'use client';

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';

export type MemberAuthMode = 'login' | 'register';

type MemberAuthOverlayProps = {
  mode: MemberAuthMode;
  onModeChange?: (mode: MemberAuthMode) => void;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const EXIT_DURATION_MS = 180;

export default function MemberAuthOverlay({ mode, onModeChange, onClose, onSuccess }: MemberAuthOverlayProps) {
  const [activeMode, setActiveMode] = useState<MemberAuthMode>(mode);
  const [frameReady, setFrameReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const authCompletionRef = useRef(false);
  const onModeChangeRef = useRef(onModeChange);

  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  }, [onModeChange]);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  const switchMode = useCallback((nextMode: MemberAuthMode) => {
    setActiveMode(nextMode);
    onModeChangeRef.current?.(nextMode);
  }, []);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const beginClose = useCallback((afterClose: () => void | Promise<void>) => {
    if (closingRef.current) return;
    closingRef.current = true;
    clearExitTimer();
    setClosing(true);
    setVisible(false);
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      void afterClose();
    }, EXIT_DURATION_MS);
  }, [clearExitTimer]);

  const requestClose = useCallback(() => {
    beginClose(onClose);
  }, [beginClose, onClose]);

  const completeAuth = useCallback(async () => {
    if (closingRef.current || authCompletionRef.current) return;
    authCompletionRef.current = true;
    try {
      await onSuccess();
    } finally {
      authCompletionRef.current = false;
    }
  }, [onSuccess]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    clearExitTimer();
    closingRef.current = false;
    authCompletionRef.current = false;
    setClosing(false);
    setVisible(false);

    const animationFrame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [clearExitTimer]);

  useEffect(() => {
    setFrameReady(false);
  }, [activeMode]);

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
    const computedBodyPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    const previousBodyStyles = {
      overflow: body.style.overflow,
      overscrollBehavior: body.style.overscrollBehavior,
      paddingRight: body.style.paddingRight,
    };
    const previousHtmlStyles = {
      overflow: html.style.overflow,
      overscrollBehavior: html.style.overscrollBehavior,
    };

    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    if (scrollbarWidth > 0) body.style.paddingRight = `${computedBodyPaddingRight + scrollbarWidth}px`;
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
      const payload = event.data as { type?: unknown; mode?: unknown };
      if (payload.type === 'member-auth-close') requestClose();
      if (payload.type === 'member-auth-success') void completeAuth();
      if (payload.type === 'member-auth-ready') setFrameReady(true);
      if (payload.type === 'member-auth-switch' && (payload.mode === 'login' || payload.mode === 'register')) {
        switchMode(payload.mode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);
    return () => {
      clearExitTimer();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);

      body.style.overflow = previousBodyStyles.overflow;
      body.style.overscrollBehavior = previousBodyStyles.overscrollBehavior;
      body.style.paddingRight = previousBodyStyles.paddingRight;
      html.style.overflow = previousHtmlStyles.overflow;
      html.style.overscrollBehavior = previousHtmlStyles.overscrollBehavior;
    };
  }, [clearExitTimer, completeAuth, requestClose, switchMode]);

  const path = activeMode === 'register' ? '/register?embed=1' : '/login?embed=1';

  function revealFrameWhenEmbedded(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;
    const embeddedDocument = frame.contentDocument;

    if (embeddedDocument && embeddedDocument.documentElement.dataset.memberAuthNavigationBound !== 'true') {
      embeddedDocument.documentElement.dataset.memberAuthNavigationBound = 'true';
      embeddedDocument.addEventListener('click', (clickEvent) => {
        if (!(clickEvent.target instanceof Element)) return;
        const link = clickEvent.target.closest<HTMLAnchorElement>('a[href]');
        if (!link) return;

        let target: URL;
        try {
          target = new URL(link.getAttribute('href') ?? '', window.location.origin);
        } catch {
          return;
        }

        if (target.origin !== window.location.origin) return;
        const nextMode = target.pathname === '/register'
          ? 'register'
          : target.pathname === '/login'
            ? 'login'
            : null;
        if (!nextMode) return;

        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        switchMode(nextMode);
      }, true);
    }

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
  const overlay = (
    <div
      className="member-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={activeMode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
      aria-busy={!frameReady}
      data-state={motionState}
      data-frame-ready={frameReady ? 'true' : 'false'}
    >
      <iframe
        className="member-auth-overlay__frame"
        src={path}
        title={activeMode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        allow="clipboard-write"
        onLoad={revealFrameWhenEmbedded}
      />
    </div>
  );

  return portalTarget ? createPortal(overlay, portalTarget) : null;
}
