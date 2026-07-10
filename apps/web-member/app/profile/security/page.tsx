'use client';

import { MemberCard, MemberLinkButton, MemberNotice } from '../../components/member-ui';
import '../member-profile.css';

const securityItems = [
  { label: 'การยืนยันสองขั้นตอน', value: 'ยังไม่เปิดใช้งาน', tone: 'warning' },
  { label: 'รหัสผ่านล่าสุด', value: 'รอข้อมูลจากระบบ', tone: 'default' },
  { label: 'การเข้าสู่ระบบน่าสงสัย', value: 'ยังไม่พบเหตุการณ์', tone: 'success' },
  { label: 'สถานะบัญชี', value: 'กำลังตรวจสอบ', tone: 'default' },
] as const;

export default function SecurityPage() {
  return <main className="member-feature-page member-profile-page"><div className="member-feature-container">
    <header className="member-feature-header"><div><p>ความปลอดภัย</p><h1>ศูนย์ความปลอดภัย</h1><span>ดูสถานะบัญชี เหตุการณ์เสี่ยง และการป้องกันเพิ่มเติม</span></div><MemberLinkButton href="/profile" tone="default">กลับโปรไฟล์</MemberLinkButton></header>
    <MemberNotice tone="warning">ข้อมูลหน้านี้จะเชื่อมกับ security API และ login history ในรอบ integration โดยไม่เปลี่ยน auth flow เดิม</MemberNotice>
    <section className="member-security-grid">
      {securityItems.map((item) => <MemberCard key={item.label} className="member-security-card"><span>{item.label}</span><strong>{item.value}</strong><small data-tone={item.tone}>{item.tone === 'warning' ? 'ควรตรวจสอบ' : item.tone === 'success' ? 'ปกติ' : 'รอข้อมูล'}</small></MemberCard>)}
    </section>
    <section className="member-profile-actions" aria-label="ทางลัดความปลอดภัย">
      <a href="/profile/password"><strong>เปลี่ยนรหัสผ่าน</strong><span>อัปเดตรหัสผ่านเมื่อสงสัยว่าบัญชีไม่ปลอดภัย</span></a>
      <a href="/profile/sessions"><strong>จัดการ session</strong><span>ตรวจสอบและเพิกถอนอุปกรณ์ที่ไม่รู้จัก</span></a>
      <a href="/support"><strong>ติดต่อทีมช่วยเหลือ</strong><span>แจ้งเหตุผิดปกติหรือขอให้ช่วยตรวจสอบบัญชี</span></a>
    </section>
  </div></main>;
}
