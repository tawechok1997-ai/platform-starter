'use client';

import { useEffect, useState } from 'react';
import UsageGuideModal from './usage-guide-modal';

const OPEN_GUIDE_EVENT = 'open-member-usage-guide';

function isInternalGuideLink(link: HTMLAnchorElement) {
  try {
    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin && url.pathname.replace(/\/+$/, '') === '/guide';
  } catch {
    return false;
  }
}

export default function UsageGuideController() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleGuideClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || !(event.target instanceof Element)
      ) return;

      const explicitTrigger = event.target.closest<HTMLElement>('[data-open-usage-guide="true"]');
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      const guideLink = link && isInternalGuideLink(link) ? link : null;

      if (!explicitTrigger && !guideLink) return;
      if (guideLink?.hasAttribute('download')) return;
      if (guideLink?.target && guideLink.target !== '_self') return;

      event.preventDefault();
      setOpen(true);
    };

    const openFromEvent = () => setOpen(true);

    document.addEventListener('click', handleGuideClick);
    window.addEventListener(OPEN_GUIDE_EVENT, openFromEvent);

    return () => {
      document.removeEventListener('click', handleGuideClick);
      window.removeEventListener(OPEN_GUIDE_EVENT, openFromEvent);
    };
  }, []);

  return <UsageGuideModal open={open} onClose={() => setOpen(false)} />;
}
