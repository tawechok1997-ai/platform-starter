'use client';

import type { ReactNode } from 'react';
import { useBrandRuntime } from '../../brand/brand-context';

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
      className={`public-auth-shell auth-brand-shell ${className}`.trim()}
      data-auth-mode={mode}
      data-brand-code={brand.code}
      data-brand-ready={ready ? 'true' : 'false'}
      style={brand.themeStyle}
    >
      {aside}
      <section className="auth-brand-shell__content">
        <header className="auth-brand-shell__brand" aria-label={brand.name}>
          {logo ? <img src={logo} alt={brand.name} /> : <span aria-hidden="true">{brand.name.slice(0, 1).toUpperCase()}</span>}
          <div>
            <strong>{brand.name}</strong>
            {brand.description && <small>{brand.description}</small>}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
