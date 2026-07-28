'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';
import MemberAuthOverlay, { type MemberAuthMode } from './member-auth-overlay';

export default function MemberAuthLinkInterceptor() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { verify } = useMemberSession();
  const [mode, setMode] = useState<MemberAuthMode | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  const close = useCallback(() => {
    setMode(null);
    setNextPath(null);
  }, []);

  const complete = useCallback(async () => {
    await verify();
    const destination = nextPath;
    setMode(null);
    setNextPath(null);

    if (destination && destination.startsWith('/') && !destination.startsWith('//')) {
      window.location.assign(destination);
      return;
    }

    router.refresh();
  }, [nextPath, router, verify]);

  useEffect(() => {
    if (isAuthRoute) return;

    function interceptAuthLink(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== '/login' && url.pathname !== '/register') return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const requestedNext = url.searchParams.get('next');
      setNextPath(requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : null);
      setMode(url.pathname === '/register' ? 'register' : 'login');
    }

    document.addEventListener('click', interceptAuthLink, true);
    return () => document.removeEventListener('click', interceptAuthLink, true);
  }, [isAuthRoute]);

  if (isAuthRoute || !mode) return null;
  return <MemberAuthOverlay mode={mode} onClose={close} onSuccess={complete} />;
}
