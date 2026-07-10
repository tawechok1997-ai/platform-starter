'use client';

import { FormEvent, useMemo, useState } from 'react';
import { memberApiFetch } from '../../member-api';
import { MemberButton, MemberCard, MemberLinkButton, MemberNotice } from '../../components/member-ui';
import '../member-profile.css';

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const score = useMemo(() => [newPassword.length >= 8, /[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /\d/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)].filter(Boolean).length, [newPassword]);
  const mismatch = Boolean(confirmPassword) && newPassword !== confirmPassword;
  const valid = Boolean(currentPassword) && score >= 3 && !mismatch && Boolean(confirmPassword);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSuccess(false);
    if (!valid) {
      setNotice('กรุณาตรวจสอบรหัสผ่านให้ครบตามเงื่อนไข');
      return;
    }
    setBusy(true);
    setNotice('');
    const response = await memberApiFetch('/member/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, revokeOtherSessions: true }),
    });
    const data = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setNotice(data?.message ?? 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(true);
    setNotice('เปลี่ยนรหัสผ่านแล้ว และออกจากอุปกรณ์อื่นเรียบร้อย');
  }

  return <main className="member-feature-page member-profile-page"><div className="member-feature-container">
    <header className="member-feature-header"><div><p>ความปลอดภัย</p><h1>เปลี่ยนรหัสผ่าน</h1><span>ใช้รหัสผ่านที่เดายากและไม่ซ้ำกับบริการอื่น</span></div><MemberLinkButton href="/profile" tone="default">กลับโปรไฟล์</MemberLinkButton></header>
    {notice && <MemberNotice tone={success ? 'success' : 'warning'}>{notice}</MemberNotice>}
    <MemberCard className="member-profile-card"><form className="member-profile-form" onSubmit={submit}>
      <label><span>รหัสผ่านปัจจุบัน</span><input disabled={busy} type={show ? 'text' : 'password'} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label>
      <label><span>รหัสผ่านใหม่</span><input disabled={busy} type={show ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" /></label>
      <div className="member-password-meter" aria-label={`ความแข็งแรง ${score} จาก 5`}><span style={{ width: `${score * 20}%` }} /></div>
      <small>อย่างน้อย 8 ตัว และควรมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข หรือสัญลักษณ์</small>
      <label><span>ยืนยันรหัสผ่านใหม่</span><input disabled={busy} type={show ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" aria-invalid={mismatch} /></label>
      {mismatch && <small role="alert">รหัสผ่านใหม่ไม่ตรงกัน</small>}
      <label className="member-profile-checkbox"><input disabled={busy} type="checkbox" checked={show} onChange={(event) => setShow(event.target.checked)} /><span>แสดงรหัสผ่าน</span></label>
      <div className="member-profile-form-actions"><MemberButton type="submit" disabled={!valid || busy}>{busy ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}</MemberButton></div>
    </form></MemberCard>
  </div></main>;
}
