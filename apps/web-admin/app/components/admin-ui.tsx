import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { uiClasses } from '../../../../packages/ui-core/src/index';

type Tone = 'default' | 'brand' | 'success' | 'warning' | 'danger';

const buttonPrimitiveByTone: Record<Tone, string> = {
  default: uiClasses.button.secondary,
  brand: uiClasses.button.primary,
  success: uiClasses.button.primary,
  warning: uiClasses.button.secondary,
  danger: uiClasses.button.danger,
};

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

export function AdminCard({
  children,
  className,
  elevated = false,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode; elevated?: boolean }) {
  return (
    <section
      {...props}
      className={classes(
        uiClasses.surface.base,
        elevated && uiClasses.surface.elevated,
        'admin-ui-card',
        elevated && 'admin-ui-card--elevated',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminNotice({
  children,
  tone = 'default',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; tone?: Tone }) {
  return (
    <div {...props} className={classes('admin-ui-notice', `admin-ui-notice--${tone}`, className)}>
      {children}
    </div>
  );
}

export function AdminButton({
  children,
  tone = 'brand',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button
      {...props}
      className={classes(buttonPrimitiveByTone[tone], 'admin-ui-button', `admin-ui-button--${tone}`, className)}
    >
      {children}
    </button>
  );
}

export function AdminLinkButton({
  children,
  tone = 'brand',
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; tone?: Tone }) {
  return (
    <a
      {...props}
      className={classes(buttonPrimitiveByTone[tone], 'admin-ui-button', `admin-ui-button--${tone}`, className)}
    >
      {children}
    </a>
  );
}

export function AdminEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  compact = false,
  className,
  icon,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <AdminCard className={classes('admin-ui-empty', compact && 'admin-ui-empty--compact', className)}>
      <div>
        {icon}
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionHref && actionLabel ? <AdminLinkButton href={actionHref}>{actionLabel}</AdminLinkButton> : null}
    </AdminCard>
  );
}
