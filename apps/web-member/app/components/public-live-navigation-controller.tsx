'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PublicLiveNavigationController() {
  const pathname = usePathname() ?? '/';

  useEffect(() => {
    if (pathname === '/') return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href="#live"]');
      if (!link) return;

      event.preventDefault();
      window.location.assign('/#live');
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  return null;
}
