'use client';

import { useCallback, useEffect, useState } from 'react';
import MobileVideoGuidePopup from './mobile-video-guide-popup';
import UsageGuideModal from './usage-guide-modal';

const OPEN_GUIDE_EVENT = 'open-member-usage-guide';
const MOBILE_QUERY = '(max-width: 900px)';
const VIDEO_TRIGGER_SELECTOR = '[data-mobile-member-popup="video"]';

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
  const [videoOpen, setVideoOpen] = useState(false);
  const closeVideo = useCallback(() => setVideoOpen(false), []);

  useEffect(() => {
    const handleVideoClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || !(event.target instanceof Element)
        || !window.matchMedia(MOBILE_QUERY).matches
      ) return;

      const trigger = event.target.closest<HTMLElement>(VIDEO_TRIGGER_SELECTOR);
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(false);
      setVideoOpen(true);
    };

    // Window capture runs before the authenticated drawer runtime. This keeps
    // one active owner for the video guide before and after login.
    window.addEventListener('click', handleVideoClick, true);
    return () => window.removeEventListener('click', handleVideoClick, true);
  }, []);

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
      setVideoOpen(false);
      setOpen(true);
    };

    const openFromEvent = () => {
      setVideoOpen(false);
      setOpen(true);
    };

    document.addEventListener('click', handleGuideClick);
    window.addEventListener(OPEN_GUIDE_EVENT, openFromEvent);

    return () => {
      document.removeEventListener('click', handleGuideClick);
      window.removeEventListener(OPEN_GUIDE_EVENT, openFromEvent);
    };
  }, []);

  return (
    <>
      <UsageGuideModal open={open} onClose={() => setOpen(false)} />
      <MobileVideoGuidePopup open={videoOpen} onClose={closeVideo} />
    </>
  );
}
