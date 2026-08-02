'use client';

import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { acquireMemberDocumentOverlayLock } from '../lib/member-document-overlay-lock';

export type MemberOverlayMode = 'modal' | 'sheet' | 'drawer';
type MemberModalMotionState = 'opening' | 'open' | 'closing';

export type MemberModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  icon?: string;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  mode?: MemberOverlayMode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  panelClassName?: string;
  backdropClassName?: string;
  contentClassName?: string;
};

const MODAL_EXIT_DURATION_MS = 180;

export function MemberModal({
  open,
  onClose,
  title,
  ariaLabel,
  icon,
  header,
  footer,
  children,
  mode = 'modal',
  closeOnBackdrop = true,
  closeOnEscape = true,
  panelClassName = '',
  backdropClassName = '',
  contentClassName = '',
}: MemberModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const motionStateRef = useRef<MemberModalMotionState>(open ? 'opening' : 'closing');
  const [mounted, setMounted] = useState(open);
  const [motionState, setMotionState] = useState<MemberModalMotionState>(open ? 'opening' : 'closing');

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    motionStateRef.current = motionState;
  }, [motionState]);

  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;
    let exitTimer = 0;

    if (open) {
      setMounted(true);
      setMotionState('opening');
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => setMotionState('open'));
      });
    } else if (mounted) {
      setMotionState('closing');
      exitTimer = window.setTimeout(() => setMounted(false), MODAL_EXIT_DURATION_MS);
    }

    return () => {
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      if (exitTimer) window.clearTimeout(exitTimer);
    };
  }, [mounted, open]);

  useEffect(() => {
    if (!mounted) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseDocumentLock = acquireMemberDocumentOverlayLock();

    const frame = window.requestAnimationFrame(() => {
      const first = focusable(panelRef.current)[0];
      (first ?? panelRef.current)?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape && motionStateRef.current !== 'closing') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || motionStateRef.current === 'closing') return;
      const items = focusable(panelRef.current);
      if (!items.length) {
        event.preventDefault();
        panelRef.current?.focus({ preventScroll: true });
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      releaseDocumentLock();
      restoreFocus.current?.focus({ preventScroll: true });
    };
  }, [closeOnEscape, mounted]);

  if (!mounted || typeof document === 'undefined') return null;

  const generatedHeader = title ? (
    <header className="member-modal-system__header">
      <div>
        {icon ? <span className="member-modal-system__icon"><img src={icon} alt="" aria-hidden="true" /></span> : null}
        <h2 id={titleId}>{title}</h2>
      </div>
      <button type="button" className="member-modal-system__close" onClick={() => onCloseRef.current()} aria-label="ปิด">
        <img src="/images/close.svg" alt="" aria-hidden="true" />
      </button>
    </header>
  ) : null;

  return createPortal(
    <div
      className={`member-modal-system__backdrop member-modal-system__backdrop--${mode} ${backdropClassName}`.trim()}
      data-member-modal-system="true"
      data-member-layer-keeps-profile-open="true"
      data-state={motionState}
      role="presentation"
      onPointerDown={(event) => {
        if (
          motionState === 'open'
          && closeOnBackdrop
          && event.currentTarget === event.target
        ) onCloseRef.current();
      }}
    >
      <section
        ref={panelRef}
        className={`member-modal-system__panel member-modal-system__panel--${mode} ${panelClassName}`.trim()}
        data-state={motionState}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : ariaLabel}
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {header ?? generatedHeader}
        <div className={`member-modal-system__content ${contentClassName}`.trim()}>{children}</div>
        {footer ? <footer className="member-modal-system__footer">{footer}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

export function MemberBottomSheet(props: Omit<MemberModalProps, 'mode'>) {
  return <MemberModal {...props} mode="sheet" />;
}

export function MemberDrawer(props: Omit<MemberModalProps, 'mode'>) {
  return <MemberModal {...props} mode="drawer" />;
}

function focusable(root: HTMLElement | null) {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>([
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(','))).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}
