'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { acquireMemberDocumentOverlayLock } from '../../lib/member-document-overlay-lock';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import styles from './mobile-video-guide-popup.module.css';

const GUIDE_VIDEO_SOURCE = 'https://cdn.zabbet.com/videos/tutorial_640.webm';
const GUIDE_ART_SOURCE = '/images/guide/guide_2.webp';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileVideoGuidePopup({ open, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoSource = useMemo(
    () => resolveLocalAssetOrSource(GUIDE_VIDEO_SOURCE, 'pc'),
    [],
  );
  const guideArt = useMemo(
    () => resolveLocalAssetOrSource(GUIDE_ART_SOURCE, 'pc'),
    [],
  );

  useEffect(() => {
    if (!open) return;

    const releaseDocumentLock = acquireMemberDocumentOverlayLock();
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown);
      releaseDocumentLock();
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.backdrop}
      data-ui-owner="mobile-video-guide-popup"
      role="dialog"
      aria-modal="true"
      aria-label="วีดีโอแนะนำการใช้งาน"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className={styles.frameGlow} aria-hidden="true" />
      <div className={styles.frame}>
        <div className={styles.frameInner}>
          <span className={styles.loading}>Loading...</span>
          <video className={styles.video} autoPlay loop muted playsInline preload="auto">
            <source src={videoSource} type="video/webm" />
          </video>
        </div>
      </div>

      <div className={styles.footer}>
        <strong>คู่มือการใช้งาน</strong>
        <button ref={closeButtonRef} type="button" className={styles.close} onClick={onClose}>ปิด</button>
      </div>

      <img
        className={styles.guideArt}
        src={guideArt}
        alt=""
        aria-hidden="true"
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </div>,
    document.body,
  );
}
