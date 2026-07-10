import { ReactNode } from 'react';

type PageProps = { eyebrow?: string; title: string; description?: string; actions?: ReactNode; children: ReactNode };
type CardProps = { title?: string; description?: string; action?: ReactNode; children: ReactNode; tone?: SurfaceTone };
type MetricProps = { title: string; value: string; helper?: string; tone?: SurfaceTone; trend?: string };
type SurfaceTone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
type ButtonTone = 'primary' | 'secondary' | 'danger' | 'success';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export function AdminPage({ eyebrow, title, description, actions, children }: PageProps) {
  return <main style={pageStyle}><header style={pageHeadStyle}><div style={{ minWidth: 0 }}>{eyebrow && <p style={eyebrowStyle}>{eyebrow}</p>}<h1 style={titleStyle}>{title}</h1>{description && <p style={descriptionStyle}>{description}</p>}</div>{actions && <div style={actionsStyle}>{actions}</div>}</header>{children}</main>;
}

export function AdminCard({ title, description, action, children, tone = 'neutral' }: CardProps) {
  return <div style={{ ...cardStyle, ...surfaceToneStyle[tone] }}>{(title || description || action) && <div style={cardHeadStyle}><div style={{ minWidth: 0 }}>{title && <h2 style={cardTitleStyle}>{title}</h2>}{description && <p style={mutedStyle}>{description}</p>}</div>{action && <div style={cardActionStyle}>{action}</div>}</div>}<div style={stackStyle}>{children}</div></div>;
}

export function AdminMetric({ title, value, helper, tone = 'neutral', trend }: MetricProps) {
  return <div style={{ ...metricStyle, ...surfaceToneStyle[tone] }}><p style={metricLabelStyle}>{title}</p><strong style={metricValueStyle}>{value}</strong>{helper && <span style={metricHelperStyle}>{helper}</span>}{trend && <span style={trendStyle}>{trend}</span>}</div>;
}

export function AdminMetricGrid({ children }: { children: ReactNode }) { return <div style={metricGridStyle}>{children}</div>; }
export function AdminGrid({ children }: { children: ReactNode }) { return <div style={gridStyle}>{children}</div>; }
export function AdminStack({ children }: { children: ReactNode }) { return <div style={stackStyle}>{children}</div>; }
export function AdminRow({ children }: { children: ReactNode }) { return <div style={rowStyle}>{children}</div>; }
export function AdminSectionRow({ children }: { children: ReactNode }) { return <div style={sectionRowStyle}>{children}</div>; }
export function AdminToolbar({ children }: { children: ReactNode }) { return <div style={toolbarStyle}>{children}</div>; }
export function AdminNotice({ children }: { children: ReactNode }) { return <div style={noticeStyle}>{children}</div>; }
export function AdminEmpty({ children }: { children: ReactNode }) { return <div style={emptyStyle}>{children}</div>; }

export function AdminButton({ children, onClick, type = 'button', disabled, tone = 'primary' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; tone?: ButtonTone }) {
  return <button type={type} onClick={onClick} disabled={disabled} style={{ ...buttonBaseStyle, ...buttonToneStyle[tone], opacity: disabled ? 0.62 : 1 }}>{children}</button>;
}

export function AdminLinkButton({ children, href, tone = 'secondary' }: { children: ReactNode; href: string; tone?: 'primary' | 'secondary' }) {
  return <a href={href} style={{ ...buttonBaseStyle, ...buttonToneStyle[tone], textDecoration: 'none' }}>{children}</a>;
}

export function AdminBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: BadgeTone }) {
  return <span style={{ ...badgeStyle, ...badgeToneStyle[tone] }}>{children}</span>;
}

export function AdminCommandPanel({ children }: { children: ReactNode }) { return <section style={commandPanelStyle}>{children}</section>; }
export function AdminActionStrip({ children }: { children: ReactNode }) { return <div style={actionStripStyle}>{children}</div>; }

export function formatMoney(value: string | number) {
  return `THB ${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

const pageStyle = { width: '100%', maxWidth: 1240, margin: '0 auto', padding: '32px 24px 72px', color: '#f8fafc', minWidth: 0, overflowX: 'hidden' as const } as const;
const pageHeadStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 22, marginBottom: 24, flexWrap: 'wrap' as const, minWidth: 0 };
const eyebrowStyle = { margin: '0 0 10px', color: '#f5c542', fontSize: 12, fontWeight: 950, textTransform: 'uppercase' as const, letterSpacing: '.14em' } as const;
const titleStyle = { margin: '4px 0 12px', fontSize: 'clamp(32px, 6vw, 52px)', lineHeight: 1.04, letterSpacing: -1.1, fontWeight: 950, overflowWrap: 'anywhere' as const };
const descriptionStyle = { margin: 0, maxWidth: 740, color: '#a8b3c7', lineHeight: 1.68, fontSize: 16 } as const;
const actionsStyle = { display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const, width: 'fit-content', maxWidth: '100%' };
const cardStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 24, background: 'linear-gradient(145deg, rgba(17,26,36,.98), rgba(9,14,22,.96))', padding: 24, boxShadow: '0 18px 50px rgba(0,0,0,.28)', minWidth: 0, overflow: 'hidden' as const, position: 'relative' as const };
const cardHeadStyle = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap' as const, minWidth: 0 };
const cardActionStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const, justifyContent: 'flex-end' as const, maxWidth: '100%' };
const cardTitleStyle = { margin: 0, fontSize: 23, lineHeight: 1.22, fontWeight: 950, overflowWrap: 'anywhere' as const };
const mutedStyle = { margin: '7px 0 0', color: '#94a3b8', lineHeight: 1.62 } as const;
const metricGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(178px, 100%), 1fr))', gap: 14, marginBottom: 18, minWidth: 0 };
const metricStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 22, background: 'linear-gradient(145deg, rgba(17,26,36,.98), rgba(9,14,22,.96))', padding: 20, minWidth: 0, overflow: 'hidden' as const, boxShadow: '0 16px 40px rgba(0,0,0,.22)' };
const metricLabelStyle = { margin: '0 0 10px', color: '#a8b3c7', fontSize: 13, fontWeight: 800 } as const;
const metricValueStyle = { display: 'block', fontSize: 'clamp(24px,4vw,34px)', lineHeight: 1.06, overflowWrap: 'anywhere' as const, letterSpacing: -0.6 };
const metricHelperStyle = { display: 'block', color: '#94a3b8', fontSize: 12, marginTop: 10, overflowWrap: 'anywhere' as const, lineHeight: 1.5 };
const trendStyle = { display: 'inline-flex', width: 'fit-content', marginTop: 12, borderRadius: 999, padding: '5px 10px', background: 'rgba(148,163,184,.09)', color: '#dbeafe', fontSize: 12, fontWeight: 850 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(330px, 100%), 1fr))', gap: 16, minWidth: 0 };
const stackStyle = { display: 'grid', gap: 12, minWidth: 0 };
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 16, border: '1px solid rgba(148,163,184,.14)', borderRadius: 18, padding: 18, background: 'rgba(148,163,184,.055)', flexWrap: 'wrap' as const, minWidth: 0, overflow: 'hidden' as const, alignItems: 'center' as const };
const sectionRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 14, border: '1px solid rgba(148,163,184,.15)', borderRadius: 18, padding: 18, background: 'rgba(148,163,184,.055)', minWidth: 0, overflow: 'hidden' as const };
const toolbarStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, border: '1px solid rgba(148,163,184,.16)', borderRadius: 22, padding: 18, background: 'rgba(15,23,42,.76)', margin: '18px 0', minWidth: 0, flexWrap: 'wrap' as const };
const noticeStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 18, padding: '17px 18px', background: 'rgba(245,197,66,.075)', color: '#fde68a', overflowWrap: 'anywhere' as const, marginBottom: 14, lineHeight: 1.55 };
const emptyStyle = { border: '1px solid rgba(148,163,184,.16)', borderRadius: 18, padding: '20px 18px', background: 'rgba(148,163,184,.06)', color: '#94a3b8', textAlign: 'center' as const, lineHeight: 1.55 };
const buttonBaseStyle = { minHeight: 46, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', padding: '0 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, cursor: 'pointer', maxWidth: '100%', textAlign: 'center' as const, whiteSpace: 'normal' as const, boxShadow: '0 10px 24px rgba(0,0,0,.20)', lineHeight: 1.3 };
const buttonToneStyle = { primary: { background: 'linear-gradient(135deg, #f7d55a, #f5c542)', borderColor: '#f5c542', color: '#111827' }, secondary: { background: 'rgba(23,34,49,.95)', color: '#f8fafc' }, danger: { background: 'rgba(239,68,68,.16)', borderColor: 'rgba(239,68,68,.34)', color: '#fecaca' }, success: { background: 'rgba(34,197,94,.16)', borderColor: 'rgba(34,197,94,.34)', color: '#bbf7d0' } } as const;
const badgeStyle = { display: 'inline-flex', alignItems: 'center', minHeight: 29, borderRadius: 999, padding: '0 12px', fontSize: 12, fontWeight: 950, border: '1px solid rgba(148,163,184,.18)', maxWidth: '100%', overflowWrap: 'anywhere' as const, letterSpacing: '.01em', lineHeight: 1.2 };
const badgeToneStyle = { neutral: { background: 'rgba(148,163,184,.09)', color: '#cbd5e1' }, success: { background: 'rgba(34,197,94,.13)', borderColor: 'rgba(34,197,94,.3)', color: '#bbf7d0' }, warning: { background: 'rgba(245,197,66,.14)', borderColor: 'rgba(245,197,66,.32)', color: '#fde68a' }, danger: { background: 'rgba(239,68,68,.14)', borderColor: 'rgba(239,68,68,.32)', color: '#fecaca' } } as const;
const surfaceToneStyle = { neutral: {}, brand: { borderColor: 'rgba(245,197,66,.28)' }, success: { borderColor: 'rgba(34,197,94,.30)', background: 'linear-gradient(145deg, rgba(20,83,45,.34), rgba(9,14,22,.96))' }, warning: { borderColor: 'rgba(245,197,66,.32)', background: 'linear-gradient(145deg, rgba(113,63,18,.34), rgba(9,14,22,.96))' }, danger: { borderColor: 'rgba(239,68,68,.34)', background: 'linear-gradient(145deg, rgba(127,29,29,.36), rgba(9,14,22,.96))' } } as const;
const commandPanelStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 28, padding: 24, background: 'radial-gradient(circle at top left, rgba(245,197,66,.18), transparent 34%), linear-gradient(145deg, rgba(17,26,36,.98), rgba(9,14,22,.96))', boxShadow: '0 22px 60px rgba(0,0,0,.34)', marginBottom: 18, minWidth: 0, overflow: 'hidden' as const };
const actionStripStyle = { display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(148,163,184,.14)', borderRadius: 20, padding: 16, background: 'rgba(2,6,23,.35)' };
