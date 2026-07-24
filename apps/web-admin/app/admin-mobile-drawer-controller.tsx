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
    close: 'ปิดเมนู',
    language: 'ภาษา',
    fallbackName: 'ผู้ดูแลระบบ',
    fallbackRole: 'ผู้ดูแล',
  },
  en: {
    online: 'Online',
    profile: 'Profile',
    security: 'Security',
    logout: 'Sign out',
    close: 'Close menu',
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
    closeButton?.click();
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
        <AdminIcon name="close" />
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