'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminApiFetch, clearAdminSession } from '../admin-api';
import { canAccessNavItem, navGroups, requiredPermissionsForPath } from './admin-nav';

const AUTH_TIMEOUT_MS = 12000;

type CurrentAdmin = { permissions?: string[] };

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [queueCount, setQueueCount] = useState({ topups: 0, withdrawals: 0 });
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasMenuOpenRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const syncLayout = () => setIsDesktopLayout(media.matches);
    syncLayout();
    media.addEventListener('change', syncLayout);
    return () => media.removeEventListener('change', syncLayout);
  }, []);

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
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (isDesktopLayout || menuOpen) drawer.removeAttribute('inert');
    else drawer.setAttribute('inert', '');
  }, [isDesktopLayout, menuOpen]);

  useEffect(() => {
    if (!menuOpen || isDesktopLayout) return;
    drawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDesktopLayout, menuOpen]);

  useEffect(() => {
    if (!menuOpen && wasMenuOpenRef.current && !isDesktopLayout) menuButtonRef.current?.focus();
    wasMenuOpenRef.current = menuOpen;
  }, [isDesktopLayout, menuOpen]);

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
    .map((group) => ({ ...group, items: group.items.filter((item) => canAccessNavItem(item, permissions)) }))
    .filter((group) => group.items.length > 0), [permissions]);

  const required = requiredPermissionsForPath(pathname);
  const canViewRoute = required.length === 0 || permissions.includes('*') || required.some((permission) => permissions.includes(permission));

  function logout() { clearAdminSession(); window.location.href = '/login'; }
  function badgeFor(href: string) { if (href === '/topups' && queueCount.topups > 0) return queueCount.topups; if (href === '/withdrawals' && queueCount.withdrawals > 0) return queueCount.withdrawals; if (href === '/dashboard' && queueCount.topups + queueCount.withdrawals > 0) return queueCount.topups + queueCount.withdrawals; return 0; }
  if (!ready || !isLoggedIn) return <main className="admin-shell admin-loading-screen"><div className="admin-loading-card" role="status" aria-live="polite"><span className="admin-loading-spinner" aria-hidden="true" />กำลังตรวจสอบสิทธิ์...</div></main>;

  return <main className="admin-shell admin-shell-drawer-mode"><header className="admin-topbar"><Link href="/dashboard" className="admin-brand-row admin-brand-link"><span className="admin-brand-mark">A</span><span className="admin-brand-text"><strong>Admin Console</strong><small>{queueCount.topups + queueCount.withdrawals > 0 ? `${queueCount.topups + queueCount.withdrawals} pending` : 'Dashboard'}</small></span></Link><button ref={menuButtonRef} type="button" className="admin-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนูแอดมิน" aria-expanded={menuOpen} aria-controls="admin-navigation-drawer">☰</button></header>{menuOpen && <button type="button" className="admin-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}<aside ref={drawerRef} id="admin-navigation-drawer" className={menuOpen ? 'admin-drawer open' : 'admin-drawer'} aria-hidden={!isDesktopLayout && !menuOpen ? true : undefined} aria-label="เมนูแอดมิน" role={!isDesktopLayout ? 'dialog' : undefined} aria-modal={!isDesktopLayout && menuOpen ? true : undefined}><div className="admin-drawer-head"><div><strong>Admin Console</strong><p>{queueCount.topups} topups · {queueCount.withdrawals} withdrawals</p></div><button ref={drawerCloseRef} type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div><nav className="admin-drawer-nav" aria-label="Admin navigation">{visibleGroups.map((group) => <section key={group.title} className="admin-nav-group"><p className="admin-nav-group-title">{group.title}</p>{group.items.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); const badge = badgeFor(item.href); return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}><span>{item.title}</span>{badge > 0 && <em>{badge}</em>}</Link>; })}</section>)}</nav><button type="button" className="admin-logout-button" onClick={logout}>ออกจากระบบ</button></aside><section className="admin-content-shell">{canViewRoute ? children : <AccessDenied />}</section></main>;
}

function AccessDenied() {
  return <div className="admin-access-denied"><div><strong>ไม่มีสิทธิ์เข้าถึงหน้านี้</strong><p>เมนูนี้ถูกซ่อนและบล็อกตามสิทธิ์ของบัญชีผู้ดูแล กรุณาติดต่อผู้ดูแลสิทธิ์หากจำเป็นต้องใช้งาน</p><Link href="/dashboard">กลับไป Dashboard</Link></div></div>;
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
