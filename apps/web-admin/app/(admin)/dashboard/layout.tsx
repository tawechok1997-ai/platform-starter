import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        .admin-dashboard .admin-ui-page > .admin-ui-card {
          order: 20;
        }

        .admin-dashboard .admin-ui-page > .admin-ui-card:has(> .admin-ui-card__head a[href="/risk-alerts"]) {
          order: 10;
        }

        .admin-dashboard .admin-ui-page > .admin-dashboard__quick,
        .admin-dashboard .admin-ui-page > .admin-dashboard__sections,
        .admin-dashboard .admin-ui-page > .admin-ui-grid {
          order: 30;
        }
      `}</style>
      {children}
    </>
  );
}
