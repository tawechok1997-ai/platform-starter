'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch, clearAdminSession } from './admin-api';
import { AdminIcon } from './(admin)/_components/admin-icon';
import { useAdminLocale } from './(admin)/admin-locale';

type MobileAdmin = {
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
  roles?: Array<string | { name?: string; code?: string }>;
};

const copyByLocale = {
  th: {
    online: 'ออนไลน์',
    profile: 'โปรไฟล์',
    security: 'ความปลอดภัย',
    logout: 'ออกจากระบบ',
    close: 'ย้อนกลับ',
    expandMenu: 'ขยายเมนู',
    collapseMenu: 'ย่อเมนู',
    language: 'ภาษา',
    fallbackName: 'ผู้ดูแลระบบ',
    fallbackRole: 'ผู้ดูแล',
  },
  en: {
    online: 'Online',
    profile: 'Profile',
    security: 'Security',
    logout: 'Sign out',
    close: 'Back',
    expandMenu: 'Expand menu',
    collapseMenu: 'Collapse menu',
    language: 'Language',
    fallbackName: 'Administrator',
    fallbackRole: 'Admin',
  },
} as const;

export function AdminMobileDrawerController() {
  const [locale, changeLocale] = useAdminLocale();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState<MobileAdmin>({});
  const [loggingOut, setLoggingOut] = useState(false);
  const copy = copyByLocale[locale];

  useEffect(() => {
    let observer: MutationObserver | null = null;
    let retryId = 0;

    const attach = () => {
      const drawer = document.getElementById('admin-sidebar');
      if (!drawer) {
        retryId = window.setTimeout(attach, 120);
        return;
      }
      const sync = () => setOpen(drawer.classList.contains('open'));
      sync();
      observer = new MutationObserver(sync);
      observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
    };

    attach();
    return () => {
      observer?.disconnect();
      window.clearTimeout(retryId);
    };
  }, []);

  useEffect(() => {
    let shellObserver: MutationObserver | null = null;
    let retryId = 0;

    const attach = () => {
      const shell = document.querySelector<HTMLElement>('.admin-shell');
      const menuButton = document.querySelector<HTMLButtonElement>('.admin-menu-button');
      if (!shell || !menuButton) {
        retryId = window.setTimeout(attach, 120);
        return;
      }

      const syncButtonState = () => {
        const collapsed = shell.classList.contains('admin-shell--collapsed');
        menuButton.setAttribute('aria-expanded', String(!collapsed));
        menuButton.setAttribute('aria-label', collapsed ? copy.expandMenu : copy.collapseMenu);
        menuButton.title = collapsed ? copy.expandMenu : copy.collapseMenu;
      };

      syncButtonState();
      shellObserver = new MutationObserver(syncButtonState);
      shellObserver.observe(shell, { attributes: true, attributeFilter: ['class'] });
    };

    const expandSidebar = () => {
      const shell = document.querySelector<HTMLElement>('.admin-shell');
      if (!shell?.classList.contains('admin-shell--collapsed')) return false;
      document.querySelector<HTMLButtonElement>('.admin-collapse-button')?.click();
      return true;
    };

    const handleDesktopInteractions = (event: MouseEvent) => {
      if (window.matchMedia('(max-width: 820px)').matches) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const menuButton = target.closest<HTMLButtonElement>('.admin-menu-button');
      if (menuButton) {
        const collapseButton = document.querySelector<HTMLButtonElement>('.admin-collapse-button');
        if (!collapseButton) return;
        event.preventDefault();
        event.stopPropagation();
        collapseButton.click();
        return;
      }

      const search = target.closest<HTMLElement>('.admin-nav-search');
      if (search && expandSidebar()) {
        window.setTimeout(() => search.querySelector<HTMLInputElement>('input')?.focus(), 180);
        return;
      }

      const groupTrigger = target.closest<HTMLButtonElement>('.admin-nav-group__trigger');
      if (groupTrigger && expandSidebar()) {
        event.preventDefault();
        event.stopPropagation();
        window.setTimeout(() => groupTrigger.click(), 180);
      }
    };

    attach();
    document.addEventListener('click', handleDesktopInteractions, true);
    return () => {
      shellObserver?.disconnect();
      window.clearTimeout(retryId);
      document.removeEventListener('click', handleDesktopInteractions, true);
    };
  }, [copy.collapseMenu, copy.expandMenu]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void adminApiFetch('/admin/auth/me')
      .then(async (response) => response.ok ? response.json().catch(() => null) : null)
      .then((data) => {
        if (!cancelled && data && typeof data === 'object') setAdmin(data as MobileAdmin);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [open]);

  const displayName = useMemo(() => admin.displayName || [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.username || copy.fallbackName, [admin, copy.fallbackName]);
  const roleName = useMemo(() => admin.position || roleLabel(admin.roles) || admin.department || copy.fallbackRole, [admin, copy.fallbackRole]);
  const initials = getInitials(displayName);

  function closeMenu() {
    const closeButton = document.querySelector<HTMLButtonElement>('#admin-sidebar .admin-drawer-close');
    if (closeButton) {
      closeButton.click();
      return;
    }
    document.querySelector<HTMLButtonElement>('.admin-drawer-backdrop')?.click();
  }

  function navigate(href: string) {
    closeMenu();
    window.location.href = href;
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await adminApiFetch('/admin/auth/logout', { method: 'POST' });
    } catch {
      // Local session still has to be cleared when the remote request fails.
    } finally {
      clearAdminSession();
      window.location.href = '/login';
    }
  }

  if (!open) return null;

  return <div className="admin-mobile-drawer-controller" aria-label="Mobile admin menu controls">
    <header className="admin-mobile-drawer-controller__header">
      <button type="button" className="admin-mobile-drawer-controller__identity" onClick={() => navigate('/profile')}>
        <span className="admin-mobile-drawer-controller__avatar">{admin.avatarUrl ? <img src={admin.avatarUrl} alt="" /> : initials}</span>
        <span className="admin-mobile-drawer-controller__meta">
          <strong>{displayName}</strong>
          <span>{roleName}</span>
          <small><i aria-hidden="true" />{copy.online}</small>
        </span>
      </button>
      <button type="button" className="admin-mobile-drawer-controller__close" onClick={closeMenu} aria-label={copy.close}>
        <AdminIcon name="chevron-left" />
      </button>
    </header>

    <footer className="admin-mobile-drawer-controller__footer">
      <button
        type="button"
        className="admin-mobile-drawer-controller__language"
        aria-label={copy.language}
        onClick={() => changeLocale(locale === 'th' ? 'en' : 'th')}
      >
        <span>{locale === 'th' ? 'EN' : 'ไทย'}</span>
      </button>
      <button type="button" onClick={() => navigate('/profile')}><AdminIcon name="user" /><span>{copy.profile}</span></button>
      <button type="button" onClick={() => navigate('/security')}><AdminIcon name="security" /><span>{copy.security}</span></button>
      <button type="button" className="admin-mobile-drawer-controller__logout" disabled={loggingOut} onClick={() => void logout()}><AdminIcon name="logout" /><span>{copy.logout}</span></button>
    </footer>
  </div>;
}

function roleLabel(roles: MobileAdmin['roles']) {
  const first = roles?.[0];
  if (typeof first === 'string') return first;
  return first?.name || first?.code || '';
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  return parts.slice(0, 2).map((part) => part.slice(0, 1).toLocaleUpperCase('th')).join('');
}
