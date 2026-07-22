'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { adminApiFetch, clearAdminSession } from '../admin-api';
import { AdminButton, AdminEmptyState } from '../components/admin-ui';
import { canAccessNavItem, localizedNavGroupDescription, localizedNavGroupTitle, localizedNavTitle, navGroups, requiredPermissionsForPath } from './admin-nav';
import { useAdminLocale, type AdminLocale } from './admin-locale';
import { AdminIcon, iconForAdminHref } from './_components/admin-icon';

const AUTH_TIMEOUT_MS = 12000;

type CurrentAdmin = {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
  roles?: Array<string | { name?: string; code?: string }>;
  permissions?: string[];
};

type AdminSession = {
  permissions: string[];
  admin: CurrentAdmin;
};

type AdminSurface = 'menu' | 'profile' | 'notification' | 'command';
type QuickNavItem = { title: string; href: string };
type AdminNotification = { title: string; detail: string; href: string; tone: 'warning' | 'danger' };
const FAVORITE_NAV_STORAGE_KEY = 'admin_favorite_nav_items';
const RECENT_NAV_STORAGE_KEY = 'admin_recent_nav_items';

const shellCopy = {
  th: {
    workspace: 'พื้นที่ทำงาน', searchMenu: 'ค้นหาเมนู', favorites: 'รายการโปรด', recentlyUsed: 'ใช้ล่าสุด', clear: 'ล้าง', openMenu: 'เปิดเมนูแอดมิน', closeMenu: 'ปิดเมนู', searchCommands: 'ค้นหาคำสั่ง', commandPlaceholder: 'ค้นหาหน้า หรือคำสั่ง...', noCommand: 'ไม่พบคำสั่ง', noCommandDescription: 'ลองค้นหาด้วยชื่ออื่น', notifications: 'การแจ้งเตือน', followUp: 'งานที่ต้องติดตาม', viewAll: 'ดูทั้งหมด', noNotifications: 'ไม่มีงานค้าง', topupsPending: 'มีรายการฝากรอตรวจ', withdrawalsPending: 'มีรายการถอนรอดำเนินการ', risksPending: 'มีเคสความเสี่ยงที่ยังเปิดอยู่', online: 'ออนไลน์', profile: 'โปรไฟล์', security: 'ความปลอดภัยและ 2FA', activity: 'กิจกรรมล่าสุด', logout: 'ออกจากระบบ', collapse: 'ย่อเมนู', expand: 'ขยายเมนู', systemReady: 'ระบบพร้อมใช้งาน', pending: 'รายการรอดำเนินการ', accessDenied: 'ไม่มีสิทธิ์เข้าถึงหน้านี้', accessDeniedDescription: 'กรุณาติดต่อผู้ดูแลสิทธิ์หากจำเป็น', backToDashboard: 'กลับหน้าหลัก', removeFavorite: 'เอาออกจากรายการโปรด', addFavorite: 'เพิ่มในรายการโปรด', language: 'ภาษา', thai: 'ไทย', english: 'อังกฤษ', adminConsole: 'ระบบผู้ดูแล', brandTitle: 'ระบบผู้ดูแล', brandSubtitle: 'ศูนย์ปฏิบัติการ',
  },
  en: {
    workspace: 'Workspace', searchMenu: 'Search menu', favorites: 'Favorites', recentlyUsed: 'Recent', clear: 'Clear', openMenu: 'Open admin menu', closeMenu: 'Close menu', searchCommands: 'Search commands', commandPlaceholder: 'Search pages or commands...', noCommand: 'No commands found', noCommandDescription: 'Try another search', notifications: 'Notifications', followUp: 'Items to review', viewAll: 'View all', noNotifications: 'No pending items', topupsPending: 'Top ups pending review', withdrawalsPending: 'Withdrawals pending review', risksPending: 'Open risk cases', online: 'Online', profile: 'Profile', security: 'Security & 2FA', activity: 'Recent activity', logout: 'Sign out', collapse: 'Collapse menu', expand: 'Expand menu', systemReady: 'System ready', pending: 'pending', accessDenied: 'Access denied', accessDeniedDescription: 'Contact an administrator if you need access', backToDashboard: 'Back to dashboard', removeFavorite: 'Remove from favorites', addFavorite: 'Add to favorites', language: 'Language', thai: 'TH', english: 'EN', adminConsole: 'Admin console', brandTitle: 'Admin console', brandSubtitle: 'Operations workspace',
  },
} as const;

export default function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const lastSurfaceTriggerRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openSurface, setOpenSurface] = useState<AdminSurface | null>(null);
  const [commandQuery, setCommandQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [admin, setAdmin] = useState<CurrentAdmin>({});
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['overview']));
  const [queueCount, setQueueCount] = useState({ topups: 0, withdrawals: 0 });
  const [openRiskCount, setOpenRiskCount] = useState(0);
  const [favoriteHrefs, setFavoriteHrefs] = useState<string[]>([]);
  const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
  const [quickNavLoaded, setQuickNavLoaded] = useState(false);
  const [locale, changeLocale] = useAdminLocale();
  const menuOpen = openSurface === 'menu';
  const profileOpen = openSurface === 'profile';
  const notificationOpen = openSurface === 'notification';
  const commandOpen = openSurface === 'command';
  const copy = shellCopy[locale];

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      setReady(false);
      const session = await verifyAdminSession();
      if (cancelled) return;
      setIsLoggedIn(Boolean(session));
      setPermissions(session?.permissions ?? []);
      setAdmin(session?.admin ?? {});
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
    closeAdminSurface();
    const activeGroup = navGroups.find((group) => group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)));
    if (activeGroup) setOpenGroups((current) => new Set(current).add(activeGroup.id));
  }, [pathname]);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem('admin_sidebar_collapsed') === 'true');
    const storedGroups = window.localStorage.getItem('admin_nav_open_groups');
    if (storedGroups) {
      try {
        const parsed = JSON.parse(storedGroups);
        if (Array.isArray(parsed)) setOpenGroups(new Set(parsed.filter((value): value is string => typeof value === 'string')));
      } catch {
        // Ignore malformed local preferences and use the safe default.
      }
    }
    setFavoriteHrefs(readStoredHrefs(FAVORITE_NAV_STORAGE_KEY));
    setRecentHrefs(readStoredHrefs(RECENT_NAV_STORAGE_KEY));
    setQuickNavLoaded(true);
  }, []);

  useEffect(() => {
    if (!quickNavLoaded) return;
    window.localStorage.setItem(FAVORITE_NAV_STORAGE_KEY, JSON.stringify(favoriteHrefs));
  }, [favoriteHrefs, quickNavLoaded]);

  useEffect(() => {
    if (!quickNavLoaded) return;
    window.localStorage.setItem(RECENT_NAV_STORAGE_KEY, JSON.stringify(recentHrefs));
  }, [recentHrefs, quickNavLoaded]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstFocusable = getFocusableElements(drawerRef.current)[0];
    firstFocusable?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAdminSurface();
      else trapFocus(event, drawerRef.current);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape); };
  }, [menuOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const closeProfileMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && profileMenuRef.current?.contains(event.target as Node)) return;
      closeAdminSurface();
    };
    document.addEventListener('mousedown', closeProfileMenu);
    document.addEventListener('keydown', closeProfileMenu);
    return () => {
      document.removeEventListener('mousedown', closeProfileMenu);
      document.removeEventListener('keydown', closeProfileMenu);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!notificationOpen) return;
    const closeNotificationMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event instanceof MouseEvent && notificationMenuRef.current?.contains(event.target as Node)) return;
      closeAdminSurface();
    };
    document.addEventListener('mousedown', closeNotificationMenu);
    document.addEventListener('keydown', closeNotificationMenu);
    return () => { document.removeEventListener('mousedown', closeNotificationMenu); document.removeEventListener('keydown', closeNotificationMenu); };
  }, [notificationOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggleAdminSurface('command');
      }
      if (event.key === 'Escape') closeAdminSurface();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function loadQueueCount() {
    try {
      const [queueResponse, riskResponse] = await Promise.all([adminApiFetch('/admin/queues/summary'), adminApiFetch('/admin/risk-alerts?status=OPEN&take=1')]);
      const [queueData, riskData] = await Promise.all([queueResponse.json().catch(() => null), riskResponse.json().catch(() => null)]);
      if (queueResponse.ok && queueData) setQueueCount({ topups: Number(queueData.topUps?.count ?? 0), withdrawals: Number(queueData.withdrawals?.count ?? 0) });
      if (riskResponse.ok && riskData) setOpenRiskCount(Number(riskData.summary?.openCount ?? riskData.total ?? 0));
    } catch {
      // Queue counters are supplementary and must never block the admin shell.
    }
  }

  const normalizedQuery = navQuery.trim().toLocaleLowerCase('th');
  const visibleGroups = useMemo(() => navGroups
    .map((group) => ({
      ...group,
      title: localizedNavGroupTitle(group, locale),
      description: localizedNavGroupDescription(group, locale),
      items: group.items.filter((item) => item.sidebar !== false && canAccessNavItem(item, permissions)
        && (!normalizedQuery || `${group.title} ${group.titleEn ?? ''} ${item.title} ${item.titleEn ?? ''}`.toLocaleLowerCase('th').includes(normalizedQuery)))
        .map((item) => ({ ...item, title: localizedNavTitle(item, locale) })),
    }))
    .filter((group) => group.items.length > 0), [locale, permissions, normalizedQuery]);
  const commandItems = useMemo(() => navGroups.flatMap((group) => group.items
    .filter((item) => canAccessNavItem(item, permissions))
    .map((item) => ({ ...item, title: localizedNavTitle(item, locale) }))), [locale, permissions]);
  const favoriteItems = useMemo(() => itemsForHrefs(favoriteHrefs, commandItems), [favoriteHrefs, commandItems]);
  const recentItems = useMemo(() => itemsForHrefs(recentHrefs, commandItems), [recentHrefs, commandItems]);

  const required = requiredPermissionsForPath(pathname);
  const canViewRoute = required.length === 0 || permissions.includes('*') || required.some((permission) => permissions.includes(permission));

  async function logout() {
    try {
      await adminApiFetch('/admin/auth/logout', { method: 'POST' });
    } catch {
      // Clear the local session even when the remote logout request fails.
    }
    clearAdminSession();
    window.location.href = '/login';
  }

  function badgeFor(href: string) {
    if (href === '/topups' && queueCount.topups > 0) return queueCount.topups;
    if (href === '/withdrawals' && queueCount.withdrawals > 0) return queueCount.withdrawals;
    if ((href === '/dashboard' || href === '/operations') && queueCount.topups + queueCount.withdrawals > 0) return queueCount.topups + queueCount.withdrawals;
    return 0;
  }

  function navigate(href: string) {
    closeAdminSurface();
    setCommandQuery('');
    if (commandItems.some((item) => item.href === href)) setRecentHrefs((current) => [href, ...current.filter((value) => value !== href)].slice(0, 5));
    if (href === pathname) return;
    router.push(href);
  }

  function toggleFavorite(href: string) {
    setFavoriteHrefs((current) => current.includes(href) ? current.filter((value) => value !== href) : [...current, href].slice(0, 6));
  }

  function openAdminSurface(surface: AdminSurface, trigger?: HTMLElement) {
    if (trigger) lastSurfaceTriggerRef.current = trigger;
    else if (document.activeElement instanceof HTMLElement) lastSurfaceTriggerRef.current = document.activeElement;
    setOpenSurface(surface);
  }

  function toggleAdminSurface(surface: AdminSurface, trigger?: HTMLElement) {
    if (openSurface === surface) closeAdminSurface(); else openAdminSurface(surface, trigger);
  }

  function closeAdminSurface() {
    setOpenSurface(null);
    const trigger = lastSurfaceTriggerRef.current;
    if (trigger) window.setTimeout(() => trigger.focus(), 0);
  }

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      window.localStorage.setItem('admin_nav_open_groups', JSON.stringify([...next]));
      return next;
    });
  }

  if (!ready || !isLoggedIn) return <main className="admin-loading-screen"><span className="admin-loading-mark">A</span><p>กำลังตรวจสอบสิทธิ์...</p></main>;

  const pendingTotal = queueCount.topups + queueCount.withdrawals;
  const notificationCount = pendingTotal + openRiskCount;
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const notificationCandidates: Array<AdminNotification | null> = [
    queueCount.topups > 0 ? { title: copy.topupsPending, detail: `${queueCount.topups.toLocaleString(numberLocale)} ${copy.pending}`, href: '/topups', tone: 'warning' } : null,
    queueCount.withdrawals > 0 ? { title: copy.withdrawalsPending, detail: `${queueCount.withdrawals.toLocaleString(numberLocale)} ${copy.pending}`, href: '/withdrawals', tone: 'warning' } : null,
    openRiskCount > 0 ? { title: copy.risksPending, detail: `${openRiskCount.toLocaleString(numberLocale)} ${copy.pending}`, href: '/risk-alerts', tone: 'danger' } : null,
  ];
  const notifications = notificationCandidates.filter((item): item is AdminNotification => item !== null);
  const currentItem = navGroups.flatMap((group) => group.items).find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const toggleCollapsed = () => setSidebarCollapsed((current) => { const next = !current; window.localStorage.setItem('admin_sidebar_collapsed', String(next)); return next; });
  const displayName = admin.displayName || [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.username || 'ผู้ดูแลระบบ';
  const roleName = admin.position || roleLabel(admin.roles) || admin.department || 'Admin';
  const environment = process.env.NEXT_PUBLIC_APP_ENV || (process.env.NODE_ENV === 'production' ? 'Production' : 'UAT');
  const initials = getInitials(displayName);

  const avatar = <span className="admin-profile-avatar">{admin.avatarUrl ? <img src={admin.avatarUrl} alt="" /> : initials}</span>;

  const drawer = <aside
    ref={drawerRef}
    id="admin-sidebar"
    className={menuOpen ? 'admin-drawer open' : 'admin-drawer'}
    aria-label="เมนูผู้ดูแล"
    style={menuOpen ? { zIndex: 2, pointerEvents: 'auto' } : undefined}
  >
    <div className="admin-drawer-head">
      <a href="/dashboard" onClick={(event) => { event.preventDefault(); navigate('/dashboard'); }} className="admin-brand-row admin-brand-link"><span className="admin-brand-mark">A</span><span className="admin-brand-text"><strong>{copy.brandTitle}</strong><small>{copy.brandSubtitle}</small></span></a>
      <AdminButton type="button" tone="default" className="admin-drawer-close" onClick={closeAdminSurface} aria-label={copy.closeMenu}><AdminIcon name="close" /></AdminButton>
    </div>
    <div className="admin-nav-search"><AdminIcon name="search" /><input value={navQuery} onChange={(event) => setNavQuery(event.target.value)} placeholder={copy.searchMenu} aria-label={copy.searchMenu} /></div>
    <nav className="admin-drawer-nav" aria-label={copy.workspace}>
      {favoriteItems.length > 0 && <QuickNavSection title={copy.favorites} items={favoriteItems} pathname={pathname} onNavigate={navigate} />}
      {recentItems.length > 0 && <QuickNavSection title={copy.recentlyUsed} items={recentItems} pathname={pathname} onNavigate={navigate} onClear={() => setRecentHrefs([])} clearLabel={copy.clear} />}
      {visibleGroups.map((group) => {
        const containsActiveRoute = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
        const expanded = Boolean(normalizedQuery) || openGroups.has(group.id) || containsActiveRoute;
        const groupIcon = iconForAdminHref(group.items[0]?.href ?? '/dashboard');
        return <section className="admin-nav-group" key={group.id}>
          <button type="button" className="admin-nav-group__trigger" onClick={() => toggleGroup(group.id)} aria-expanded={expanded} aria-controls={`admin-nav-${group.id}`} data-active={containsActiveRoute || undefined} title={sidebarCollapsed ? group.title : undefined}>
            <AdminIcon name={groupIcon} />
            <span className="admin-nav-group__label"><strong>{group.title}</strong>{group.description && <small>{group.description}</small>}</span>
            <span className="admin-nav-group__chevron" aria-hidden="true"><AdminIcon name="chevron-left" /></span>
          </button>
          <div className="admin-nav-submenu" data-open={expanded} id={`admin-nav-${group.id}`}>
            <div className="admin-nav-submenu__inner">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const badge = badgeFor(item.href);
                return <a key={item.href} href={item.href} onClick={(event) => { event.preventDefault(); navigate(item.href); }} className={active ? 'active' : ''} title={sidebarCollapsed ? item.title : undefined} aria-current={active ? 'page' : undefined}><AdminIcon name={iconForAdminHref(item.href)} /><span>{item.title}</span>{badge > 0 && <em>{badge > 99 ? '99+' : badge}</em>}</a>;
              })}
            </div>
          </div>
        </section>;
      })}
      {visibleGroups.length === 0 && <p className="admin-nav-empty">{copy.noCommand}</p>}
    </nav>
    <div className="admin-sidebar-footer">
      <div className="admin-sidebar-profile" ref={profileMenuRef}>
        <button type="button" className="admin-sidebar-profile__trigger" onClick={(event) => toggleAdminSurface('profile', event.currentTarget)} aria-expanded={profileOpen} aria-haspopup="menu" aria-controls="admin-profile-menu">
          {avatar}
          <span className="admin-profile-meta"><strong>{displayName}</strong><span>{roleName}</span></span>
          <span className="admin-profile-status" title={copy.online} aria-label={copy.online} />
          <span className="admin-sidebar-profile__chevron" aria-hidden="true"><AdminIcon name="chevron-left" /></span>
        </button>
        {profileOpen && <div className="admin-profile-menu admin-profile-menu--sidebar" id="admin-profile-menu" role="menu">
          <div className="admin-profile-menu__identity">{avatar}<div><strong>{displayName}</strong><span>@{admin.username || 'admin'}</span><small>{roleName}{admin.department ? ` · ${admin.department}` : ''}</small></div></div>
          <div className="admin-profile-menu__security"><span className="admin-system-dot" />{copy.online}</div>
          <div className="admin-profile-menu__links">
            <button type="button" role="menuitem" onClick={() => navigate('/profile')}><AdminIcon name="user" /><span>{copy.profile}</span></button>
            <button type="button" role="menuitem" onClick={() => navigate('/security')}><AdminIcon name="security" /><span>{copy.security}</span></button>
            <button type="button" role="menuitem" onClick={() => navigate('/activity-center')}><AdminIcon name="activity" /><span>{copy.activity}</span></button>
          </div>
          <button type="button" className="admin-profile-menu__logout" role="menuitem" onClick={logout}><AdminIcon name="logout" /><span>{copy.logout}</span></button>
        </div>}
      </div>
      <AdminButton type="button" tone="default" className="admin-collapse-button" onClick={toggleCollapsed} aria-label={sidebarCollapsed ? copy.expand : copy.collapse}><AdminIcon name="chevron-left" /><span>{sidebarCollapsed ? copy.expand : copy.collapse}</span></AdminButton>
    </div>
  </aside>;

  return <main className={`admin-shell${sidebarCollapsed ? ' admin-shell--collapsed' : ''}`}>
    {menuOpen ? <div style={{ position: 'fixed', inset: 0, zIndex: 1000, isolation: 'isolate' }}>
      <AdminButton type="button" tone="default" className="admin-drawer-backdrop" style={{ zIndex: 0 }} onClick={closeAdminSurface} aria-label={copy.closeMenu} />
      {drawer}
    </div> : drawer}
    <div className="admin-main-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-context"><AdminButton type="button" tone="default" className="admin-menu-button" onClick={(event) => openAdminSurface('menu', event.currentTarget)} aria-label={copy.openMenu} aria-controls="admin-sidebar"><AdminIcon name="menu" /></AdminButton><div><span>{copy.workspace}</span><strong>{currentItem ? localizedNavTitle(currentItem, locale) : copy.adminConsole}</strong></div></div>
        <div className="admin-topbar-actions">
          <button type="button" className="admin-command-trigger" onClick={(event) => openAdminSurface('command', event.currentTarget)} aria-label={copy.searchCommands} aria-controls="admin-command-dialog"><AdminIcon name="search" /><span>{copy.searchCommands}</span><kbd>⌘ K</kbd></button>
          <div className="admin-language-toggle" role="group" aria-label={copy.language}><button type="button" onClick={() => changeLocale('th')} aria-pressed={locale === 'th'}>{copy.thai}</button><button type="button" onClick={() => changeLocale('en')} aria-pressed={locale === 'en'}>{copy.english}</button></div>
          <span className={`admin-environment-badge admin-environment-badge--${environment.toLowerCase()}`}>{environment}</span>
          <div className="admin-topbar-status"><span className="admin-system-dot" />{copy.systemReady}{pendingTotal > 0 && <a href="/operations" onClick={(event) => { event.preventDefault(); navigate('/operations'); }}>{pendingTotal.toLocaleString(numberLocale)} {copy.pending}</a>}</div>
          <div className="admin-notification-menu" ref={notificationMenuRef}>
            <button type="button" className="admin-notification-trigger" onClick={(event) => toggleAdminSurface('notification', event.currentTarget)} aria-label={copy.notifications} aria-expanded={notificationOpen} aria-haspopup="menu" aria-controls="admin-notification-menu"><AdminIcon name="bell" />{notificationCount > 0 && <em>{notificationCount > 99 ? '99+' : notificationCount}</em>}</button>
            {notificationOpen && <div className="admin-notification-popover" id="admin-notification-menu" role="menu"><header><div><strong>{copy.notifications}</strong><span>{copy.followUp}</span></div><button type="button" onClick={() => navigate('/operations')}>{copy.viewAll}</button></header>{notifications.length ? <div>{notifications.map((item) => <button type="button" key={item.href} role="menuitem" data-tone={item.tone} onClick={() => navigate(item.href)}><AdminIcon name={item.tone === 'danger' ? 'risk' : 'money'} /><span><strong>{item.title}</strong><small>{item.detail}</small></span></button>)}</div> : <p>{copy.noNotifications}</p>}</div>}
          </div>
        </div>
      </header>
      <section className="admin-content-shell">{canViewRoute ? children : <AccessDenied locale={locale} />}</section>
      {commandOpen && <CommandPalette locale={locale} query={commandQuery} onQueryChange={setCommandQuery} items={commandItems} favoriteHrefs={favoriteHrefs} onToggleFavorite={toggleFavorite} onNavigate={navigate} onClose={() => { closeAdminSurface(); setCommandQuery(''); }} />}
    </div>
  </main>;
}

function QuickNavSection({ title, items, pathname, onNavigate, onClear, clearLabel }: { title: string; items: QuickNavItem[]; pathname: string; onNavigate: (href: string) => void; onClear?: () => void; clearLabel?: string }) {
  return <section className="admin-quick-nav" aria-label={title}><header><span>{title}</span>{onClear && <button type="button" onClick={onClear}>{clearLabel ?? 'Clear'}</button>}</header>{items.map((item) => { const active = pathname === item.href || pathname.startsWith(`${item.href}/`); return <a key={item.href} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={(event) => { event.preventDefault(); onNavigate(item.href); }}><AdminIcon name={iconForAdminHref(item.href)} /><span>{item.title}</span></a>; })}</section>;
}

function CommandPalette({ locale, query, onQueryChange, items, favoriteHrefs, onToggleFavorite, onNavigate, onClose }: { locale: AdminLocale; query: string; onQueryChange: (value: string) => void; items: QuickNavItem[]; favoriteHrefs: string[]; onToggleFavorite: (href: string) => void; onNavigate: (href: string) => void; onClose: () => void }) {
  const copy = shellCopy[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const normalized = query.trim().toLocaleLowerCase('th');
  const matches = items.filter((item) => !normalized || `${item.title} ${item.href}`.toLocaleLowerCase('th').includes(normalized)).slice(0, 10);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return <div className="admin-command-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-command-dialog" id="admin-command-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-label={copy.searchCommands} onKeyDown={(event) => trapFocus(event, dialogRef.current)}>
      <div className="admin-command-search"><AdminIcon name="search" /><input ref={inputRef} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={copy.commandPlaceholder} aria-label={copy.searchCommands} /><kbd>Esc</kbd></div>
      <div className="admin-command-results">{matches.length ? matches.map((item) => <div className="admin-command-result" key={item.href}><button type="button" onClick={() => onNavigate(item.href)}><AdminIcon name={iconForAdminHref(item.href)} /><span><strong>{item.title}</strong><small>{item.href}</small></span></button><button type="button" className={favoriteHrefs.includes(item.href) ? 'admin-command-result__favorite active' : 'admin-command-result__favorite'} onClick={() => onToggleFavorite(item.href)} aria-label={`${favoriteHrefs.includes(item.href) ? copy.removeFavorite : copy.addFavorite}: ${item.title}`} title={favoriteHrefs.includes(item.href) ? copy.removeFavorite : copy.addFavorite}><AdminIcon name="star" /></button></div>) : <AdminEmptyState title={copy.noCommand} description={copy.noCommandDescription} />}</div>
    </section>
  </div>;
}

function AccessDenied({ locale }: { locale: AdminLocale }) {
  const copy = shellCopy[locale];
  return (
    <div className="admin-access-denied">
      <AdminEmptyState
        className="admin-access-denied__state"
        icon={<AdminIcon name="security" />}
        title={copy.accessDenied}
        description={copy.accessDeniedDescription}
        actionHref="/dashboard"
        actionLabel={copy.backToDashboard}
      />
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  return parts.slice(0, 2).map((part) => part.slice(0, 1).toLocaleUpperCase('th')).join('');
}

function roleLabel(roles: CurrentAdmin['roles']) {
  const first = roles?.[0];
  if (typeof first === 'string') return first;
  return first?.name || first?.code || '';
}

function readStoredHrefs(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
}

function itemsForHrefs(hrefs: string[], items: readonly QuickNavItem[]) {
  const byHref = new Map(items.map((item) => [item.href, item]));
  return hrefs.map((href) => byHref.get(href)).filter((item): item is QuickNavItem => Boolean(item));
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
    .filter((element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0);
}

function trapFocus(event: { key: string; shiftKey: boolean; preventDefault: () => void }, container: HTMLElement | null) {
  if (event.key !== 'Tab') return;
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

async function verifyAdminSession(): Promise<AdminSession | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const res = await adminApiFetch('/admin/auth/me', { signal: controller.signal });
    const data = await res.json().catch(() => null) as CurrentAdmin | null;
    if (res.ok && data) return { permissions: Array.isArray(data.permissions) ? data.permissions : [], admin: data };
    clearAdminSession();
    return null;
  } catch {
    clearAdminSession();
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
