'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const LIVE_ROUTE = '/live';
const LIVE_ACTION_SELECTOR = [
  '.source-live-card__watch',
  '.source-live-card__bet',
  '.member-desktop-nav a[href="#live"]',
  '.member-desktop-nav a[href="/#live"]',
].join(',');

export default function PublicLiveNavigationController() {
  const router = useRouter();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const liveAction = target.closest<HTMLElement>(LIVE_ACTION_SELECTOR);
      if (!liveAction) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      router.push(LIVE_ROUTE);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [router]);

  return null;
}
