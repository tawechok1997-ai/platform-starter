'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { memberApiFetch } from '../../member-api';
import { useMemberContactRuntime } from '../../member-settings-runtime';
import { useMemberSession } from '../../member-session-provider';
import styles from './profile-action-popups.module.css';

export type ProfileActionPopupKind = 'contact' | 'password' | null;

type ProfileActionPopupLayerProps = {
  kind: ProfileActionPopupKind;
  onChange: (kind: ProfileActionPopupKind) => void;
};

export default function ProfileActionPopupLayer({ kind, onChange }: ProfileActionPopupLayerProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!kind) return;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('button, a, input')?.focus();
    });

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onChange(null);
        return;
      }
      if (event.key === 'Tab' && dialogRef.current) trapFocus(event, dialogRef.current);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [kind, onChange]);

  if (!mounted || !kind) return null;

  const title = kind === 'contact' ? 'ติดต่อ' : 'เปลี่ยนรหัสผ่าน';
  return createPortal(
    <div className={styles.layer} data-profile-action-popup-owner={kind}>
      <button
        type="button"
        aria-label="ปิดหน้าต่าง"
        onClick={() => onChange(null)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          padding: 0,
          border: 0,
          background: 'transparent',
          cursor: 'default',
        }}
      />
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${kind === 'password' ? styles.passwordDialog : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-action-popup-title"
      >
        <div className={styles.dialogBorder} aria-hidden="true" />
        <PopupTitle title={title} />
        <button className={styles.closeButton} type="button" onClick={() => onChange(null)} aria-label="ปิด">
          <img src="/images/close.svg" alt="" aria-hidden="true" />
        </button>

        {kind === 'contact'
          ? <ContactContent />
          : <PasswordContent onContact={() => onChange('contact')} />}
      </div>
    </div>,
    document.body,
  );
}

function ContactContent() {
  const contact = useMemberContactRuntime();
  const line = useMemo(
    () => contact.channels.find((channel) => channel.key === 'line') ?? contact.primary,
    [contact],
  );

  return (
    <div className={styles.contactList}>
      <div className={styles.contactCard}>
        <img className={styles.contactIcon} src={line.iconUrl} alt="" aria-hidden="true" />
        <div className={styles.contactCopy}>
          <strong>{line.label === 'LINE' ? 'Line' : line.label}</strong>
          <span>{line.value}</span>
        </div>
        <a
          className={styles.contactButton}
          href={line.href}
          target={line.external ? '_blank' : undefined}
          rel={line.external ? 'noreferrer' : undefined}
        >
          คลิก
        </a>
      </div>
    </div>
  );
}

function PasswordContent({ onContact }: { onContact: () => void }) {
  const { logout } = useMemberSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [success, setSuccess] = useState(false);
  const logoutTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (logoutTimer.current !== null) window.clearTimeout(logoutTimer.current);
  }, []);

  const rules = useMemo(() => ({
    length: newPassword.length >= 8,
    letter: /[A-Za-z]/.test(newPassword),
    number: /\d/.test(newPassword),
  }), [newPassword]);
  const newPasswordReady = rules.length && rules.letter && rules.number;
  const confirmReady = newPasswordReady;
  const passwordsMatch = Boolean(confirmPassword) && confirmPassword === newPassword;
  const valid = Boolean(currentPassword) && newPasswordReady && passwordsMatch && !busy;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setSuccess(false);
    if (!valid) {
      setNotice('กรุณาตรวจสอบรหัสผ่านให้ครบตามเงื่อนไข');
      return;
    }

    setBusy(true);
    try {
      const response = await memberApiFetch('/member/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice(payload?.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
        return;
      }

      setSuccess(true);
      setNotice('เปลี่ยนรหัสผ่านสำเร็จ กำลังออกจากระบบเพื่อความปลอดภัย');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      logoutTimer.current = window.setTimeout(logout, 1200);
    } catch {
      setNotice('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.passwordForm} onSubmit={submit}>
      <PasswordField
        label="รหัสผ่านเดิม"
        value={currentPassword}
        visible={visible.current}
        disabled={busy}
        autoComplete="current-password"
        onChange={setCurrentPassword}
        onToggle={() => setVisible((value) => ({ ...value, current: !value.current }))}
      />
      <PasswordField
        label="รหัสผ่านใหม่"
        value={newPassword}
        visible={visible.next}
        disabled={busy}
        autoComplete="new-password"
        onChange={setNewPassword}
        onToggle={() => setVisible((value) => ({ ...value, next: !value.next }))}
      />

      <div className={styles.passwordRules} aria-label="เงื่อนไขรหัสผ่าน">
        <PasswordRule active={rules.length}>ตั้งรหัสผ่าน 8 ตัวขึ้นไป</PasswordRule>
        <PasswordRule active={rules.letter}>มีตัวอักษร aA-zZ</PasswordRule>
        <PasswordRule active={rules.number}>ตัวเลข 0-9 ผสมกัน</PasswordRule>
      </div>

      <PasswordField
        label="ยืนยันรหัสผ่านใหม่อีกครั้ง"
        value={confirmPassword}
        visible={visible.confirm}
        disabled={!confirmReady || busy}
        autoComplete="new-password"
        invalid={Boolean(confirmPassword) && !passwordsMatch}
        onChange={setConfirmPassword}
        onToggle={() => setVisible((value) => ({ ...value, confirm: !value.confirm }))}
      />

      {notice ? (
        <div className={success ? styles.successNotice : styles.errorNotice} role="status" aria-live="polite">
          {notice}
        </div>
      ) : null}

      <button className={styles.submitButton} type="submit" disabled={!valid}>
        {busy ? 'กำลังยืนยัน...' : 'ยืนยัน'}
      </button>

      <div className={styles.supportDivider} />
      <div className={styles.supportRow}>
        <span>พบปัญหาการใช้งาน</span>
        <button type="button" onClick={onContact}>ติดต่อเจ้าหน้าที่</button>
      </div>
    </form>
  );
}

function PasswordField({
  label,
  value,
  visible,
  disabled,
  invalid = false,
  autoComplete,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  visible: boolean;
  disabled: boolean;
  invalid?: boolean;
  autoComplete: string;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className={`${styles.passwordField} ${value ? styles.passwordFieldFilled : ''} ${invalid ? styles.passwordFieldInvalid : ''} ${disabled ? styles.passwordFieldDisabled : ''}`}>
      <span>{label}</span>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={onToggle} disabled={disabled} aria-label={visible ? `ซ่อน${label}` : `แสดง${label}`}>
        <EyeIcon hidden={!visible} />
      </button>
    </label>
  );
}

function PasswordRule({ active, children }: { active: boolean; children: string }) {
  return (
    <div className={active ? styles.ruleActive : ''}>
      <span aria-hidden="true">{active ? '✓' : ''}</span>
      <strong>{children}</strong>
    </div>
  );
}

function PopupTitle({ title }: { title: string }) {
  return (
    <div className={styles.titlePlate}>
      <svg viewBox="0 0 192 36" fill="none" aria-hidden="true">
        <path d="M0 0H192L186.5 18s-3.584 9.441-10.5 13.814C169.319 36.037 159.562 36 159.562 36H30.938S21.583 36.144 15 31.814C8.239 27.366 4.75 18 4.75 18L0 0Z" fill="url(#profile-popup-title-gradient)" />
        <defs>
          <linearGradient id="profile-popup-title-gradient" x1="96" y1="36" x2="96" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#505050" />
            <stop offset=".32" stopColor="#474747" />
            <stop offset=".79" stopColor="#313131" />
          </linearGradient>
        </defs>
      </svg>
      <strong id="profile-action-popup-title">{title}</strong>
    </div>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden
    ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4Zm7 2.5A2.5 2.5 0 1 0 8 5a2.5 2.5 0 0 0 0 5.5Z" /></svg>
    : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m2 1 13 13-1 1-2.1-2.1A8.4 8.4 0 0 1 8 14c-4.5 0-7-4-7-4a11 11 0 0 1 3.2-3.3L1 3l1-2Zm4.1 7.1a2.5 2.5 0 0 0 3.8 3.2L6.1 8.1ZM8 4c4.5 0 7 4 7 4a11 11 0 0 1-1.9 2.3l-2-2A2.5 2.5 0 0 0 7.7 5L6.8 4.1C7.2 4 7.6 4 8 4Z" /></svg>;
}

function trapFocus(event: globalThis.KeyboardEvent, container: HTMLElement) {
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled])',
  ));
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
