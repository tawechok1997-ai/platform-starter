'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ADMIN_IDENTITY_INVALIDATED_EVENT, adminApiFetch } from './admin-api';
import { useAdminLocale } from './(admin)/admin-locale';
import { resolveAdminDashboardModel } from './(admin)/admin-dashboard-resolver';
import {
  inferAdminWorkspaceAssignments,
  localizeAdminWorkspace,
  resolveAdminWorkspaceSelection,
  resolveAssignedAdminWorkspaces,
  resolveVisibleNavGroupIds,
  type AdminWorkspaceIdentity,
  type AdminWorkspaceSelection,
} from './(admin)/admin-workspace-registry';

const WORKSPACE_STORAGE_KEY = 'admin_workspace_selection_v1';
const WORKSPACE_CHANGE_EVENT = 'admin:workspace-change';
const IDENTITY_REFRESH_INTERVAL_MS = 30_000;

type RuntimeTargets = {
  topbar: HTMLElement | null;
  profile: HTMLElement | null;
  dashboard: HTMLElement | null;
};

const EMPTY_TARGETS: RuntimeTargets = {
  topbar: null,
  profile: null,
  dashboard: null,
};

export function AdminWorkspaceRuntime() {
  const pathname = usePathname();
  const [locale] = useAdminLocale();
  const [identity, setIdentity] = useState<AdminWorkspaceIdentity | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selection, setSelection] = useState<AdminWorkspaceSelection>('system');
  const [targets, setTargets] = useState<RuntimeTargets>(EMPTY_TARGETS);

  const assignments = useMemo(
    () => inferAdminWorkspaceAssignments(identity),
    [identity],
  );
  const workspaces = useMemo(
    () => resolveAssignedAdminWorkspaces(assignments),
    [assignments],
  );
  const dashboardModel = useMemo(
    () => resolveAdminDashboardModel(assignments, selection, locale),
    [assignments, selection, locale],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadIdentity() {
      try {
        const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' });
        const data = await response.json().catch(() => null) as AdminWorkspaceIdentity | null;
        if (!cancelled && response.ok && data) setIdentity(data);
      } catch {
        // The protected layout owns authentication. P3 only enriches an active session.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    const refreshIdentity = () => { void loadIdentity(); };
    const refreshVisibleIdentity = () => {
      if (document.visibilityState === 'visible') refreshIdentity();
    };

    refreshIdentity();
    window.addEventListener(ADMIN_IDENTITY_INVALIDATED_EVENT, refreshIdentity);
    window.addEventListener('focus', refreshIdentity);
    document.addEventListener('visibilitychange', refreshVisibleIdentity);
    const refreshTimer = window.setInterval(refreshIdentity, IDENTITY_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener(ADMIN_IDENTITY_INVALIDATED_EVENT, refreshIdentity);
      window.removeEventListener('focus', refreshIdentity);
      document.removeEventListener('visibilitychange', refreshVisibleIdentity);
      window.clearInterval(refreshTimer);
    };
  }, [pathname]);

  useEffect(() => {
    if (!loaded) return;
    const stored = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    setSelection(resolveAdminWorkspaceSelection(assignments, stored));
  }, [assignments, loaded]);

  useEffect(() => {
    if (!loaded) return;
    const root = document.documentElement;
    root.dataset.adminWorkspace = selection;
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, selection);
    window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGE_EVENT, {
      detail: { selection, assignments },
    }));
  }, [assignments, loaded, selection]);

  useEffect(() => {
    if (!loaded) return;

    const refresh = () => {
      const topbarParent = document.querySelector<HTMLElement>('.admin-topbar-actions');
      const profileParent = document.querySelector<HTMLElement>('#admin-profile-menu');
      const contentParent = pathname === '/dashboard'
        ? document.querySelector<HTMLElement>('.admin-content-shell')
        : null;

      const nextTargets: RuntimeTargets = {
        topbar: ensureRuntimeSlot(topbarParent, 'admin-workspace-switcher-slot'),
        profile: ensureRuntimeSlot(profileParent, 'admin-profile-workspaces-slot'),
        dashboard: ensureRuntimeSlot(contentParent, 'admin-workspace-dashboard-slot', true),
      };

      if (pathname !== '/dashboard') {
        document.getElementById('admin-workspace-dashboard-slot')?.remove();
        nextTargets.dashboard = null;
      }

      setTargets((current) => sameTargets(current, nextTargets) ? current : nextTargets);
      applyWorkspaceVisibility(assignments, selection);
    };

    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('admin-locale-change', refresh);

    return () => {
      observer.disconnect();
      window.removeEventListener('admin-locale-change', refresh);
    };
  }, [assignments, loaded, pathname, selection]);

  if (!loaded || workspaces.length === 0) return null;

  const switcher = (
    <label className="admin-workspace-switcher" aria-label={locale === 'en' ? 'Active workspace' : 'พื้นที่ทำงานปัจจุบัน'}>
      <span>{locale === 'en' ? 'Workspace' : 'พื้นที่ทำงาน'}</span>
      <select
        value={selection}
        onChange={(event) => setSelection(resolveAdminWorkspaceSelection(assignments, event.target.value))}
      >
        {workspaces.length > 1 && (
          <option value="all">{locale === 'en' ? 'All assigned roles' : 'ทุกตำแหน่งที่ได้รับ'}</option>
        )}
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {locale === 'en' ? workspace.titleEn : workspace.title}
          </option>
        ))}
      </select>
    </label>
  );

  const profileWorkspaces = (
    <section className="admin-profile-workspaces" aria-label={locale === 'en' ? 'Assigned workspaces' : 'พื้นที่ทำงานที่ได้รับ'}>
      <span>{locale === 'en' ? 'Assigned workspaces' : 'พื้นที่ทำงานที่ได้รับ'}</span>
      <div>
        {workspaces.map((workspace) => {
          const localized = localizeAdminWorkspace(workspace, locale);
          return (
            <button
              type="button"
              key={workspace.id}
              data-active={selection === workspace.id || selection === 'all' || undefined}
              onClick={() => setSelection(workspace.id)}
            >
              {localized.title}
            </button>
          );
        })}
      </div>
    </section>
  );

  const dashboard = (
    <section className="admin-workspace-dashboard" data-workspace={dashboardModel.key}>
      <div>
        <span>{dashboardModel.eyebrow}</span>
        <h2>{dashboardModel.title}</h2>
        <p>{dashboardModel.description}</p>
      </div>
      <nav aria-label={locale === 'en' ? 'Workspace shortcuts' : 'ทางลัดพื้นที่ทำงาน'}>
        {dashboardModel.quickLinks.map((link) => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>
    </section>
  );

  return (
    <>
      {targets.topbar ? createPortal(switcher, targets.topbar) : null}
      {targets.profile ? createPortal(profileWorkspaces, targets.profile) : null}
      {targets.dashboard ? createPortal(dashboard, targets.dashboard) : null}
    </>
  );
}

function ensureRuntimeSlot(
  parent: HTMLElement | null,
  id: string,
  prepend = false,
) {
  if (!parent) return null;
  const existing = document.getElementById(id);
  if (existing) return existing;

  const slot = document.createElement('div');
  slot.id = id;
  slot.dataset.adminWorkspaceOwner = 'p3';
  if (prepend) parent.prepend(slot);
  else parent.append(slot);
  return slot;
}

function sameTargets(left: RuntimeTargets, right: RuntimeTargets) {
  return left.topbar === right.topbar
    && left.profile === right.profile
    && left.dashboard === right.dashboard;
}

function applyWorkspaceVisibility(
  assignments: ReturnType<typeof inferAdminWorkspaceAssignments>,
  selection: AdminWorkspaceSelection,
) {
  const allowedGroupIds = resolveVisibleNavGroupIds(assignments, selection);
  const allowedHrefs = new Set<string>();

  for (const section of document.querySelectorAll<HTMLElement>('.admin-nav-group')) {
    const submenu = section.querySelector<HTMLElement>('[id^="admin-nav-"]');
    const groupId = submenu?.id.replace(/^admin-nav-/, '') ?? '';
    const visible = Boolean(groupId && allowedGroupIds.has(groupId));
    if (section.hidden === visible) section.hidden = !visible;
    // `hidden` already removes the section from rendering and the accessibility
    // tree. Adding aria-hidden on the same container leaves focusable descendants
    // under an explicit aria-hidden ancestor, which violates WCAG when workspace
    // filtering hides a group. Keep native hidden as the single visibility owner.
    section.removeAttribute('aria-hidden');
    if (!visible) continue;
    for (const link of section.querySelectorAll<HTMLAnchorElement>('a[href]')) {
      allowedHrefs.add(normalizeHref(link.getAttribute('href')));
    }
  }

  for (const link of document.querySelectorAll<HTMLAnchorElement>('.admin-quick-nav a[href]')) {
    const visible = allowedHrefs.has(normalizeHref(link.getAttribute('href')));
    link.hidden = !visible;
    link.removeAttribute('aria-hidden');
  }

  for (const result of document.querySelectorAll<HTMLElement>('.admin-command-result')) {
    const href = normalizeHref(result.querySelector('small')?.textContent ?? '');
    const visible = allowedHrefs.has(href);
    result.hidden = !visible;
    result.removeAttribute('aria-hidden');
  }
}

function normalizeHref(value: string | null) {
  if (!value) return '';
  try {
    return new URL(value, window.location.origin).pathname;
  } catch {
    return value.split('?')[0]?.split('#')[0] ?? value;
  }
}
