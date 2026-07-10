import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'default' | 'brand' | 'success' | 'warning' | 'danger';

export function MemberCard({ children, className = '', tone = 'default' }: { children: ReactNode; className?: string; tone?: Tone }) {
  return <section className={`member-ui-card member-ui-card--${tone} ${className}`.trim()}>{children}</section>;
}

export function MemberNotice({ children, tone = 'default', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <div className={`member-ui-notice member-ui-notice--${tone} ${className}`.trim()}>{children}</div>;
}

export function MemberButton({ children, className = '', tone = 'brand', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button {...props} className={`member-ui-button member-ui-button--${tone} ${className}`.trim()}>{children}</button>;
}

export function MemberLinkButton({ children, href, className = '', tone = 'brand' }: { children: ReactNode; href: string; className?: string; tone?: Tone }) {
  return <a href={href} className={`member-ui-button member-ui-button--${tone} ${className}`.trim()}>{children}</a>;
}

export function MemberEmptyState({ title, description, actionHref, actionLabel, compact = false }: { title: string; description: string; actionHref?: string; actionLabel?: string; compact?: boolean }) {
  return <div className={`member-ui-empty${compact ? ' member-ui-empty--compact' : ''}`}>
    <div><strong>{title}</strong><span>{description}</span></div>
    {actionHref && actionLabel && <MemberLinkButton href={actionHref}>{actionLabel}</MemberLinkButton>}
  </div>;
}
