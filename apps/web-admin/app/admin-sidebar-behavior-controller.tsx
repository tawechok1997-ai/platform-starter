'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const GROUP_TRIGGER_SELECTOR = '.admin-nav-group__trigger';
const GROUP_SELECTOR = '.admin-nav-group';

export function AdminSidebarBehaviorController() {
  const pathname = usePathname();

  useEffect(() => {
    const drawer = document.getElementById('admin-sidebar');
    if (!drawer) return;

    let syncing = false;
    const searchInput = drawer.querySelector<HTMLInputElement>('.admin-nav-search input');
    const groups = () => Array.from(drawer.querySelectorAll<HTMLElement>(GROUP_SELECTOR));
    const isSearching = () => Boolean(searchInput?.value.trim());

    function triggerFor(group: HTMLElement) {
      return group.querySelector<HTMLButtonElement>(GROUP_TRIGGER_SELECTOR);
    }

    function activeGroup() {
      return groups().find((group) => Boolean(group.querySelector('a[aria-current="page"]')));
    }

    function finishSync() {
      window.setTimeout(() => { syncing = false; }, 0);
    }

    function closeOtherGroups(keep: HTMLButtonElement) {
      if (isSearching()) return;
      syncing = true;
      for (const group of groups()) {
        const trigger = triggerFor(group);
        if (trigger && trigger !== keep && trigger.getAttribute('aria-expanded') === 'true') trigger.click();
      }
      finishSync();
    }

    function syncToCurrentRoute() {
      if (isSearching()) return;
      const current = activeGroup();
      if (!current) return;
      const currentTrigger = triggerFor(current);
      if (!currentTrigger) return;

      syncing = true;
      for (const group of groups()) {
        const trigger = triggerFor(group);
        if (trigger && trigger !== currentTrigger && trigger.getAttribute('aria-expanded') === 'true') trigger.click();
      }

      window.setTimeout(() => {
        if (currentTrigger.getAttribute('aria-expanded') !== 'true') currentTrigger.click();
        window.localStorage.removeItem('admin_nav_open_groups');
        finishSync();
      }, 0);
    }

    function handleGroupClick(event: Event) {
      if (syncing || isSearching()) return;
      const element = event.target instanceof Element ? event.target : null;
      const trigger = element?.closest<HTMLButtonElement>(GROUP_TRIGGER_SELECTOR);
      if (!trigger || !drawer.contains(trigger)) return;

      window.setTimeout(() => {
        if (trigger.getAttribute('aria-expanded') === 'true') closeOtherGroups(trigger);
      }, 0);
    }

    function handleSearchInput() {
      if (!isSearching()) window.setTimeout(syncToCurrentRoute, 0);
    }

    drawer.addEventListener('click', handleGroupClick);
    searchInput?.addEventListener('input', handleSearchInput);
    const timer = window.setTimeout(syncToCurrentRoute, 0);

    return () => {
      window.clearTimeout(timer);
      drawer.removeEventListener('click', handleGroupClick);
      searchInput?.removeEventListener('input', handleSearchInput);
    };
  }, [pathname]);

  return null;
}
