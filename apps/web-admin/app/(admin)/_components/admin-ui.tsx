import type { ReactNode } from 'react';

type PageProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode };
type CardProps = { title?: string; description?: string; action?: ReactNode; children: ReactNode; tone?: SurfaceTone };
type MetricProps = { title: string; value: string; helper?: string; tone?: SurfaceTone; trend?: string };
type SurfaceTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'success';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export function AdminPage({ eyebrow, title, description, actions, children }: PageProps) {
  return <main className="admin-ui-page"><header className="admin-ui-page__head"><div>{eyebrow && <p className="admin-ui-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="admin-ui-page__description">{description}</p>}</div>{actions && <div className="admin-ui-page__actions">{actions}</div>}</header>{children}</main>;
}

export function AdminCard({ title, description, action, children, tone = 'neutral' }: CardProps) {
  return <section className={`admin-ui-card admin-ui-surface--${tone}`}>{(title || description || action) && <header className="admin-ui-card__head"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action && <div className="admin-ui-card__action">{action}</div>}</header>}<div className="admin-ui-stack">{children}</div></section>;
}

export function AdminMetric({ title, value, helper, tone = 'neutral', trend }: MetricProps) {
  return <article className={`admin-ui-metric admin-ui-surface--${tone}`}><p>{title}</p><strong>{value}</strong>{helper && <span>{helper}</span>}{trend && <em>{trend}</em>}</article>;
}

export function AdminMetricGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-metric-grid">{children}</div>; }
export function AdminGrid({ children }: { children: ReactNode }) { return <div className="admin-ui-grid">{children}</div>; }
export function AdminStack({ children }: { children: ReactNode }) { return <div className="admin-ui-stack">{children}</div>; }
export function AdminRow({ children }: { children: ReactNode }) { return <div className="admin-ui-row">{children}</div>; }
export function AdminSectionRow({ children }: { children: ReactNode }) { return <div className="admin-ui-section-row">{children}</div>; }
export function AdminToolbar({ children }: { children: ReactNode }) { return <div className="admin-ui-toolbar">{children}</div>; }
export function AdminNotice({ children, tone = 'neutral' }: { children: ReactNode; tone?: SurfaceTone }) { return <div className={`admin-ui-notice admin-ui-surface--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>{children}</div>; }
export function AdminEmpty({ children }: { children: ReactNode }) { return <div className="admin-ui-empty">{children}</div>; }
export function AdminSkeleton({ lines = 3 }: { lines?: number }) { return <div className="admin-ui-skeleton" aria-label="กำลังโหลด" role="status"><span className="admin-ui-skeleton__block" />{Array.from({ length: lines }, (_, index) => <span key={index} className="admin-ui-skeleton__line" />)}</div>; }

export function AdminButton({ children, onClick, type = 'button', disabled, tone = 'primary' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: ButtonTone }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`admin-ui-button admin-ui-button--${tone}`}>{children}</button>;
}

export function AdminLinkButton({ children, href, tone = 'secondary' }: { children: ReactNode; href: string; tone?: 'primary' | 'secondary' }) {
  return <a href={href} className={`admin-ui-button admin-ui-button--${tone}`}>{children}</a>;
}

export function AdminBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`admin-ui-badge admin-ui-badge--${tone}`}>{children}</span>;
}

export function AdminCommandPanel({ children }: { children: ReactNode }) { return <section className="admin-ui-command-panel">{children}</section>; }
export function AdminActionStrip({ children }: { children: ReactNode }) { return <div className="admin-ui-action-strip">{children}</div>; }

export function formatMoney(value: string | number) {
  return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
