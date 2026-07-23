'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type AdminDrawerProps = {
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
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;

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

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);
    const containFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onClose();
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
  }, [busy, onClose, open]);

  if (!mounted || !open) return null;

  return createPortal(<>
    <style jsx global>{drawerCss}</style>
    <div className="admin-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <aside ref={drawerRef} className={`admin-drawer admin-drawer--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1}>
        <header className="admin-drawer__head">
          <div className="admin-drawer__copy">
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button ref={closeRef} type="button" className="admin-ui-button admin-ui-button--ghost admin-ui-button--compact" disabled={busy} onClick={onClose}>{closeLabel}</button>
        </header>
        <div className="admin-drawer__body">{children}</div>
        {footer && <footer className="admin-drawer__footer">{footer}</footer>}
      </aside>
    </div>
  </>, document.body);
}

const drawerCss = `
.admin-drawer-layer{position:fixed;inset:0;z-index:10000;display:flex;justify-content:flex-end;overflow:hidden;overscroll-behavior:contain;background:rgba(2,6,23,.7);backdrop-filter:blur(7px)}
.admin-drawer{width:min(100%,600px);height:100dvh;min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden;background:#111823;color:#f8fafc;border-left:1px solid rgba(148,163,184,.24);box-shadow:-24px 0 70px rgba(0,0,0,.45)}
.admin-drawer--compact{width:min(100%,460px)}.admin-drawer--wide{width:min(100%,760px)}
.admin-drawer__head{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:14px;padding:max(20px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) 14px 22px;background:inherit;border-bottom:1px solid rgba(148,163,184,.16)}
.admin-drawer__copy{min-width:0;overflow-wrap:anywhere}.admin-drawer__copy h2{margin:0!important;font-size:clamp(21px,3vw,28px)!important;line-height:1.15!important}.admin-drawer__copy p{margin:7px 0 0!important;color:#94a3b8!important;font-size:13px!important;line-height:1.5!important}
.admin-drawer__body{min-width:0;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:18px max(20px,env(safe-area-inset-right)) max(22px,env(safe-area-inset-bottom)) 22px}
.admin-drawer__footer{position:sticky;bottom:0;z-index:2;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;padding:12px max(20px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) 22px;background:inherit;border-top:1px solid rgba(148,163,184,.16)}
@media(max-width:720px){.admin-drawer-layer{align-items:stretch}.admin-drawer,.admin-drawer--compact,.admin-drawer--wide{width:100%;height:100dvh;border-left:0}.admin-drawer__head{padding:max(16px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) 12px max(14px,env(safe-area-inset-left))}.admin-drawer__body{padding:14px max(14px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}.admin-drawer__footer{padding:11px max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}.admin-drawer__footer>*{flex:1 1 140px}}
@media(prefers-reduced-motion:reduce){.admin-drawer-layer{backdrop-filter:none}}
`;
