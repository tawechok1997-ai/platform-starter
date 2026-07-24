import type { ReactNode } from 'react';
import '../components/auth/auth.css';
import '../components/auth/auth-reference-final.css';
import '../components/auth/auth-popup-balance.css';

export default function MemberAuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-reference-scope">{children}</div>;
}
