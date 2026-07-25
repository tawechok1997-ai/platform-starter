import type { ReactNode } from 'react';

export default function ContentCenterLayout({ children }: { children: ReactNode }) {
  return <div className="admin-content-center">{children}</div>;
}
