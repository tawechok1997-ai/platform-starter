'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { acquireMemberDocumentOverlayLock } from '../../lib/member-document-overlay-lock';
import type { MemberAuthMode, MemberAuthRequestId } from '../../lib/member-auth-events';

export type { MemberAuthMode } from '../../lib/member-auth-events';

type MemberAuthOverlayProps = {
  mode: MemberAuthMode;
  requestId?: MemberAuthRequestId;
  onModeChange?: (mode: MemberAuthMode) => void;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

type ReadyByMode = Record<MemberAuthMode, boolean>;
type FrameByMode = Record<MemberAuthMode, HTMLIFrameElement | null>;
type AbortByMode = Record<MemberAuthMode, AbortController | null>;
type RafByMode = Record<MemberAuthMode, number | null>;

const REGISTER_LABELS = ['สมัครสมาชิก', 'ลงทะเบียน', 'register', 'sign up'];
const LOGIN_LABELS = ['เข้าสู่ระบบ', 'ล็อกอิน', 'login', 'log in', 'sign in'];
const AUTH_MODES: readonly MemberAuthMode[] = ['register', 'login'];

export default function MemberAuthOverlay({
  mode,
  requestId = 'legacy',
  onModeChange,
  onClose,
  onSuccess,
}: MemberAuthOverlayProps) {
  const [activeMode, setActiveMode] = useState<MemberAuthMode>(mode);
  const [readyByMode, setReadyByMode] = useState<ReadyByMode>({ login: false, register: false });
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const closingRef = useRef(false);
  const authCompletionRef = useRef(false);
  const activeModeRef = useRef<MemberAuthMode>(mode);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const frameRefs = useRef<FrameByMode>({ login: null, register: null });
  const releaseDocumentLockRef = useRef<(() => void) | null>(null);
  const onModeChangeRef = useRef(onModeChange);
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const navigationAbortRefs = useRef<AbortByMode>({ login: null, register: null });
  const framePollRefs = useRef<RafByMode>({ login: null, register: null });
  const revealFrameRef = useRef<number | null>(null);

  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  }, [onModeChange]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    activeModeRef.current = mode;
    setActiveMode(mode);
  }, [mode, requestId]);

  const switchMode = useCallback((nextMode: MemberAuthMode) => {
    if (closingRef.current || nextMode === activeModeRef.current) return;
    activeModeRef.current = nextMode;
    setActiveMode(nextMode);
    onModeChangeRef.current?.(nextMode);
  }, []);

  const cancelFrameWork = useCallback(() => {
    for (const authMode of AUTH_MODES) {
      navigationAbortRefs.current[authMode]?.abort();
      navigationAbortRefs.current[authMode] = null;
      const poll = framePollRefs.current[authMode];
      if (poll !== null) {
        window.cancelAnimationFrame(poll);
        framePollRefs.current[authMode] = null;
      }
    }

    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current);
      revealFrameRef.current = null;
    }
  }, []);

  const releaseDocumentLockNow = useCallback(() => {
    const release = releaseDocumentLockRef.current;
    releaseDocumentLockRef.current = null;
    release?.();
  }, []);

  const restorePreviousFocus = useCallback(() => {
    const previous = previousFocusRef.current;
    previousFocusRef.current = null;
    if (!previous?.isConnected) return;
    window.requestAnimationFrame(() => previous.focus({ preventScroll: true }));
  }, []);

  const removeOverlayOwnership = useCallback(() => {
    document.documentElement.removeAttribute('data-member-overlay-open');
    document.querySelectorAll<HTMLElement>('[data-member-active-overlay="true"]')
      .forEach((element) => element.removeAttribute('data-member-active-overlay'));
  }, []);

  const hideFrameNow = useCallback((frame: HTMLIFrameElement | null) => {
    if (!frame) return;
    frame.blur();
    frame.style.setProperty('opacity', '0', 'important');
    frame.style.setProperty('visibility', 'hidden', 'important');
    frame.style.setProperty('pointer-events', 'none', 'important');
  }, []);

  const showFrameNow = useCallback((frame: HTMLIFrameElement | null) => {
    if (!frame) return;
    frame.style.setProperty('opacity', '1', 'important');
    frame.style.setProperty('visibility', 'visible', 'important');
    frame.style.setProperty('pointer-events', 'auto', 'important');
  }, []);

  useLayoutEffect(() => {
    if (!visible || dismissed) return;
    for (const authMode of AUTH_MODES) {
      const frame = frameRefs.current[authMode];
      if (authMode === activeMode && readyByMode[authMode]) showFrameNow(frame);
      else hideFrameNow(frame);
    }

    if (readyByMode[activeMode]) {
      frameRefs.current[activeMode]?.focus({ preventScroll: true });
    }
  }, [activeMode, dismissed, hideFrameNow, readyByMode, showFrameNow, visible]);

  const dropInputOwnershipNow = useCallback(() => {
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.dataset.state = 'dismissed';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.setProperty('pointer-events', 'none', 'important');
      overlay.style.setProperty('visibility', 'hidden', 'important');
    }

    for (const authMode of AUTH_MODES) hideFrameNow(frameRefs.current[authMode]);
  }, [hideFrameNow]);

  const revealFrameOnlyWhenRendered = useCallback((frame: HTMLIFrameElement, frameMode: MemberAuthMode) => {
    if (closingRef.current || !embeddedAuthShellReady(frame.contentDocument)) return false;

    const currentPoll = framePollRefs.current[frameMode];
    if (currentPoll !== null) window.cancelAnimationFrame(currentPoll);
    framePollRefs.current[frameMode] = window.requestAnimationFrame(() => {
      framePollRefs.current[frameMode] = null;
      if (closingRef.current || !embeddedAuthShellReady(frame.contentDocument)) return;
      setReadyByMode((current) => current[frameMode] ? current : { ...current, [frameMode]: true });
    });
    return true;
  }, []);

  const dismissImmediately = useCallback((afterClose: () => void | Promise<void>) => {
    if (closingRef.current) return;
    closingRef.current = true;

    dropInputOwnershipNow();
    setDismissed(true);
    setVisible(false);
    setReadyByMode({ login: false, register: false });
    cancelFrameWork();
    releaseDocumentLockNow();
    removeOverlayOwnership();
    restorePreviousFocus();
    void afterClose();
  }, [cancelFrameWork, dropInputOwnershipNow, releaseDocumentLockNow, removeOverlayOwnership, restorePreviousFocus]);

  const requestClose = useCallback(() => {
    dismissImmediately(onCloseRef.current);
  }, [dismissImmediately]);

  const completeAuth = useCallback(async () => {
    if (closingRef.current || authCompletionRef.current) return;
    authCompletionRef.current = true;
    try {
      await onSuccessRef.current();
    } finally {
      authCompletionRef.current = false;
    }
  }, []);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    closingRef.current = false;
    authCompletionRef.current = false;
    activeModeRef.current = mode;
    setActiveMode(mode);
    setDismissed(false);
    setReadyByMode({ login: false, register: false });
    setVisible(false);

    const firstFrame = window.requestAnimationFrame(() => {
      revealFrameRef.current = window.requestAnimationFrame(() => {
        revealFrameRef.current = null;
        setVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      cancelFrameWork();
    };
  }, [cancelFrameWork, mode, requestId]);

  useEffect(() => {
    const releaseDocumentLock = acquireMemberDocumentOverlayLock();
    releaseDocumentLockRef.current = releaseDocumentLock;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
      const sourceMode = modeForFrameWindow(event.source, frameRefs.current);
      if (!sourceMode) return;
      const frame = frameRefs.current[sourceMode];
      if (!frame) return;

      const payload = event.data as { type?: unknown; mode?: unknown };
      if (payload.type === 'member-auth-ready') {
        revealFrameOnlyWhenRendered(frame, sourceMode);
        return;
      }
      if (sourceMode !== activeModeRef.current) return;

      if (payload.type === 'member-auth-close') requestClose();
      else if (payload.type === 'member-auth-success') void completeAuth();
      else if (
        payload.type === 'member-auth-switch'
        && (payload.mode === 'login' || payload.mode === 'register')
      ) switchMode(payload.mode);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
      cancelFrameWork();
      dropInputOwnershipNow();
      if (releaseDocumentLockRef.current === releaseDocumentLock) {
        releaseDocumentLockRef.current = null;
      }
      releaseDocumentLock();
      removeOverlayOwnership();
      restorePreviousFocus();
    };
  }, [cancelFrameWork, completeAuth, dropInputOwnershipNow, removeOverlayOwnership, requestClose, restorePreviousFocus, revealFrameOnlyWhenRendered, switchMode]);

  function revealFrameWhenEmbedded(event: SyntheticEvent<HTMLIFrameElement>, frameMode: MemberAuthMode) {
    const frame = event.currentTarget;
    frameRefs.current[frameMode] = frame;
    const embeddedDocument = frame.contentDocument;
    const embeddedElement = embeddedDocument?.defaultView?.Element;

    if (embeddedDocument) {
      embeddedDocument.documentElement.dataset.memberAuthStableShell = 'true';
    }

    navigationAbortRefs.current[frameMode]?.abort();
    const navigationAbort = new AbortController();
    navigationAbortRefs.current[frameMode] = navigationAbort;

    if (embeddedDocument && embeddedElement) {
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

        const nextMode = embeddedAuthMode(control, frameMode);
        if (!nextMode || nextMode === frameMode) return;

        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        switchMode(nextMode);
      }, { capture: true, signal: navigationAbort.signal });
    }

    const currentPoll = framePollRefs.current[frameMode];
    if (currentPoll !== null) window.cancelAnimationFrame(currentPoll);
    let attempts = 0;
    const checkEmbeddedMode = () => {
      if (closingRef.current) return;
      if (revealFrameOnlyWhenRendered(frame, frameMode)) return;
      attempts += 1;
      if (attempts >= 240) {
        framePollRefs.current[frameMode] = null;
        return;
      }
      framePollRefs.current[frameMode] = window.requestAnimationFrame(checkEmbeddedMode);
    };

    framePollRefs.current[frameMode] = window.requestAnimationFrame(checkEmbeddedMode);
  }

  if (dismissed) return null;

  const frameReady = readyByMode[activeMode];
  const motionState = visible ? 'open' : 'opening';
  const overlay = (
    <div
      ref={overlayRef}
      className="member-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={activeMode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
      aria-busy={!frameReady}
      data-state={motionState}
      data-frame-ready={frameReady ? 'true' : 'false'}
      data-auth-mode={activeMode}
      data-auth-request-id={requestId}
    >
      <span
        className="member-auth-overlay__backdrop"
        aria-hidden="true"
        onClick={requestClose}
      />
      {AUTH_MODES.map((frameMode) => (
        <iframe
          key={frameMode}
          ref={(frame) => { frameRefs.current[frameMode] = frame; }}
          className="member-auth-overlay__frame"
          src={embeddedPath(frameMode, requestId)}
          title={frameMode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          allow="clipboard-write"
          aria-hidden={activeMode === frameMode ? undefined : true}
          tabIndex={activeMode === frameMode ? 0 : -1}
          data-auth-frame-mode={frameMode}
          data-auth-frame-active={activeMode === frameMode ? 'true' : 'false'}
          onLoad={(event) => revealFrameWhenEmbedded(event, frameMode)}
        />
      ))}
    </div>
  );

  return portalTarget ? createPortal(overlay, portalTarget) : null;
}

function embeddedPath(mode: MemberAuthMode, requestId: MemberAuthRequestId) {
  const pathname = mode === 'register' ? '/register' : '/login';
  return `${pathname}?embed=1&request=${encodeURIComponent(requestId)}`;
}

function embeddedAuthShellReady(document: Document | null) {
  if (!document) return false;
  const page = document.querySelector<HTMLElement>('[data-embedded="true"]');
  if (!page) return false;
  return Boolean(page.querySelector('[role="dialog"], .source-login-modal, .source-register-modal'));
}

function modeForFrameWindow(source: MessageEventSource | null, frames: FrameByMode): MemberAuthMode | null {
  for (const mode of AUTH_MODES) {
    if (frames[mode]?.contentWindow === source) return mode;
  }
  return null;
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
