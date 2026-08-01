'use client';

import { useLayoutEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const MOBILE_QUERY = '(max-width: 900px)';
const SEARCH_TRIGGER_SELECTOR = [
  '[aria-label="ค้นหาเกม"]',
  '[aria-label="Search games"]',
  '[data-member-search-trigger="true"]',
].join(', ');

export default function PublicMobileSourceHeaderOwner() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  useLayoutEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);

    const openSearchPage = (event: MouseEvent) => {
      if (!media.matches || pathname === '/search') return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const trigger = event.target.closest<HTMLElement>(SEARCH_TRIGGER_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      router.push('/search');
    };

    document.addEventListener('click', openSearchPage, true);
    return () => document.removeEventListener('click', openSearchPage, true);
  }, [pathname, router]);

  return null;
}
