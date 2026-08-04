'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMemberSession } from '../../member-session-provider';
import MobileVideoGuidePopup from './mobile-video-guide-popup';
import UsageGuideModal from './usage-guide-modal';

const OPEN_GUIDE_EVENT = 'open-member-usage-guide';
const MOBILE_MEMBER_POPUP_EVENT = 'member:mobile-popup-open';
const MOBILE_QUERY = '(max-width: 900px)';
const VIDEO_TRIGGER_SELECTOR = '[data-mobile-member-popup="video"]';
const VIDEO_TRIGGER_LABELS = ['วีดีโอแนะนำ', 'วิดีโอแนะนำ'] as const;

type MobilePopupOpenDetail = { kind?: unknown };

function isInternalGuideLink(link: HTMLAnchorElement) {
  try {
    const url = new URL(link.href, window.location.href);
    return url.origin === window.location.origin && url.pathname.replace(/\/+$/, '') === '/guide';
  } catch {
    return false;
  }
}

function isVideoGuideTrigger(target: Element) {
  if (target.closest<HTMLElement>(VIDEO_TRIGGER_SELECTOR)) return true;

  const action = target.closest<HTMLElement>('a,button,[role="button"]');
  if (!action) return false;

  const label = [
    action.getAttribute('aria-label') ?? '',
    action.textContent ?? '',
  ].join(' ').replace(/\s+/g, ' ').trim();

  return VIDEO_TRIGGER_LABELS.some((value) => label.includes(value));
}

export default function UsageGuideController() {
  const { isLoggedIn } = useMemberSession();
  const [open, setOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const closeVideo = useCallback(() => setVideoOpen(false), []);

  useEffect(() => {
    const showGuestVideo = () => {
      setOpen(false);
      setVideoOpen(true);
    };

    const handleVideoClick = (event: MouseEvent) => {
      if (
        isLoggedIn
        || event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
        || !(event.target instanceof Element)
        || !window.matchMedia(MOBILE_QUERY).matches
        || !isVideoGuideTrigger(event.target)
      ) return;

      // Guests have no authenticated MobileMemberPopupRuntime. This controller
      // owns their video popup only; logged-in clicks continue to the member
      // popup owner without stopImmediatePropagation.
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showGuestVideo();
    };

    const handlePopupOpen = (event: Event) => {
      const detail = (event as CustomEvent<MobilePopupOpenDetail>).detail;
      if (
        isLoggedIn
        || detail?.kind !== 'video'
        || !window.matchMedia(MOBILE_QUERY).matches
      ) return;
      event.stopImmediatePropagation();
      showGuestVideo();
    };

    window.addEventListener('click', handleVideoClick, true);
    window.addEventListener(MOBILE_MEMBER_POPUP_EVENT, handlePopupOpen);
    return () => {
      window.removeEventListener('click', handleVideoClick, true);
      window.removeEventListener(MOBILE_MEMBER_POPUP_EVENT, handlePopupOpen);
    };
  }, [isLoggedIn]);

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
