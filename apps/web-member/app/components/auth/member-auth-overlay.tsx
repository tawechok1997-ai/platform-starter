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
const AUTH_OVERLAY_MOTION_CSS = `
@keyframes memberAuthBackdropEnter {
  from { opacity: 0; }
  to { opacity: 1; }
}

html body .member-auth-overlay,
html body .member-auth-overlay[data-state='open'],
html body .member-auth-overlay[data-state='closing'] {
  background-color: transparent !important;
  background-image: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

html body .member-auth-overlay__backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  background: rgb(0 0 0 / 80%);
  opacity: 0;
  pointer-events: none;
  will-change: opacity;
}

html body .member-auth-overlay[data-state='open'] .member-auth-overlay__backdrop {
  animation: memberAuthBackdropEnter 260ms cubic-bezier(.22, 1, .36, 1) both;
}

html body .member-auth-overlay[data-state='closing'] .member-auth-overlay__backdrop {
  animation: none;
  opacity: 0;
  transition: opacity 160ms ease-out;
}

html body .member-auth-overlay__frame {
  z-index: 1 !important;
}

@media (max-width: 900px) {
  html body .member-auth-overlay__backdrop {
    background: rgb(0 0 0 / 72%);
  }
}

@media (prefers-reduced-motion: reduce) {
  html body .member-auth-overlay[data-state='open'] .member-auth-overlay__backdrop {
    animation-duration: 1ms;
  }

  html body .member-auth-overlay[data-state='closing'] .member-auth-overlay__backdrop {
    transition-duration: 1ms;
  }
}
`;

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

    let secondAnimationFrame = 0;
    const firstAnimationFrame = window.requestAnimationFrame(() => {
      secondAnimationFrame = window.requestAnimationFrame(() => {
        setVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstAnimationFrame);
      if (secondAnimationFrame) window.cancelAnimationFrame(secondAnimationFrame);
    };
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
      <style>{AUTH_OVERLAY_MOTION_CSS}</style>
      <span className="member-auth-overlay__backdrop" aria-hidden="true" />
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
