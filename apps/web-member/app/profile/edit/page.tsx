'use client';

import { FormEvent, useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberLinkButton, MemberNotice } from '../../components/member-ui';
import '../member-profile.css';

type ProfileDraft = { displayName: string; phone: string; email: string };

const initialDraft: ProfileDraft = { displayName: '', phone: '', email: '' };

export default function EditProfilePage() {
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(initialDraft);
  const [notice, setNotice] = useState('');
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const emailValid = !draft.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);
  const phoneValid = !draft.phone || /^[0-9+\-\s]{8,20}$/.test(draft.phone);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!emailValid || !phoneValid) {
      setNotice('กรุณาตรวจสอบอีเมลและเบอร์โทรให้ถูกต้อง');
      return;
    }
    setSaved(draft);
    setNotice('บันทึกข้อมูลในหน้าฟอร์มแล้ว ระบบจะเชื่อม endpoint จริงในรอบ API integration');
  }

  return <main className="member-feature-page member-profile-page">
    <div className="member-feature-container">
      <header className="member-feature-header"><div><p>บัญชีของฉัน</p><h1>แก้ไขข้อมูลส่วนตัว</h1><span>จัดการชื่อที่แสดง เบอร์โทร และอีเมล</span></div><MemberLinkButton href="/profile" tone="default">กลับโปรไฟล์</MemberLinkButton></header>
      {notice && <MemberNotice tone={emailValid && phoneValid ? 'success' : 'warning'}>{notice}</MemberNotice>}
      <MemberCard className="member-profile-card">
        <form className="member-profile-form" onSubmit={submit}>
          <label><span>ชื่อที่แสดง</span><input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} autoComplete="name" /></label>
          <label><span>เบอร์โทร</span><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} inputMode="tel" autoComplete="tel" aria-invalid={!phoneValid} /></label>
          {!phoneValid && <small role="alert">รูปแบบเบอร์โทรไม่ถูกต้อง</small>}
          <label><span>อีเมล</span><input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} inputMode="email" autoComplete="email" aria-invalid={!emailValid} /></label>
          {!emailValid && <small role="alert">รูปแบบอีเมลไม่ถูกต้อง</small>}
          <div className="member-profile-form-actions"><MemberButton type="submit" disabled={!dirty || !emailValid || !phoneValid}>บันทึกการเปลี่ยนแปลง</MemberButton><button type="button" onClick={() => setDraft(saved)} disabled={!dirty}>ยกเลิกการแก้ไข</button></div>
        </form>
      </MemberCard>
    </div>
  </main>;
}
