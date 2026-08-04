'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './admin-drawer.module.css';

export type AdminDrawerProps = {
  open: boolean;
  title: string;
  description?: string | undefined;
  closeLabel?: string | undefined;
  size?: 'compact' | 'medium' | 'wide' | undefined;
  busy?: boolean | undefined;
  footer?: ReactNode;
  children: ReactNode;
  onClose: () => void;
};

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function AdminDrawer({ open, title, description, closeLabel = 'ปิด', size = 'medium', busy = false, footer, children, onClose }: AdminDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { busyRef.current = busy; }, [busy]);

  useEffect(() => {
    if (!open) return undefined;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollY = window.scrollY;
    const previousBody = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 30);
    const containFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
        .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');
      if (focusable.length === 0) {
        event.preventDefault();
        drawerRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', containFocus);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', containFocus);
      document.body.style.overflow = previousBody.overflow;
      document.body.style.position = previousBody.position;
      document.body.style.top = previousBody.top;
      document.body.style.width = previousBody.width;
      window.scrollTo(0, scrollY);
      window.setTimeout(() => openerRef.current?.focus(), 0);
    };
  }, [open]);

  if (!mounted || !open) return null;

  const sizeClass = size === 'compact' ? styles.compact : size === 'wide' ? styles.wide : '';
  return createPortal(
    <div className={`${styles.layer} admin-overlay-drawer-layer`} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyRef.current) onCloseRef.current(); }}>
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${sizeClass} admin-overlay-drawer`.trim()}
        data-size={size}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        <header className={`${styles.header} admin-overlay-drawer__header`}>
          <div className={`${styles.copy} admin-overlay-drawer__copy`}>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <button ref={closeButtonRef} type="button" className="admin-ui-button admin-ui-button--ghost admin-ui-button--compact" disabled={busy} onClick={onClose}>{closeLabel}</button>
        </header>
        <div className={`${styles.body} admin-overlay-drawer__body`}>{children}</div>
        {footer ? <footer className={`${styles.footer} admin-overlay-drawer__footer`}>{footer}</footer> : null}
      </aside>
    </div>,
    document.body,
  );
}
