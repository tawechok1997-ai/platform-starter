export const MEMBER_DESKTOP_VIEWPORT_RESYNC_EVENT = 'member:desktop-viewport-resync';

type DocumentStyleSnapshot = {
  bodyOverflow: string;
  bodyOverscrollBehavior: string;
  bodyPaddingRight: string;
  htmlOverflow: string;
  htmlOverscrollBehavior: string;
};

let activeLockCount = 0;
let styleSnapshot: DocumentStyleSnapshot | null = null;
let frozenViewportWidth: number | null = null;

/**
 * Owns document scroll locking for every Member overlay.
 *
 * The first overlay captures and locks the document. Nested overlays only
 * increase the reference count, so closing one overlay cannot restore stale
 * styles while another overlay is still visible.
 *
 * data-member-overlay-open is deliberately not owned here. The visual overlay
 * detector owns that state; this utility only exposes the lock state/count.
 */
export function acquireMemberDocumentOverlayLock() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => undefined;
  }

  let released = false;

  if (activeLockCount === 0) {
    const body = document.body;
    const html = document.documentElement;
    const measuredViewportWidth = Math.max(1, html.clientWidth || window.innerWidth || 1);
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
    const computedBodyPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;

    styleSnapshot = {
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: html.style.overflow,
      htmlOverscrollBehavior: html.style.overscrollBehavior,
    };
    frozenViewportWidth = measuredViewportWidth;

    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${computedBodyPaddingRight + scrollbarWidth}px`;
    }
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    html.dataset.memberOverlayLock = 'true';
    html.style.setProperty('--member-overlay-viewport-width', `${measuredViewportWidth}px`);
  }

  activeLockCount += 1;
  document.documentElement.dataset.memberOverlayCount = String(activeLockCount);

  return () => {
    if (released) return;
    released = true;
    activeLockCount = Math.max(0, activeLockCount - 1);

    if (activeLockCount > 0) {
      document.documentElement.dataset.memberOverlayCount = String(activeLockCount);
      return;
    }

    restoreDocumentStyles();
    scheduleDesktopViewportResync();
  };
}

/**
 * Returns the physical Desktop width from before the first overlay hid the
 * scrollbar. This prevents the scaled Desktop canvas from recalculating from a
 * temporary, wider clientWidth while a dialog is open.
 */
export function getMemberDesktopViewportWidth() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 1;
  if (activeLockCount > 0 && frozenViewportWidth !== null) return frozenViewportWidth;
  return Math.max(1, document.documentElement.clientWidth || window.innerWidth || 1);
}

function restoreDocumentStyles() {
  const body = document.body;
  const html = document.documentElement;
  const snapshot = styleSnapshot;

  if (snapshot) {
    body.style.overflow = snapshot.bodyOverflow;
    body.style.overscrollBehavior = snapshot.bodyOverscrollBehavior;
    body.style.paddingRight = snapshot.bodyPaddingRight;
    html.style.overflow = snapshot.htmlOverflow;
    html.style.overscrollBehavior = snapshot.htmlOverscrollBehavior;
  }

  delete html.dataset.memberOverlayLock;
  delete html.dataset.memberOverlayCount;
  html.style.removeProperty('--member-overlay-viewport-width');
  styleSnapshot = null;
  frozenViewportWidth = null;
}

function scheduleDesktopViewportResync() {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event(MEMBER_DESKTOP_VIEWPORT_RESYNC_EVENT));
    });
  });
}
