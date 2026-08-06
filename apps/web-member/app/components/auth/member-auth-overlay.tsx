'use client';

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';
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

const REGISTER_LABELS = ['สมัครสมาชิก', 'ลงทะเบียน', 'register', 'sign up'];
const LOGIN_LABELS = ['เข้าสู่ระบบ', 'ล็อกอิน', 'login', 'log in', 'sign in'];

export default function MemberAuthOverlay({
  mode,
  requestId = 'legacy',
  onModeChange,
  onClose,
  onSuccess,
}: MemberAuthOverlayProps) {
  const initialPath = embeddedPath(mode, requestId);
  const [activeMode, setActiveMode] = useState<MemberAuthMode>(mode);
  const [frameReady, setFrameReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const closingRef = useRef(false);
  const authCompletionRef = useRef(false);
  const activeModeRef = useRef<MemberAuthMode>(mode);
  const requestedPathRef = useRef(initialPath);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const releaseDocumentLockRef = useRef<(() => void) | null>(null);
  const onModeChangeRef = useRef(onModeChange);
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const navigationAbortRef = useRef<AbortController | null>(null);
  const framePollRef = useRef<number | null>(null);
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
    requestedPathRef.current = embeddedPath(mode, requestId);
    setActiveMode(mode);
  }, [mode, requestId]);

  const switchMode = useCallback((nextMode: MemberAuthMode) => {
    activeModeRef.current = nextMode;
    setActiveMode(nextMode);
    onModeChangeRef.current?.(nextMode);
  }, []);

  const cancelFrameWork = useCallback(() => {
    navigationAbortRef.current?.abort();
    navigationAbortRef.current = null;

    if (framePollRef.current !== null) {
      window.cancelAnimationFrame(framePollRef.current);
      framePollRef.current = null;
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

  const dropInputOwnershipNow = useCallback(() => {
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.dataset.state = 'dismissed';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.setProperty('pointer-events', 'none', 'important');
      overlay.style.setProperty('visibility', 'hidden', 'important');
    }

    const frame = frameRef.current;
    if (frame) {
      frame.blur();
      frame.style.setProperty('pointer-events', 'none', 'important');
      frame.style.setProperty('visibility', 'hidden', 'important');
    }
  }, []);

  const revealFrameOnlyWhenRendered = useCallback((frame: HTMLIFrameElement) => {
    if (closingRef.current || !embeddedAuthShellReady(frame.contentDocument)) return false;

    framePollRef.current = window.requestAnimationFrame(() => {
      framePollRef.current = null;
      if (closingRef.current || !embeddedAuthShellReady(frame.contentDocument)) return;
      setFrameReady(true);
      frame.focus({ preventScroll: true });
    });
    return true;
  }, []);

  const dismissImmediately = useCallback((afterClose: () => void | Promise<void>) => {
    if (closingRef.current) return;
    closingRef.current = true;

    // Stop owning input before React state or URL updates get a chance to lag.
    // This is the safety boundary that prevents a transparent iframe from
    // swallowing every click after the dialog appears to have closed.
    dropInputOwnershipNow();
    setDismissed(true);
    setVisible(false);
    setFrameReady(false);
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

  const navigateEmbeddedMode = useCallback((nextMode: MemberAuthMode) => {
    if (closingRef.current) return;

    const nextPath = embeddedPath(nextMode, requestId);
    const expectedPathname = nextMode === 'register' ? '/register' : '/login';
    const frame = frameRef.current;

    requestedPathRef.current = nextPath;
    switchMode(nextMode);
    setFrameReady(false);
    if (!frame) return;

    try {
      const contentWindow = frame.contentWindow;
      if (!contentWindow) {
        frame.src = nextPath;
        return;
      }

      const currentLocation = contentWindow.location;
      const currentSearch = new URLSearchParams(currentLocation.search);
      const alreadyAtTarget = currentLocation.pathname === expectedPathname
        && currentSearch.get('embed') === '1'
        && currentSearch.get('request') === requestId;
      if (alreadyAtTarget) return;

      contentWindow.location.replace(nextPath);
    } catch {
      frame.src = nextPath;
    }
  }, [requestId, switchMode]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    closingRef.current = false;
    authCompletionRef.current = false;
    setDismissed(false);
    setFrameReady(false);
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
  }, [cancelFrameWork, requestId]);

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
      const frame = frameRef.current;
      const frameWindow = frame?.contentWindow;
      if (
        event.origin !== window.location.origin
        || !frame
        || !frameWindow
        || event.source !== frameWindow
        || !event.data
        || typeof event.data !== 'object'
      ) return;

      const payload = event.data as { type?: unknown; mode?: unknown };
      if (payload.type === 'member-auth-close') requestClose();
      else if (payload.type === 'member-auth-success') void completeAuth();
      else if (payload.type === 'member-auth-ready') {
        // The child can post ready in the same tick that it updates React state.
        // Verify that the actual embedded page and dialog exist before revealing
        // the iframe, otherwise a refresh briefly exposes a black/blank document.
        revealFrameOnlyWhenRendered(frame);
      } else if (
        payload.type === 'member-auth-switch'
        && (payload.mode === 'login' || payload.mode === 'register')
      ) navigateEmbeddedMode(payload.mode);
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
  }, [cancelFrameWork, completeAuth, dropInputOwnershipNow, navigateEmbeddedMode, removeOverlayOwnership, requestClose, restorePreviousFocus, revealFrameOnlyWhenRendered]);

  function revealFrameWhenEmbedded(event: SyntheticEvent<HTMLIFrameElement>) {
    const frame = event.currentTarget;
    const embeddedDocument = frame.contentDocument;
    const embeddedElement = embeddedDocument?.defaultView?.Element;

    if (embeddedDocument) {
      embeddedDocument.documentElement.dataset.memberAuthStableShell = 'true';
    }

    try {
      const loadedPathname = frame.contentWindow?.location.pathname;
      const expectedPathname = new URL(requestedPathRef.current, window.location.origin).pathname;
      if (loadedPathname && loadedPathname !== expectedPathname) {
        frame.contentWindow?.location.replace(requestedPathRef.current);
        return;
      }

      const loadedMode = loadedPathname === '/register'
        ? 'register'
        : loadedPathname === '/login'
          ? 'login'
          : null;
      if (loadedMode && loadedMode !== activeModeRef.current) switchMode(loadedMode);
    } catch {
      // The frame is same-origin in production. Ignore the brief replacement gap.
    }

    navigationAbortRef.current?.abort();
    const navigationAbort = new AbortController();
    navigationAbortRef.current = navigationAbort;

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

        const nextMode = embeddedAuthMode(control, activeModeRef.current);
        if (!nextMode || nextMode === activeModeRef.current) return;

        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        navigateEmbeddedMode(nextMode);
      }, { capture: true, signal: navigationAbort.signal });
    }

    if (framePollRef.current !== null) window.cancelAnimationFrame(framePollRef.current);
    let attempts = 0;
    const checkEmbeddedMode = () => {
      if (closingRef.current) return;
      if (revealFrameOnlyWhenRendered(frame)) return;
      attempts += 1;
      if (attempts >= 240) {
        framePollRef.current = null;
        return;
      }
      framePollRef.current = window.requestAnimationFrame(checkEmbeddedMode);
    };

    framePollRef.current = window.requestAnimationFrame(checkEmbeddedMode);
  }

  if (dismissed) return null;

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
      data-auth-request-id={requestId}
    >
      <span
        className="member-auth-overlay__backdrop"
        aria-hidden="true"
        onClick={requestClose}
      />
      <iframe
        ref={frameRef}
        className="member-auth-overlay__frame"
        src={initialPath}
        title={activeMode === 'register' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        allow="clipboard-write"
        onLoad={revealFrameWhenEmbedded}
      />
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
