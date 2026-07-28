import type { ReactNode } from 'react';
import '../components/auth/auth.css';
import '../components/auth/auth-source-login.css';
import '../components/auth/auth-source-register.css';
import '../components/auth/auth-embedded-overlay.css';
import '../components/auth/auth-popup-single-owner.css';

export default function MemberAuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-reference-scope">{children}</div>;
}
