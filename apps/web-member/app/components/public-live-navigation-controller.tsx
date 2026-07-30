'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function PublicLiveNavigationController() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/') return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href="#live"]');
      if (!link) return;

      event.preventDefault();
      router.push('/#live');
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, router]);

  return null;
}
