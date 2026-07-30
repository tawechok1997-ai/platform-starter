'use client';

import { FormEvent, useMemo, useState } from 'react';
import { memberApiFetch } from '../member-api';
import type { MemberLocale } from '../member-locale-provider';
import '../member-profile-action-overlay.css';

type ProfileAction = 'contact' | 'password' | null;

type MemberProfileActionOverlayProps = {
  action: ProfileAction;
  locale: MemberLocale;
  onClose: () => void;
  onOpenContact: () => void;
};

const COPY = {
  th: {
    contactTitle: 'ติดต่อ',
    passwordTitle: 'แก้ไขรหัสผ่าน',
    currentPassword: 'รหัสผ่านเดิม',
    newPassword: 'รหัสผ่านใหม่',
    confirmPassword: 'ยืนยันรหัสผ่านใหม่อีกครั้ง',
    minLength: 'ตั้งรหัสผ่าน 8 ตัวขึ้นไป',
    letters: 'มีตัวอักษร aA-zZ',
    numbers: 'ตัวเลข 0-9 ผสมกัน',
    cancel: 'ยกเลิก',
    confirm: 'ยืนยัน',
    submitting: 'กำลังยืนยัน...',
    supportLead: 'พบปัญหาการใช้งาน',
    contactStaff: 'ติดต่อเจ้าหน้าที่',
    contactButton: 'คลิก',
    close: 'ปิด',
    back: 'ย้อนกลับ',
    mismatch: 'รหัสผ่านใหม่ไม่ตรงกัน',
    invalid: 'กรุณากรอกรหัสผ่านให้ครบตามเงื่อนไข',
    changed: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
    failed: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
  },
  en: {
    contactTitle: 'Contact',
    passwordTitle: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    minLength: 'Use at least 8 characters',
    letters: 'Include letters aA-zZ',
    numbers: 'Include numbers 0-9',
    cancel: 'Cancel',
    confirm: 'Confirm',
    submitting: 'Confirming...',
    supportLead: 'Having trouble?',
    contactStaff: 'Contact support',
    contactButton: 'Open',
    close: 'Close',
    back: 'Back',
    mismatch: 'New passwords do not match',
    invalid: 'Complete all password requirements',
    changed: 'Password changed successfully',
    failed: 'Unable to change password',
  },
} as const;

export default function MemberProfileActionOverlay({
  action,
  locale,
  onClose,
  onOpenContact,
}: MemberProfileActionOverlayProps) {
  if (!action) return null;

  return (
    <div
      className="member-profile-action-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      {action === 'contact' ? (
        <ContactPanel locale={locale} onClose={onClose} />
      ) : (
        <PasswordPanel locale={locale} onClose={onClose} onOpenContact={onOpenContact} />
      )}
    </div>
  );
}

function ContactPanel({ locale, onClose }: { locale: MemberLocale; onClose: () => void }) {
  const copy = COPY[locale];

  return (
    <section className="member-profile-action-dialog member-profile-contact-dialog" role="dialog" aria-modal="true" aria-label={copy.contactTitle}>
      <span className="member-profile-action-top-line" aria-hidden="true" />
      <header className="member-profile-action-header">
        <div className="member-profile-action-title-group">
          <span className="member-profile-action-title-icon" aria-hidden="true"><ProfileIcon /></span>
          <h2>{copy.contactTitle}</h2>
        </div>
        <button type="button" className="member-profile-action-close" onClick={onClose} aria-label={copy.close}><CloseIcon /></button>
      </header>

      <div className="member-profile-contact-list">
        <div className="member-profile-contact-card">
          <span className="member-profile-contact-glow" aria-hidden="true" />
          <img src="/images/line.png" alt="LINE" />
          <div>
            <strong>Line</strong>
            <span>@774uinsb</span>
          </div>
          <a href="https://lin.ee/UYkP0OC" target="_blank" rel="noreferrer">{copy.contactButton}</a>
        </div>
      </div>
    </section>
  );
}

function PasswordPanel({
  locale,
  onClose,
  onOpenContact,
}: {
  locale: MemberLocale;
  onClose: () => void;
  onOpenContact: () => void;
}) {
  const copy = COPY[locale];
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibleField, setVisibleField] = useState<'current' | 'new' | 'confirm' | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [success, setSuccess] = useState(false);

  const requirements = useMemo(() => ({
    length: newPassword.length >= 8,
    letters: /[A-Za-z]/.test(newPassword),
    numbers: /\d/.test(newPassword),
  }), [newPassword]);
  const newPasswordReady = requirements.length && requirements.letters && requirements.numbers;
  const passwordsMatch = Boolean(confirmPassword) && newPassword === confirmPassword;
  const valid = Boolean(currentPassword) && newPasswordReady && passwordsMatch;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    if (!valid) {
      setNotice(confirmPassword && !passwordsMatch ? copy.mismatch : copy.invalid);
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      const response = await memberApiFetch('/member/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setNotice(payload?.message ?? copy.failed);
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      setNotice(copy.changed);
    } catch {
      setNotice(copy.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="member-profile-action-dialog member-profile-password-dialog" role="dialog" aria-modal="true" aria-label={copy.passwordTitle}>
      <span className="member-profile-action-top-line" aria-hidden="true" />
      <header className="member-profile-action-header">
        <div className="member-profile-action-title-group">
          <button type="button" className="member-profile-action-back" onClick={onClose} aria-label={copy.back}><BackIcon /></button>
          <span className="member-profile-action-title-icon" aria-hidden="true"><KeyIcon /></span>
          <h2>{copy.passwordTitle}</h2>
        </div>
        <button type="button" className="member-profile-action-close" onClick={onClose} aria-label={copy.close}><CloseIcon /></button>
      </header>

      <form className="member-profile-password-form" onSubmit={submit}>
        <PasswordInput
          label={copy.currentPassword}
          value={currentPassword}
          disabled={busy}
          visible={visibleField === 'current'}
          onToggle={() => setVisibleField((current) => current === 'current' ? null : 'current')}
          onChange={setCurrentPassword}
          autoComplete="current-password"
        />
        <PasswordInput
          label={copy.newPassword}
          value={newPassword}
          disabled={busy}
          visible={visibleField === 'new'}
          onToggle={() => setVisibleField((current) => current === 'new' ? null : 'new')}
          onChange={setNewPassword}
          autoComplete="new-password"
        />

        <div className="member-profile-password-rules" aria-live="polite">
          <PasswordRule passed={requirements.length} label={copy.minLength} />
          <PasswordRule passed={requirements.letters} label={copy.letters} />
          <PasswordRule passed={requirements.numbers} label={copy.numbers} />
        </div>

        <PasswordInput
          label={copy.confirmPassword}
          value={confirmPassword}
          disabled={busy || !newPasswordReady}
          visible={visibleField === 'confirm'}
          onToggle={() => setVisibleField((current) => current === 'confirm' ? null : 'confirm')}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />

        {notice ? <div className={success ? 'member-profile-action-notice is-success' : 'member-profile-action-notice'} role="status">{notice}</div> : null}

        <div className="member-profile-password-actions">
          <button type="button" onClick={onClose} disabled={busy}>{copy.cancel}</button>
          <button type="submit" className="is-primary" disabled={!valid || busy}>{busy ? copy.submitting : copy.confirm}</button>
        </div>

        <span className="member-profile-password-bottom-line" aria-hidden="true" />
        <div className="member-profile-password-support">
          <span>{copy.supportLead}</span>
          <button type="button" onClick={onOpenContact}>{copy.contactStaff}</button>
        </div>
      </form>
    </section>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  disabled,
  onToggle,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  visible: boolean;
  disabled: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className={disabled ? 'member-profile-password-field is-disabled' : 'member-profile-password-field'}>
      <span>{label}</span>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
      />
      <button type="button" onClick={onToggle} disabled={disabled} aria-label={label}><EyeIcon crossed={!visible} /></button>
    </label>
  );
}

function PasswordRule({ passed, label }: { passed: boolean; label: string }) {
  return <div className={passed ? 'is-passed' : ''}><RuleIcon passed={passed} /><span>{label}</span></div>;
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

function KeyIcon() {
  return <svg viewBox="0 0 31 31" aria-hidden="true"><path d="M12.7 16.3 24.5 4.5l4 4M20 9l3.5 3.5M8.5 26.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" /></svg>;
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return crossed
    ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m1.9 1.9 12.2 12.2M.7 7.7c1.3-3 3.8-5 7.3-5 3.6 0 6.1 2 7.3 5-.6 1.4-1.5 2.6-2.7 3.5M9.8 10.6A3 3 0 0 1 5.1 7" /></svg>
    : <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M.7 8c1.3-3 3.8-5 7.3-5s6 2 7.3 5c-1.3 3-3.8 5-7.3 5S2 11 .7 8Z" /><circle cx="8" cy="8" r="2.5" /></svg>;
}

function RuleIcon({ passed }: { passed: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d={passed ? 'm8 12 2.5 2.5L16 9' : ''} /></svg>;
}
