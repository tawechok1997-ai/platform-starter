'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PageProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode };
type CardProps = { title?: string; description?: string; action?: ReactNode; children: ReactNode; tone?: SurfaceTone; compact?: boolean };
type MetricProps = { title: string; value: string; helper?: string; tone?: SurfaceTone; trend?: string };
type SurfaceTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'compact' | 'regular';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger' | 'success';
  busy?: boolean;
  details?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

const safeTextContainerStyle: CSSProperties = {
  minWidth: 0,
  maxWidth: '100%',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
};

const monoStyle: CSSProperties = {
  ...safeTextContainerStyle,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontVariantNumeric: 'tabular-nums',
};

const rowStyle: CSSProperties = {
  ...safeTextContainerStyle,
  width: '100%',
  columnGap: 'clamp(12px, 3vw, 20px)',
};

export function AdminPage({ eyebrow, title, description, actions, children }: PageProps) {
  return <main className="admin-ui-page">
    <style jsx global>{adminSystemCss}</style>
    <header className="admin-ui-page__head">
      <div className="admin-ui-page__copy">{eyebrow && <p className="admin-ui-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="admin-ui-page__description">{description}</p>}</div>
      {actions && <div className="admin-ui-page__actions">{actions}</div>}
    </header>
    {children}
  </main>;
}

export function AdminCard({ title, description, action, children, tone = 'neutral', compact = false }: CardProps) {
  return <section className={`admin-ui-card admin-ui-surface--${tone}${compact ? ' admin-ui-card--compact' : ''}`} style={safeTextContainerStyle}>
    {(title || description || action) && <header className="admin-ui-card__head"><div className="admin-ui-card__copy">{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action && <div className="admin-ui-card__action">{action}</div>}</header>}
    <div className="admin-ui-stack">{children}</div>
  </section>;
}

export function AdminMetric({ title, value, helper, tone = 'neutral', trend }: MetricProps) {
  return <article className={`admin-ui-metric admin-ui-surface--${tone}`} style={safeTextContainerStyle}><p>{title}</p><strong>{value}</strong>{helper && <span>{helper}</span>}{trend && <em>{trend}</em>}</article>;
}

export function AdminMetricGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-metric-grid">{children}</div>; }
export function AdminGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-grid">{children}</div>; }
export function AdminStack({ children }: { children: ReactNode }) { return <div className="admin-ui-stack" style={safeTextContainerStyle}>{children}</div>; }
export function AdminRow({ children }: { children: ReactNode }) { return <div className="admin-ui-row" style={rowStyle}>{children}</div>; }
export function AdminSectionRow({ children }: { children: ReactNode }) { return <div className="admin-ui-section-row" style={rowStyle}>{children}</div>; }
export function AdminToolbar({ children }: { children: ReactNode }) { return <div className="admin-ui-toolbar" style={safeTextContainerStyle}>{children}</div>; }
export function AdminFilterBar({ children, resultText }: { children: ReactNode; resultText?: ReactNode }) { return <div className="admin-ui-filter-bar" style={safeTextContainerStyle}><div className="admin-ui-filter-bar__controls">{children}</div>{resultText && <div className="admin-ui-filter-bar__result">{resultText}</div>}</div>; }
export function AdminNotice({ children, tone = 'neutral' }: { children: ReactNode; tone?: SurfaceTone }) { return <div className={`admin-ui-notice admin-ui-surface--${tone}`} role={tone === 'danger' ? 'alert' : 'status'} style={safeTextContainerStyle}>{children}</div>; }
export function AdminEmpty({ children }: { children: ReactNode }) { return <div className="admin-ui-empty" style={safeTextContainerStyle}>{children}</div>; }
export function AdminSkeleton({ lines = 3 }: { lines?: number }) { return <div className="admin-ui-skeleton" aria-label="กำลังโหลด" role="status"><span className="admin-ui-skeleton__block" />{Array.from({ length: lines }, (_, index) => <span key={index} className="admin-ui-skeleton__line" />)}</div>; }

export function AdminButton({ children, onClick, type = 'button', disabled, tone = 'primary', size = 'regular', ariaLabel }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: ButtonTone; size?: ButtonSize; ariaLabel?: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--${size}`}>{children}</button>;
}

export function AdminIconButton({ children, onClick, disabled, tone = 'ghost', label }: { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: ButtonTone; label: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--compact admin-ui-icon-button`}>{children}</button>;
}

export function AdminLinkButton({ children, href, tone = 'secondary', size = 'regular' }: { children: ReactNode; href: string; tone?: 'primary' | 'secondary' | 'ghost'; size?: ButtonSize }) {
  return <a href={href} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--${size}`}>{children}</a>;
}

export function AdminBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) { return <span className={`admin-ui-badge admin-ui-badge--${tone}`}>{children}</span>; }
export function AdminCode({ children, title }: { children: ReactNode; title?: string }) { return <code className="admin-ui-code" title={title} style={monoStyle}>{children}</code>; }
export function AdminDataValue({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) { return <div className="admin-ui-data-value"><span>{label}</span><strong style={mono ? monoStyle : safeTextContainerStyle}>{children}</strong></div>; }
export function AdminPayloadViewer({ payload, emptyLabel = 'ไม่มีข้อมูล', maxHeight = 420 }: { payload: unknown; emptyLabel?: string; maxHeight?: number }) {
  const hasPayload = payload !== null && payload !== undefined;
  return <pre className="admin-ui-payload" style={{ maxHeight }}>{hasPayload ? JSON.stringify(payload, null, 2) : emptyLabel}</pre>;
}
export function AdminPagination({ page, totalPages, onPrevious, onNext, disabled = false }: { page: number; totalPages: number; onPrevious: () => void; onNext: () => void; disabled?: boolean }) {
  const safeTotalPages = Math.max(1, totalPages);
  return <nav className="admin-ui-pagination" aria-label="เปลี่ยนหน้า"><AdminButton size="compact" tone="ghost" onClick={onPrevious} disabled={disabled || page <= 1}>ก่อนหน้า</AdminButton><span>หน้า {Math.min(page, safeTotalPages)} / {safeTotalPages}</span><AdminButton size="compact" tone="ghost" onClick={onNext} disabled={disabled || page >= safeTotalPages}>ถัดไป</AdminButton></nav>;
}

export function AdminConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'ยกเลิก', tone = 'primary', busy = false, details, onConfirm, onCancel }: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const previous = { overflow: document.body.style.overflow, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    const focusTimer = window.setTimeout(() => cancelRef.current?.focus(), 30);
    const containFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { onCancel(); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', containFocus);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', containFocus);
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [open, busy, onCancel]);
  if (!open || !mounted) return null;

  return createPortal(
    <div className="admin-confirm-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <section ref={dialogRef} className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <div className="admin-confirm-dialog__head"><div className={`admin-confirm-dialog__mark admin-confirm-dialog__mark--${tone}`} aria-hidden="true">!</div><div className="admin-confirm-dialog__copy"><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div></div>
        <div className="admin-confirm-dialog__body">{details ? <div className="admin-confirm-dialog__details">{details}</div> : null}</div>
        <div className="admin-confirm-dialog__actions"><button ref={cancelRef} type="button" className="admin-ui-button admin-ui-button--secondary admin-ui-button--regular" disabled={busy} onClick={onCancel}>{cancelLabel}</button><button type="button" disabled={busy} onClick={onConfirm} className={`admin-ui-button admin-ui-button--${tone} admin-ui-button--regular`}>{busy ? 'กำลังดำเนินการ...' : confirmLabel}</button></div>
      </section>
    </div>, document.body,
  );
}

export function AdminDrawer({ open, title, description, children, busy = false, onClose }: { open: boolean; title: string; description?: string; children: ReactNode; busy?: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const drawerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollY = window.scrollY;
    const previous = { overflow: document.body.style.overflow, position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 30);
    const containFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { onClose(); return; }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', containFocus);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', containFocus);
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      window.scrollTo(0, scrollY);
      window.setTimeout(() => restoreFocusRef.current?.focus(), 0);
    };
  }, [open, busy, onClose]);
  if (!open || !mounted) return null;

  const accessibility = description ? { 'aria-describedby': descriptionId } : {};
  return createPortal(
    <div className="admin-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <aside ref={drawerRef} className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} {...accessibility}>
        <header className="admin-drawer__head"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button ref={closeRef} type="button" className="admin-ui-button admin-ui-button--ghost admin-ui-button--compact" disabled={busy} onClick={onClose}>ปิด</button></header>
        <div className="admin-drawer__body">{children}</div>
      </aside>
    </div>, document.body,
  );
}

export function AdminCommandPanel({ children }: { children: ReactNode }) { return <section className="admin-ui-command-panel" style={safeTextContainerStyle}>{children}</section>; }
export function AdminActionStrip({ children }: { children: ReactNode }) { return <div className="admin-ui-action-strip" style={safeTextContainerStyle}>{children}</div>; }
export function formatMoney(value: string | number | null | undefined) { const amount = typeof value === 'number' ? value : Number(value ?? 0); const safeAmount = Number.isFinite(amount) ? amount : 0; return `THB ${safeAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }

const adminSystemCss = `
.admin-drawer-layer{position:fixed;inset:0;z-index:9000;display:flex;justify-content:flex-end;background:rgba(2,6,23,.62);backdrop-filter:blur(5px)}
.admin-drawer{width:min(620px,100%);height:100%;overflow:auto;padding:24px;background:#111823;border-left:1px solid rgba(148,163,184,.22);box-shadow:-24px 0 60px rgba(2,6,23,.42)}
.admin-drawer__head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}.admin-drawer__head h2{margin:0;font-size:24px}.admin-drawer__head p{margin:6px 0 0;color:#94a3b8}.admin-drawer__body{display:grid;gap:14px}
@media(max-width:640px){.admin-drawer-layer{align-items:flex-end}.admin-drawer{width:100%;height:min(88dvh,760px);border-left:0;border-top:1px solid rgba(148,163,184,.22);border-radius:22px 22px 0 0;padding:18px}}
.admin-ui-page{min-width:0;width:100%;display:grid;gap:18px}
.admin-ui-page__head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:18px;margin-bottom:2px}
.admin-ui-page__copy,.admin-ui-card__copy,.admin-ui-card__action,.admin-confirm-dialog__copy{min-width:0;max-width:100%;overflow-wrap:anywhere}
.admin-ui-eyebrow{margin:0 0 6px!important;font-size:12px!important;line-height:1.2!important;letter-spacing:.09em;text-transform:uppercase;color:var(--brand)!important;font-weight:900}
.admin-ui-page__head h1{margin:0 0 8px!important;font-size:clamp(28px,4vw,44px)!important;line-height:1.05!important;letter-spacing:-.035em!important}
.admin-ui-page__description{max-width:760px;margin:0!important;font-size:14px!important;line-height:1.55!important}
.admin-ui-page__actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;min-width:0}
.admin-ui-card{padding:18px!important;border-radius:18px!important;overflow:hidden!important}
.admin-ui-card--compact{padding:14px!important}
.admin-ui-card__head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:14px;margin-bottom:14px}
.admin-ui-card--compact .admin-ui-card__head{margin-bottom:10px}
.admin-ui-card__head h2{margin:0!important;font-size:clamp(18px,2.4vw,22px)!important;line-height:1.2!important}
.admin-ui-card__head p{margin:5px 0 0!important;font-size:13px!important;line-height:1.45!important}
.admin-ui-stack{display:grid;gap:12px;min-width:0;max-width:100%}
.admin-ui-row,.admin-ui-section-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0}
.admin-ui-toolbar,.admin-ui-filter-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;min-width:0;padding:12px!important;border:1px solid var(--line);border-radius:14px;background:rgba(148,163,184,.045)}
.admin-ui-toolbar>input,.admin-ui-toolbar>select,.admin-ui-filter-bar__controls>input,.admin-ui-filter-bar__controls>select{flex:1 1 190px!important}
.admin-ui-filter-bar{justify-content:space-between}.admin-ui-filter-bar__controls{display:flex;align-items:center;gap:10px;flex:1 1 520px;flex-wrap:wrap;min-width:0}.admin-ui-filter-bar__result{margin-left:auto;color:var(--muted);font-size:13px;white-space:nowrap}
.admin-ui-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;text-decoration:none;white-space:normal;text-align:center;border:1px solid transparent;transition:transform .16s ease,background .16s ease,border-color .16s ease,opacity .16s ease}
.admin-ui-button--regular{min-height:42px;padding:9px 15px;border-radius:11px;font-size:14px;line-height:1.2}
.admin-ui-button--compact{min-height:36px;padding:7px 11px;border-radius:10px;font-size:13px;line-height:1.15}
.admin-ui-icon-button{width:38px!important;min-width:38px!important;height:38px!important;min-height:38px!important;padding:0!important;font-size:17px}
.admin-ui-button--ghost{background:transparent;color:#cbd5e1;border-color:var(--line)}
.admin-ui-button:disabled{cursor:not-allowed;opacity:.55;transform:none!important}
.admin-ui-button:focus-visible,.admin-ui-toolbar input:focus-visible,.admin-ui-toolbar select:focus-visible,.admin-ui-filter-bar input:focus-visible,.admin-ui-filter-bar select:focus-visible{outline:3px solid rgba(245,197,66,.24);outline-offset:2px}
.admin-ui-metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.admin-ui-metric{padding:15px!important;min-height:112px;display:grid;align-content:start;gap:5px}
.admin-ui-metric p,.admin-ui-metric span,.admin-ui-metric em{margin:0!important;font-size:12px!important;line-height:1.35!important}
.admin-ui-metric strong{font-size:clamp(22px,4vw,31px);line-height:1.05;font-variant-numeric:tabular-nums}
.admin-ui-badge{display:inline-flex;align-items:center;max-width:100%;overflow-wrap:anywhere}
.admin-ui-code{display:inline-block;max-width:100%;font-size:12px;line-height:1.45;overflow-wrap:anywhere;word-break:break-word}
.admin-ui-data-value{display:grid;grid-template-columns:minmax(110px,.45fr) minmax(0,1fr);gap:10px;align-items:start;min-width:0}
.admin-ui-data-value>span{color:var(--muted);font-size:13px}.admin-ui-data-value>strong{font-size:14px;font-weight:800;text-align:right}
.admin-ui-payload{margin:0;padding:12px;border:1px solid var(--line);border-radius:12px;background:#020617;color:#cbd5e1;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:12px;line-height:1.5;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
.admin-ui-pagination{display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-wrap:wrap;min-width:0}.admin-ui-pagination>span{color:var(--muted);font-size:13px;font-variant-numeric:tabular-nums}
.admin-confirm-layer{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:max(14px,env(safe-area-inset-top)) 12px max(14px,env(safe-area-inset-bottom));overflow:hidden;overscroll-behavior:contain;background:rgba(2,6,23,.72);backdrop-filter:blur(8px)}
.admin-confirm-dialog{width:min(100%,560px);max-height:calc(100dvh - 28px - env(safe-area-inset-top) - env(safe-area-inset-bottom));margin:auto;display:grid;grid-template-rows:auto minmax(0,1fr) auto;overflow:hidden;border:1px solid var(--line2);border-radius:20px;background:var(--card);box-shadow:0 28px 90px rgba(0,0,0,.55)}
.admin-confirm-dialog__head{display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:start;padding:20px 20px 12px;background:inherit;position:sticky;top:0;z-index:2}
.admin-confirm-dialog__copy h2{margin:0 0 6px!important;font-size:21px!important}.admin-confirm-dialog__copy p{margin:0!important;font-size:14px!important}
.admin-confirm-dialog__body{min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 20px 16px}
.admin-confirm-dialog__actions{position:sticky;bottom:0;z-index:2;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;padding:12px 20px max(16px,env(safe-area-inset-bottom));background:inherit;border-top:1px solid var(--line)}
@media(max-width:720px){
 .admin-ui-page{gap:14px}.admin-ui-page__head{grid-template-columns:1fr;gap:12px}.admin-ui-page__actions{justify-content:flex-start}.admin-ui-page__description{font-size:13px!important}
 .admin-ui-card{padding:14px!important;border-radius:16px!important}.admin-ui-card__head{grid-template-columns:1fr;gap:9px}.admin-ui-card__action{display:flex;justify-content:flex-start;flex-wrap:wrap;gap:8px}
 .admin-ui-row,.admin-ui-section-row{flex-direction:column;align-items:stretch}.admin-ui-row>*,.admin-ui-section-row>*{text-align:left!important}
 .admin-ui-toolbar,.admin-ui-filter-bar{display:grid;grid-template-columns:minmax(0,1fr);padding:10px!important}.admin-ui-toolbar>*,.admin-ui-filter-bar>*{width:100%;max-width:100%}.admin-ui-filter-bar__controls{display:grid;grid-template-columns:minmax(0,1fr);width:100%}.admin-ui-filter-bar__controls>*{width:100%;max-width:100%}.admin-ui-filter-bar__result{margin-left:0;white-space:normal}
 .admin-ui-metric-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.admin-ui-metric{min-height:98px;padding:12px!important}
 .admin-ui-data-value{grid-template-columns:1fr;gap:3px}.admin-ui-data-value>strong{text-align:left}.admin-ui-pagination{justify-content:stretch}.admin-ui-pagination .admin-ui-button{flex:1 1 120px}.admin-ui-pagination>span{order:-1;width:100%;text-align:center}
 .admin-confirm-layer{place-items:end center;padding:12px max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}.admin-confirm-dialog{width:100%;max-height:min(82dvh,720px);margin:0;border-radius:20px 20px 14px 14px}.admin-confirm-dialog__head{padding:17px 16px 10px}.admin-confirm-dialog__body{padding:0 16px 12px}.admin-confirm-dialog__actions{padding:11px 16px max(14px,env(safe-area-inset-bottom))}.admin-confirm-dialog__actions>*{flex:1 1 140px}
}
@media(max-width:420px){.admin-ui-metric-grid{grid-template-columns:1fr}.admin-ui-page__actions .admin-ui-button:not(.admin-ui-icon-button){flex:1 1 auto}.admin-ui-button--regular{min-height:40px;padding:8px 12px}}
@media(prefers-reduced-motion:reduce){.admin-ui-button{transition:none!important}.admin-confirm-layer{backdrop-filter:none}}
`;
