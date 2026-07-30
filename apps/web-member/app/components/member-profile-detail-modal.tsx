'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../member-api';
import type { MemberLocale } from '../member-locale-provider';

type MemberProfileDetailModalProps = {
  open: boolean;
  locale: MemberLocale;
  fallbackLabel: string;
  selectedAvatar: number;
  onClose: () => void;
  onSelectAvatar: (avatar: number) => void;
};

type ProfileSummary = {
  username?: string | null;
  phone?: string | null;
  displayName?: string | null;
};

const COPY = {
  th: {
    title: 'รายละเอียดโปรไฟล์',
    newTier: 'New',
    editAccount: 'แก้ไข บัญชี/เบอร์โทร',
    editPassword: 'แก้ไขรหัสผ่าน',
    chooseAvatar: 'เลือกรูปโปรไฟล์',
    back: 'ย้อนกลับ',
    close: 'ปิด',
  },
  en: {
    title: 'Profile details',
    newTier: 'New',
    editAccount: 'Edit account / phone',
    editPassword: 'Change password',
    chooseAvatar: 'Choose profile picture',
    back: 'Back',
    close: 'Close',
  },
} as const;

const AVATARS = Array.from({ length: 15 }, (_, index) => index + 1);

export default function MemberProfileDetailModal({
  open,
  locale,
  fallbackLabel,
  selectedAvatar,
  onClose,
  onSelectAvatar,
}: MemberProfileDetailModalProps) {
  const copy = COPY[locale];
  const [profile, setProfile] = useState<ProfileSummary | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);

    let cancelled = false;
    void memberApiFetch('/member/auth/profile')
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json().catch(() => null)) as ProfileSummary | null;
      })
      .then((payload) => {
        if (!cancelled && payload) setProfile(payload);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  const accountLabel = profile?.phone || profile?.displayName || profile?.username || fallbackLabel;
  const avatarUrl = `/images/avatar/${selectedAvatar}.webp`;

  return createPortal(
    <div
      className="member-profile-detail-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="member-profile-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
      >
        <span className="member-profile-detail-top-line" aria-hidden="true" />

        <header className="member-profile-detail-header">
          <div className="member-profile-detail-title-group">
            <button type="button" className="member-profile-detail-back" onClick={onClose} aria-label={copy.back}>
              <BackIcon />
            </button>
            <span className="member-profile-detail-title-icon" aria-hidden="true"><ProfileIcon /></span>
            <h2>{copy.title}</h2>
          </div>
          <button type="button" className="member-profile-detail-close" onClick={onClose} aria-label={copy.close}>
            <CloseIcon />
          </button>
        </header>

        <div className="member-profile-detail-content">
          <section className="member-profile-detail-summary">
            <div className="member-profile-detail-current-avatar">
              <img src={avatarUrl} alt="" onError={useAvatarFallback} />
            </div>
            <div className="member-profile-detail-tier">
              <span aria-hidden="true">◆</span>
              <strong>{copy.newTier}</strong>
            </div>
            <strong className="member-profile-detail-account">{accountLabel}</strong>

            <div className="member-profile-detail-actions">
              <Link href="/profile/edit" onClick={onClose}>
                <AccountIcon />
                <span>{copy.editAccount}</span>
              </Link>
              <Link href="/profile/password" onClick={onClose}>
                <PasswordIcon />
                <span>{copy.editPassword}</span>
              </Link>
            </div>
          </section>

          <span className="member-profile-detail-divider" aria-hidden="true" />

          <section className="member-profile-detail-avatar-panel">
            <h3>{copy.chooseAvatar}</h3>
            <div className="member-profile-detail-avatar-grid">
              {AVATARS.map((avatar) => {
                const selected = avatar === selectedAvatar;
                return (
                  <button
                    key={avatar}
                    type="button"
                    className={selected ? 'is-selected' : ''}
                    aria-pressed={selected}
                    aria-label={`${copy.chooseAvatar} ${avatar}`}
                    onClick={() => onSelectAvatar(avatar)}
                  >
                    <img src={`/images/avatar/${avatar}.webp`} alt="" onError={useAvatarFallback} />
                    {selected ? <span className="member-profile-detail-selected"><CheckIcon /></span> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function useAvatarFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallback === 'true') return;
  image.dataset.fallback = 'true';
  image.src = '/images/avatar/7.webp';
}

function BackIcon() {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m10.5 17.3 7.4 7.5-1.9 1.9L5.3 16 16 5.3l1.9 1.9-7.4 7.5h16.2v2.6H10.5Z" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function ProfileIcon() {
  return <svg viewBox="0 0 31 31" aria-hidden="true"><path d="M19.4 4.4c3.4 1.8 5.6 5.3 5.7 9.4l2.3 3.3c.4.5.3 1.1-.2 1.4-.5.4-1.3.7-2.3 1l-.4 4.2c-.1 1.1-1 1.8-2.1 1.7l-1.8-.2v2.2c0 .7-.5 1.2-1.2 1.2H8.6c-.7 0-1.2-.5-1.2-1.2v-4.7A10.8 10.8 0 0 1 3 14c0-3.9 2.1-7.4 5.2-9.3" /><path d="M11.1 9.3a5 5 0 1 0 5 0V7.4c0-1.6 0-2.8-.1-3.6 0-.7-.5-1.3-1.2-1.4h-2.3c-.8.1-1.3.7-1.3 1.4v5.5Z" /><path d="M13.6 18.6c1.9 1.9 4.8 3.2 7.5 3.2" /></svg>;
}

function AccountIcon() {
  return <svg viewBox="0 0 25 25" aria-hidden="true"><path d="M12.5 4.4c-4.2 0-7.6 3.3-7.6 7.4v2.3H1.3v-2.3C1.3 5.7 6.4.8 12.5.8s11.2 4.9 11.2 11v2.3H20v-2.3c0-4.1-3.3-7.4-7.5-7.4Z" /><path d="M1.3 13c0-1.3.8-2.4 2-2.7 1-.3 2.1-.5 3.2-.6 1.1-.1 2.2.6 2.4 1.8.1.7.2 1.7.2 3.1s-.1 2.4-.2 3.1c-.2 1.2-1.3 1.9-2.4 1.8-1.1-.1-2.3-.4-3.2-.6a2.8 2.8 0 0 1-2-2.7V13Zm22.4 0c0-1.3-.8-2.4-2.1-2.7-.9-.3-2.1-.5-3.1-.6-1.2-.1-2.2.6-2.4 1.8-.1.7-.2 1.7-.2 3.1s.1 2.4.2 3.1c.2 1.2 1.2 1.9 2.4 1.8 1-.1 2.2-.4 3.1-.6a2.8 2.8 0 0 0 2.1-2.7V13Z" /></svg>;
}

function PasswordIcon() {
  return <svg viewBox="0 0 25 25" aria-hidden="true"><path d="M13.5 9.1c3.4 0 5.8.1 7.3.2 1.7.1 3.1 1.3 3.2 3 .1 1 .2 2.5.2 4.4 0 1.8-.1 3.3-.2 4.3-.1 1.7-1.5 2.9-3.2 3-1.8.1-4.2.2-7.3.2-3.2 0-5.6-.1-7.3-.2-1.7-.1-3.1-1.3-3.2-3-.1-1-.2-2.5-.2-4.3 0-1.9.1-3.4.2-4.4.1-1.7 1.5-2.9 3.2-3 1.5-.1 3.9-.2 7.3-.2Z" /><path d="M6.3 9.5 6.6 6.8C6.7 3.4 9.5.8 13 .8h1c3.4 0 6.2 2.6 6.5 6l.2 2.7c-1.3-.1-2.7-.1-4.3-.2l-.4-2a2.5 2.5 0 0 0-5 0l-.1 2c-1.7 0-3.2.1-4.6.2Z" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" /><path d="m11.5 20.5 5.5 5.2L29 14" /></svg>;
}
