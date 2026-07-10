'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { requestJson } from '../../member-api';
import { MemberButton, MemberCard, MemberLinkButton, MemberNotice } from '../../components/member-ui';
import '../member-profile.css';

type ProfileDraft = { displayName: string; phone: string; email: string };
type ProfileResponse = ProfileDraft & { username: string };

const initialDraft: ProfileDraft = { displayName: '', phone: '', email: '' };

export default function EditProfilePage() {
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(initialDraft);
  const [notice, setNotice] = useState('กำลังโหลดข้อมูล...');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const emailValid = !draft.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);
  const phoneValid = !draft.phone || /^[0-9+\-\s]{8,20}$/.test(draft.phone);

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function load() {
    setLoading(true);
    setSuccess(false);
    try {
      const data = await requestJson<ProfileResponse>('/member/auth/profile');
      const next = { displayName: data.displayName ?? '', phone: data.phone ?? '', email: data.email ?? '' };
      setDraft(next);
      setSaved(next);
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'โหลดข้อมูลส่วนตัวไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!emailValid || !phoneValid) {
      setSuccess(false);
      setNotice('กรุณาตรวจสอบอีเมลและเบอร์โทรให้ถูกต้อง');
      return;
    }
    setSaving(true);
    setSuccess(false);
    try {
      const data = await requestJson<ProfileResponse>('/member/auth/profile', { method: 'PATCH', body: JSON.stringify(draft) });
      const next = { displayName: data.displayName ?? '', phone: data.phone ?? '', email: data.email ?? '' };
      setDraft(next);
      setSaved(next);
      setSuccess(true);
      setNotice('บันทึกข้อมูลส่วนตัวแล้ว');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return <main className="member-feature-page member-profile-page">
    <div className="member-feature-container">
      <header className="member-feature-header"><div><p>บัญชีของฉัน</p><h1>แก้ไขข้อมูลส่วนตัว</h1><span>จัดการชื่อที่แสดง เบอร์โทร และอีเมล</span></div><MemberLinkButton href="/profile" tone="default">กลับโปรไฟล์</MemberLinkButton></header>
      {notice && <MemberNotice tone={success ? 'success' : 'warning'}>{notice}</MemberNotice>}
      <MemberCard className="member-profile-card">
        <form className="member-profile-form" onSubmit={submit} aria-busy={loading || saving}>
          <label><span>ชื่อที่แสดง</span><input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} autoComplete="name" disabled={loading || saving} /></label>
          <label><span>เบอร์โทร</span><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} inputMode="tel" autoComplete="tel" aria-invalid={!phoneValid} disabled={loading || saving} /></label>
          {!phoneValid && <small role="alert">รูปแบบเบอร์โทรไม่ถูกต้อง</small>}
          <label><span>อีเมล</span><input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} inputMode="email" autoComplete="email" aria-invalid={!emailValid} disabled={loading || saving} /></label>
          {!emailValid && <small role="alert">รูปแบบอีเมลไม่ถูกต้อง</small>}
          <div className="member-profile-form-actions"><MemberButton type="submit" disabled={loading || saving || !dirty || !emailValid || !phoneValid}>{saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</MemberButton><button type="button" onClick={() => setDraft(saved)} disabled={loading || saving || !dirty}>ยกเลิกการแก้ไข</button>{!loading && notice && !success && <button type="button" onClick={() => void load()} disabled={saving}>ลองใหม่</button>}</div>
        </form>
      </MemberCard>
    </div>
  </main>;
}
