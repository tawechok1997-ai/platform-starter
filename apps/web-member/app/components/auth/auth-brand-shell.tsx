'use client';

import type { ReactNode } from 'react';
import { useBrandRuntime } from '../../brand/brand-context';
import styles from './auth-brand-shell.module.css';

type AuthMode = 'login' | 'register';

type AuthBrandShellProps = {
  mode: AuthMode;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
};

/**
 * Presentation-only shell for member authentication pages.
 * It deliberately owns no submit, session, validation, captcha, or redirect
 * behavior, so existing auth flows can migrate without changing contracts.
 */
export function AuthBrandShell({ mode, children, aside, className = '' }: AuthBrandShellProps) {
  const { brand, ready } = useBrandRuntime();
  const logo = mode === 'login'
    ? brand.assets.logoLogin || brand.assets.logoHorizontal || brand.assets.logo
    : brand.assets.logoRegister || brand.assets.logoHorizontal || brand.assets.logo;

  return (
    <main
      className={`public-auth-shell auth-brand-shell ${styles.shell} ${className}`.trim()}
      data-auth-mode={mode}
      data-brand-code={brand.code}
      data-brand-ready={ready ? 'true' : 'false'}
      style={brand.themeStyle}
    >
      {aside}
      <section className={`auth-brand-shell__content ${styles.content}`}>
        <header className={`auth-brand-shell__brand ${styles.brand}`} aria-label={brand.name}>
          {logo ? (
            // Runtime branding may point to an administrator-configured external asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={brand.name} />
          ) : (
            <span className={styles.brandMark} aria-hidden="true">
              {brand.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className={styles.brandCopy}>
            <strong>{brand.name}</strong>
            {brand.description && <small>{brand.description}</small>}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
