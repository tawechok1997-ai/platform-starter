'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { adminApiFetch, clearAdminSession } from '../admin-api';
import { navGroups } from './admin-nav';

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [queueCount, setQueueCount] = useState({ topups: 0, withdrawals: 0 });

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      setReady(false);
      const ok = await verifyAdminSession();
      if (cancelled) return;
      setIsLoggedIn(ok);
      setReady(true);
      if (!ok) {
        const next = encodeURIComponent(`${pathname}${window.location.search}`);
        window.location.replace(`/login?next=${next}`);
        return;
      }
      await loadQueueCount();
    }
    checkAuth();
    const interval = window.setInterval(loadQueueCount, 60000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [pathname]);

  async function loadQueueCount() {
    const res = await adminApiFetch('/admin/queues/summary');
    const data = await res.json().catch(() => null);
    if (res.ok && data) setQueueCount({ topups: Number(data.topUps?.count ?? 0), withdrawals: Number(data.withdrawals?.count ?? 0) });
  }

  function logout() { clearAdminSession(); window.location.href = '/login'; }
  function badgeFor(href: string) { if (href === '/topups' && queueCount.topups > 0) return queueCount.topups; if (href === '/withdrawals' && queueCount.withdrawals > 0) return queueCount.withdrawals; if (href === '/dashboard' && queueCount.topups + queueCount.withdrawals > 0) return queueCount.topups + queueCount.withdrawals; return 0; }
  if (!ready || !isLoggedIn) return <main className="admin-shell" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', color: '#fff' }}>กำลังตรวจสอบสิทธิ์...</main>;

  return <main className="admin-shell admin-shell-drawer-mode"><header className="admin-topbar"><a href="/dashboard" className="admin-brand-row admin-brand-link"><span className="admin-brand-mark">A</span><span className="admin-brand-text"><strong>Admin Console</strong><small>{queueCount.topups + queueCount.withdrawals > 0 ? `${queueCount.topups + queueCount.withdrawals} pending` : 'Dashboard'}</small></span></a><button type="button" className="admin-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนูแอดมิน">☰</button></header>{menuOpen && <button type="button" className="admin-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}<aside className={menuOpen ? 'admin-drawer open' : 'admin-drawer'}><div className="admin-drawer-head"><div><strong>Admin Console</strong><p>{queueCount.topups} topups · {queueCount.withdrawals} withdrawals</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div><nav className="admin-drawer-nav" aria-label="Admin navigation">{navGroups.map((group) => <section key={group.title} style={{ display: 'grid', gap: 8, background: 'transparent', border: 0, padding: 0 }}><p style={{ margin: '8px 4px 2px', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,.46)' }}>{group.title}</p>{group.items.map(([title, href]) => { const active = pathname === href || pathname.startsWith(`${href}/`); const badge = badgeFor(href); return <a key={href} href={href} onClick={() => setMenuOpen(false)} className={active ? 'active' : ''}><span>{title}</span>{badge > 0 && <em>{badge}</em>}</a>; })}</section>)}</nav><button type="button" className="admin-logout-button" onClick={logout}>ออกจากระบบ</button></aside><section className="admin-content-shell">{children}</section></main>;
}

async function verifyAdminSession() {
  if (!window.localStorage.getItem('admin_access_token') && !window.localStorage.getItem('admin_refresh_token')) return false;
  const res = await adminApiFetch('/admin/queues/summary');
  if (res.ok) return true;
  clearAdminSession();
  return false;
}
