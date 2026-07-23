import type { ReactNode } from 'react';
import '../components/auth/auth.css';

export default function MemberAuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-reference-scope">{children}</div>;
}
