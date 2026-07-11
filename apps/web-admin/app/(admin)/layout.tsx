'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { adminApiFetch, clearAdminSession } from '../admin-api';
import { canAccessNavItem, navGroups, requiredPermissionsForPath } from './admin-nav';
import { AdminIcon, iconForAdminHref } from './_components/admin-icon';

const AUTH_TIMEOUT_MS = 12000;

type CurrentAdmin = { permissions?: string[] };

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [queueCount, setQueueCount] = useState({ topups: 0, withdrawals: 0 });

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      setReady(false);
      const session = await verifyAdminSession();
      if (cancelled) return;
      setIsLoggedIn(Boolean(session));
      setPermissions(session?.permissions ?? []);
      setReady(true);
      if (!session) {
        const next = encodeURIComponent(`${pathname}${window.location.search}`);
        window.location.replace(`/login?next=${next}`);
        return;
      }
      void loadQueueCount();
    }
    void checkAuth();
    const interval = window.setInterval(() => { void loadQueueCount(); }, 60000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem('admin_sidebar_collapsed') === 'true');
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape); };
  }, [menuOpen]);

  async function loadQueueCount() {
    try {
      const res = await adminApiFetch('/admin/queues/summary');
      const data = await res.json().catch(() => null);
      if (res.ok && data) setQueueCount({ topups: Number(data.topUps?.count ?? 0), withdrawals: Number(data.withdrawals?.count ?? 0) });
    } catch {
      // Queue counters are supplementary and must never block the admin shell.
    }
  }

  const visibleGroups = useMemo(() => navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => canAccessNavItem(item, permissions) && (!navQuery.trim() || item.title.toLocaleLowerCase('th').includes(navQuery.trim().toLocaleLowerCase('th')))) }))
    .filter((group) => group.items.length > 0), [permissions, navQuery]);

  const required = requiredPermissionsForPath(pathname);
  const canViewRoute = required.length === 0 || permissions.includes('*') || required.some((permission) => permissions.includes(permission));

  function logout() { clearAdminSession(); window.location.href = '/login'; }
  function badgeFor(href: string) { if (href === '/topups' && queueCount.topups > 0) return queueCount.topups; if (href === '/withdrawals' && queueCount.withdrawals > 0) return queueCount.withdrawals; if (href === '/dashboard' && queueCount.topups + queueCount.withdrawals > 0) return queueCount.topups + queueCount.withdrawals; return 0; }
  if (!ready || !isLoggedIn) return <main className="admin-loading-screen"><span className="admin-loading-mark">A</span><p>กำลังตรวจสอบสิทธิ์...</p></main>;

  const pendingTotal = queueCount.topups + queueCount.withdrawals;
  const currentItem = navGroups.flatMap((group) => group.items).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const toggleCollapsed = () => setSidebarCollapsed((current) => { const next = !current; window.localStorage.setItem('admin_sidebar_collapsed', String(next)); return next; });

  return <main className={`admin-shell${sidebarCollapsed ? ' admin-shell--collapsed' : ''}`}>
    {menuOpen && <button type="button" className="admin-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}
    <aside className={menuOpen ? 'admin-drawer open' : 'admin-drawer'} aria-label="เมนูผู้ดูแล">
      <div className="admin-drawer-head">
        <a href="/dashboard" className="admin-brand-row admin-brand-link"><span className="admin-brand-mark">A</span><span className="admin-brand-text"><strong>Admin Console</strong><small>Operations workspace</small></span></a>
        <button type="button" className="admin-drawer-close" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู"><AdminIcon name="close" /></button>
      </div>
      <div className="admin-nav-search"><AdminIcon name="search" /><input value={navQuery} onChange={(event) => setNavQuery(event.target.value)} placeholder="ค้นหาเมนู" aria-label="ค้นหาเมนู" /></div>
      <nav className="admin-drawer-nav" aria-label="Admin navigation">
        {visibleGroups.map((group) => <section className="admin-nav-group" key={group.title}><p>{group.title}</p>{group.items.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); const badge = badgeFor(item.href); return <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={active ? 'active' : ''} title={sidebarCollapsed ? item.title : undefined} aria-current={active ? 'page' : undefined}><AdminIcon name={iconForAdminHref(item.href)} /><span>{item.title}</span>{badge > 0 && <em>{badge > 99 ? '99+' : badge}</em>}</a>; })}</section>)}
        {visibleGroups.length === 0 && <p className="admin-nav-empty">ไม่พบเมนูที่ค้นหา</p>}
      </nav>
      <div className="admin-sidebar-footer"><button type="button" className="admin-collapse-button" onClick={toggleCollapsed} aria-label={sidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}><AdminIcon name="chevron-left" /><span>{sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}</span></button><button type="button" className="admin-logout-button" onClick={logout}><AdminIcon name="logout" /><span>ออกจากระบบ</span></button></div>
    </aside>
    <div className="admin-main-shell">
      <header className="admin-topbar"><div className="admin-topbar-context"><button type="button" className="admin-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนูแอดมิน"><AdminIcon name="menu" /></button><div><span>Workspace</span><strong>{currentItem?.title ?? 'Admin Console'}</strong></div></div><div className="admin-topbar-status"><span className="admin-system-dot" />ระบบพร้อมใช้งาน{pendingTotal > 0 && <a href="/operations">{pendingTotal} รายการรอดำเนินการ</a>}</div></header>
      <section className="admin-content-shell">{canViewRoute ? children : <AccessDenied />}</section>
    </div>
  </main>;
}

function AccessDenied() {
  return <div className="admin-access-denied"><div><AdminIcon name="security" /><strong>ไม่มีสิทธิ์เข้าถึงหน้านี้</strong><p>เมนูนี้ถูกซ่อนและบล็อกตามสิทธิ์ของบัญชีผู้ดูแล กรุณาติดต่อผู้ดูแลสิทธิ์หากจำเป็นต้องใช้งาน</p><a href="/dashboard">กลับไป Dashboard</a></div></div>;
}

async function verifyAdminSession(): Promise<{ permissions: string[] } | null> {
  if (!window.localStorage.getItem('admin_access_token') && !window.localStorage.getItem('admin_refresh_token')) return null;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const res = await adminApiFetch('/admin/auth/me', { signal: controller.signal });
    const data = await res.json().catch(() => null) as CurrentAdmin | null;
    if (res.ok) return { permissions: Array.isArray(data?.permissions) ? data.permissions : [] };
    clearAdminSession();
    return null;
  } catch {
    clearAdminSession();
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
