import Link from 'next/link';
import type { ReactNode } from 'react';
import { PublicPageShell } from './public-page-shell';

export function PublicStatusPage({ eyebrow, title, description, children, primaryHref = '/?auth=login', primaryLabel = 'เข้าสู่ระบบ' }: { eyebrow: string; title: string; description: string; children?: ReactNode; primaryHref?: string; primaryLabel?: string }) {
  return (
    <PublicPageShell>
      <main className="public-status-page">
        <section className="public-status-card">
          <span className="public-status-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          {children && <div className="public-status-content">{children}</div>}
          <div className="public-status-actions">
            <Link className="public-status-primary" href={primaryHref}>{primaryLabel}</Link>
            <Link className="public-status-secondary" href="/">หน้าแรก</Link>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
