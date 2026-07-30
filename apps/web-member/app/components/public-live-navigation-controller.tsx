'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemberSession } from '../member-session-provider';

const SPORT_ROUTE = '/browse/games?category=sport';
const SPORT_LOGIN_ROUTE = `/?auth=login&next=${encodeURIComponent(SPORT_ROUTE)}`;
const LIVE_ACTION_SELECTOR = '.source-live-card__watch, .source-live-card__bet';

export default function PublicLiveNavigationController() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const liveAction = target.closest<HTMLElement>(LIVE_ACTION_SELECTOR);
      if (liveAction) {
        event.preventDefault();
        event.stopPropagation();
        router.push(ready && isLoggedIn ? SPORT_ROUTE : SPORT_LOGIN_ROUTE);
        return;
      }

      if (pathname === '/') return;
      const link = target.closest<HTMLAnchorElement>('a[href="#live"]');
      if (!link) return;

      event.preventDefault();
      event.stopPropagation();
      router.push('/#live');
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isLoggedIn, pathname, ready, router]);

  return null;
}
