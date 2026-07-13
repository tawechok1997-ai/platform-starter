'use client';

import { useEffect, useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberEmptyState, MemberLinkButton, MemberNotice } from '../components/member-ui';
import { memberApiFetch } from '../member-api';
import type { WalletResponse } from '../types/member-finance';
import './member-profile.css';

type MemberProfile = {
  id: string;
  username: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
  phoneVerifiedAt?: string | null;
  emailVerifiedAt?: string | null;
  displayName?: string | null;
  wallet?: WalletResponse | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { void loadProfile(); }, []);

  async function loadProfile() {
    setLoading(true);
    setMessage('');
    try {
      const [profileResponse, walletResponse] = await Promise.all([
        memberApiFetch('/member/auth/profile'),
        memberApiFetch('/member/wallet'),
      ]);
      const profilePayload = await profileResponse.json().catch(() => null);
      const walletPayload = await walletResponse.json().catch(() => null);
      if (!profileResponse.ok || !walletResponse.ok) {
        setMessage(profilePayload?.message ?? walletPayload?.message ?? 'โหลดข้อมูลสมาชิกไม่สำเร็จ');
        return;
      }
      setProfile(profilePayload as MemberProfile);
      setWallet((profilePayload?.wallet ?? walletPayload) as WalletResponse);
    } catch {
      setMessage('เชื่อมต่อระบบสมาชิกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  const profileRows = useMemo(() => [
    ['ชื่อที่แสดง', profile?.displayName ?? profile?.username ?? '-'],
    ['ชื่อผู้ใช้', profile?.username ?? '-'],
    ['เบอร์โทร', profile?.phone ?? 'ยังไม่ได้ระบุ'],
    ['อีเมล', profile?.email ?? 'ยังไม่ได้ระบุ'],
    ['สถานะบัญชี', profile?.status ?? '-'],
    ['วันที่สมัคร', formatDate(profile?.createdAt)],
    ['เข้าใช้ล่าสุด', formatDate(profile?.lastLoginAt)],
  ] as const, [profile]);

  return <main className="member-feature-page member-profile-page">
    <div className="member-feature-container">
      <header className="member-feature-header">
        <div><p>บัญชีของฉัน</p><h1>โปรไฟล์และความปลอดภัย</h1><span>ดูข้อมูลบัญชี จัดการรหัสผ่าน และตรวจสอบการเข้าสู่ระบบ</span></div>
        <MemberButton onClick={() => void loadProfile()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</MemberButton>
      </header>

      {message && <MemberNotice tone="warning"><strong>{message}</strong>{!loading && <MemberButton tone="default" onClick={() => void loadProfile()}>ลองใหม่</MemberButton>}</MemberNotice>}

      {!loading && !profile && message && <MemberEmptyState title="ยังโหลดโปรไฟล์ไม่ได้" description="กรุณาลองใหม่อีกครั้ง หรือกลับมาภายหลังหากระบบสมาชิกยังไม่พร้อม" actionHref="/support" actionLabel="ติดต่อทีมช่วยเหลือ" />}

      <section className="member-profile-grid" aria-label="ข้อมูลบัญชี">
        <MemberCard className="member-profile-card">
          <div className="member-feature-section-heading"><div><p>ภาพรวม</p><h2>ข้อมูลสมาชิก</h2></div><MemberLinkButton href="/profile/edit">แก้ไขข้อมูล</MemberLinkButton></div>
          <dl className="member-profile-list">
            {profileRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </MemberCard>

        <MemberCard className="member-profile-card">
          <div className="member-feature-section-heading"><div><p>ยอดคงเหลือ</p><h2>สรุปวอเลต</h2></div></div>
          <div className="member-profile-wallet"><strong>{loading ? 'กำลังโหลด...' : formatMoney(wallet?.availableBalance, wallet?.currency)}</strong><span>ยอดล็อก {formatMoney(wallet?.lockedBalance, wallet?.currency)}</span></div>
          <MemberLinkButton href="/transactions" tone="default">ดูประวัติ</MemberLinkButton>
        </MemberCard>
      </section>

      <section className="member-profile-actions" aria-label="การตั้งค่าความปลอดภัย">
        <a href="/kyc"><strong>ยืนยันตัวตน KYC</strong><span>อัปโหลดเอกสาร ตรวจสถานะ และส่งคำขอตรวจยืนยันตัวตน</span></a>
        <a href="/profile/password"><strong>เปลี่ยนรหัสผ่าน</strong><span>อัปเดตรหัสผ่านและออกจากระบบอุปกรณ์อื่นอย่างปลอดภัย</span></a>
        <a href="/profile/sessions"><strong>อุปกรณ์ที่เข้าสู่ระบบ</strong><span>ดู session ปัจจุบันและเพิกถอนอุปกรณ์ที่ไม่รู้จัก</span></a>
        <a href="/profile/security"><strong>ศูนย์ความปลอดภัย</strong><span>ดูประวัติการเข้าสู่ระบบ ความเสี่ยง และสถานะ 2FA</span></a>
      </section>
    </div>
  </main>;
}

function formatMoney(value?: string, currency = 'THB') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
}
