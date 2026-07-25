'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { buildWorkspaceTabHref } from './workspace-tab-url';
import styles from './workspace-tabs.module.css';

export type AdminWorkspaceTab = {
  id: string;
  label: string;
  shortLabel?: string;
  href?: string;
  value?: string;
  count?: number;
  disabled?: boolean;
};

export type AdminWorkspaceTabsProps = {
  ariaLabel: string;
  tabs: readonly AdminWorkspaceTab[];
  activeId?: string;
  queryKey?: string;
  className?: string;
};

export function AdminWorkspaceTabs({
  ariaLabel,
  tabs,
  activeId,
  queryKey = 'tab',
  className,
}: AdminWorkspaceTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentValue = searchParams.get(queryKey);
  const resolvedActiveId = activeId ?? tabs.find((tab) => tab.value ? tab.value === currentValue : !currentValue)?.id ?? tabs[0]?.id;

  return <nav className={[styles.tabs, className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
    <div className={styles.scroller} role="tablist" aria-orientation="horizontal">
      {tabs.map((tab) => {
        const active = tab.id === resolvedActiveId;
        const href = buildWorkspaceTabHref({
          pathname,
          search: searchParams.toString(),
          queryKey,
          target: { href: tab.href, value: tab.value },
        });

        if (tab.disabled) {
          return <span key={tab.id} className={styles.tab} aria-disabled="true" data-active={active || undefined}>
            <span className={styles.fullLabel}>{tab.label}</span>
            {tab.shortLabel && <span className={styles.shortLabel}>{tab.shortLabel}</span>}
            {typeof tab.count === 'number' && <em>{tab.count > 99 ? '99+' : tab.count}</em>}
          </span>;
        }

        return <Link
          key={tab.id}
          href={href}
          className={styles.tab}
          role="tab"
          aria-selected={active}
          aria-current={active ? 'page' : undefined}
          data-active={active || undefined}
          scroll={false}
        >
          <span className={styles.fullLabel}>{tab.label}</span>
          {tab.shortLabel && <span className={styles.shortLabel}>{tab.shortLabel}</span>}
          {typeof tab.count === 'number' && <em>{tab.count > 99 ? '99+' : tab.count}</em>}
        </Link>;
      })}
    </div>
  </nav>;
}
