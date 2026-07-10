'use client';

import { MemberCard, MemberLinkButton, MemberNotice } from '../components/member-ui';
import './member-profile.css';

const profileRows = [
  ['ชื่อผู้ใช้', 'กำลังเชื่อมข้อมูลสมาชิก'],
  ['เบอร์โทร', 'กำลังเชื่อมข้อมูลสมาชิก'],
  ['อีเมล', 'ยังไม่ได้ระบุ'],
  ['สถานะบัญชี', 'กำลังตรวจสอบ'],
  ['ระดับสมาชิก', 'ทั่วไป'],
  ['สถานะ KYC', 'ยังไม่ยืนยัน'],
] as const;

export default function ProfilePage() {
  return <main className="member-feature-page member-profile-page">
    <div className="member-feature-container">
      <header className="member-feature-header">
        <div>
          <p>บัญชีของฉัน</p>
          <h1>โปรไฟล์และความปลอดภัย</h1>
          <span>ดูข้อมูลบัญชี จัดการรหัสผ่าน และตรวจสอบการเข้าสู่ระบบ</span>
        </div>
      </header>

      <MemberNotice tone="warning">หน้านี้เป็น foundation รอบแรก ข้อมูลจริงและการแก้ไขจะเชื่อม API ในรอบ integration โดยไม่เปลี่ยน auth flow เดิม</MemberNotice>

      <section className="member-profile-grid" aria-label="ข้อมูลบัญชี">
        <MemberCard className="member-profile-card">
          <div className="member-feature-section-heading">
            <div><p>ภาพรวม</p><h2>ข้อมูลสมาชิก</h2></div>
            <MemberLinkButton href="/profile/edit">แก้ไขข้อมูล</MemberLinkButton>
          </div>
          <dl className="member-profile-list">
            {profileRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </MemberCard>

        <MemberCard className="member-profile-card">
          <div className="member-feature-section-heading"><div><p>ยอดคงเหลือ</p><h2>สรุปวอเลต</h2></div></div>
          <div className="member-profile-wallet">
            <strong>฿0.00</strong>
            <span>ยอดพร้อมใช้จะโหลดจาก session ของสมาชิก</span>
          </div>
          <MemberLinkButton href="/transactions" tone="default">ดูประวัติ</MemberLinkButton>
        </MemberCard>
      </section>

      <section className="member-profile-actions" aria-label="การตั้งค่าความปลอดภัย">
        <a href="/profile/password"><strong>เปลี่ยนรหัสผ่าน</strong><span>อัปเดตรหัสผ่านและออกจากระบบอุปกรณ์อื่นอย่างปลอดภัย</span></a>
        <a href="/profile/sessions"><strong>อุปกรณ์ที่เข้าสู่ระบบ</strong><span>ดู session ปัจจุบันและเพิกถอนอุปกรณ์ที่ไม่รู้จัก</span></a>
        <a href="/profile/security"><strong>ศูนย์ความปลอดภัย</strong><span>ดูประวัติการเข้าสู่ระบบ ความเสี่ยง และสถานะ 2FA</span></a>
      </section>
    </div>
  </main>;
}
