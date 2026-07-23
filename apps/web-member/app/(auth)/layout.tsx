import type { ReactNode } from 'react';
import '../components/auth/auth-reference-contract.css';
import '../components/auth/auth-visual-polish.css';

export default function MemberAuthLayout({ children }: { children: ReactNode }) {
  return <div className="auth-reference-scope">{children}</div>;
}
