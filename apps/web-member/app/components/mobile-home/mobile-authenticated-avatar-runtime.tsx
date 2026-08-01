'use client';

import { useEffect } from 'react';
import {
  DEFAULT_MOBILE_AVATAR,
  MOBILE_AVATAR_EVENT,
  MOBILE_AVATAR_STORAGE_KEY,
  readMobileAvatarPreference,
} from '../../lib/mobile-avatar-preference';
import { useMemberRuntime } from '../../member-runtime-provider';
import MobileGlobalMemberActionsRuntime from './mobile-global-member-actions-runtime';

const MAX_SYNC_FRAMES = 16;

export default function MobileAuthenticatedAvatarRuntime() {
  const { summary } = useMemberRuntime();

  useEffect(() => {
    if (!summary.isLoggedIn) return;

    let frameId = 0;
    let frameCount = 0;
    let originalHref = '';

    const sync = () => {
      const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
      if (!root) return false;

      const avatar = root.querySelector<HTMLImageElement>('img[alt="รูปโปรไฟล์สมาชิก"]');
      const editLink = root.querySelector<HTMLAnchorElement>('a[aria-label="แก้ไขโปรไฟล์"]');
      if (!avatar || !editLink) return false;

      avatar.src = readMobileAvatarPreference();
      if (!originalHref) originalHref = editLink.getAttribute('href') ?? '/profile';
      editLink.setAttribute('href', '/profile/avatar');
      return true;
    };

    const syncUntilReady = () => {
      if (sync() || frameCount >= MAX_SYNC_FRAMES) return;
      frameCount += 1;
      frameId = window.requestAnimationFrame(syncUntilReady);
    };

    const syncFromStorage = (event: StorageEvent) => {
      if (event.key === MOBILE_AVATAR_STORAGE_KEY) sync();
    };

    syncUntilReady();
    window.addEventListener(MOBILE_AVATAR_EVENT, sync);
    window.addEventListener('storage', syncFromStorage);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(MOBILE_AVATAR_EVENT, sync);
      window.removeEventListener('storage', syncFromStorage);
      const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
      const avatar = root?.querySelector<HTMLImageElement>('img[alt="รูปโปรไฟล์สมาชิก"]');
      const editLink = root?.querySelector<HTMLAnchorElement>('a[aria-label="แก้ไขโปรไฟล์"]');
      if (avatar) avatar.src = DEFAULT_MOBILE_AVATAR;
      if (editLink && originalHref) editLink.setAttribute('href', originalHref);
    };
  }, [summary.isLoggedIn]);

  return <MobileGlobalMemberActionsRuntime />;
}
