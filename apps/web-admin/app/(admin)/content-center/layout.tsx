import type { ReactNode } from 'react';
import '../../admin-modern-content-center.css';

export default function ContentCenterLayout({ children }: { children: ReactNode }) {
  return <div className="admin-content-center">{children}</div>;
}
