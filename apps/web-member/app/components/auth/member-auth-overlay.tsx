'use client';

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { acquireMemberDocumentOverlayLock } from '../../lib/member-document-overlay-lock';

export type MemberAuthMode = 'login' | 'register';

type MemberAuthOverlayProps = {
  mode: MemberAuthMode;
  onModeChange?: (mode: MemberAuthMode) => void;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const EXIT_DURATION_MS = 180;
const REGISTER_LABELS = ['สมัครสมาชิก', 'ลงทะเบียน', 'register', 'sign up'];
const LOGIN_LABELS = ['เข้าสู่ระบบ', 'ล็อกอิน', 'login', 'log in', 'sign in'];

export default function MemberAuthOverlay({ mode, onModeChange, onClose, onSuccess }: MemberAuthOverlayProps) {
  const [activeMode, setActiveMode] = useState<MemberAuthMode>(mode);
  const [frameReady, setFrameReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const authCompletionRef = useRef(false);
  const activeModeRef = useRef<MemberAuthMode>(mode);
  const onModeChangeRef = useRef(onModeChange);

  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  }, [onModeChange]);

  useEffect(() => {
    activeModeRef.current = mode;
    setActiveMode(mode);
  }, [mode]);

  const switchMode = useCallback((nextMode: MemberAuthMode) => {
    activeModeRef.current = nextMode;
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
    const releaseDocumentLock = acquireMemberDocumentOverlayLock();

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
      releaseDocumentLock();
    };
  }, [clearExitTimer, completeAuth, requestClose, switchMode]);

  const path = activeMode === 'register' ? '/register?embed=1' : '/login?embed=1';

  function revealFrameWhenEmbedded(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;
    const embeddedDocument = frame.contentDocument;
    const embeddedElement = embeddedDocument?.defaultView?.Element;

    if (
      embeddedDocument
      && embeddedElement
      && embeddedDocument.documentElement.dataset.memberAuthNavigationBound !== 'true'
    ) {
      embeddedDocument.documentElement.dataset.memberAuthNavigationBound = 'true';
      embeddedDocument.addEventListener('click', (clickEvent) => {
        const target = clickEvent.target;
        if (!(target instanceof embeddedElement)) return;

        const control = target.closest<HTMLElement>([
          'a[href]',
          'button',
          '[role="tab"]',
          '[data-auth-mode]',
          '[data-member-auth-switch]',
        ].join(','));
        if (!control) return;

        const nextMode = embeddedAuthMode(control, activeModeRef.current);
        if (!nextMode || nextMode === activeModeRef.current) return;

        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        clickEvent.stopImmediatePropagation();
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

function embeddedAuthMode(control: HTMLElement, currentMode: MemberAuthMode): MemberAuthMode | null {
  const explicit = [
    control.dataset.authMode,
    control.dataset.memberAuthSwitch,
    control.getAttribute('data-mode'),
    control.getAttribute('data-tab'),
  ].find((value) => value === 'login' || value === 'register');
  if (explicit === 'login' || explicit === 'register') return explicit;

  const href = control.getAttribute('href');
  if (href) {
    try {
      const target = new URL(href, window.location.origin);
      if (target.origin === window.location.origin) {
        const requestedMode = target.searchParams.get('auth');
        if (requestedMode === 'login' || target.pathname === '/login') return 'login';
        if (requestedMode === 'register' || target.pathname === '/register') return 'register';
      }
    } catch {
      // Fall back to the visible switch label below.
    }
  }

  const label = (control.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (!label) return null;

  if (currentMode === 'login' && REGISTER_LABELS.some((candidate) => label.includes(candidate))) {
    return 'register';
  }
  if (currentMode === 'register' && LOGIN_LABELS.some((candidate) => label.includes(candidate))) {
    return 'login';
  }
  return null;
}
