import type { ReactNode } from 'react';

export function PublicStatusPage({ eyebrow, title, description, children, primaryHref = '/login', primaryLabel = 'เข้าสู่ระบบ' }: { eyebrow: string; title: string; description: string; children?: ReactNode; primaryHref?: string; primaryLabel?: string }) {
  return <main className="public-status-page">
    <section className="public-status-card">
      <span className="public-status-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {children && <div className="public-status-content">{children}</div>}
      <div className="public-status-actions">
        <a className="public-status-primary" href={primaryHref}>{primaryLabel}</a>
        <a className="public-status-secondary" href="/">หน้าแรก</a>
      </div>
    </section>
  </main>;
}
