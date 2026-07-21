import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
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

export function adminButtonClassName(tone: Tone, className?: string) {
  return classes(buttonPrimitiveByTone[tone], 'admin-ui-button', `admin-ui-button--${tone}`, className);
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

export const AdminButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }
>(function AdminButton({ children, tone = 'brand', className, ...props }, ref) {
  return (
    <button ref={ref} {...props} className={adminButtonClassName(tone, className)}>
      {children}
    </button>
  );
});

export const AdminLinkButton = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; tone?: Tone }
>(function AdminLinkButton({ children, tone = 'brand', className, ...props }, ref) {
  return (
    <a ref={ref} {...props} className={adminButtonClassName(tone, className)}>
      {children}
    </a>
  );
});

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
