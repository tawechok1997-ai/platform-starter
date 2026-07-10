'use client';

import { useEffect, useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberLinkButton, MemberNotice } from '../components/member-ui';
import { memberApiFetch } from '../member-api';
import type { WalletResponse } from '../types/member-finance';
import './member-profile.css';

type TokenClaims = {
  sub?: string;
  username?: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
};

export default function ProfilePage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [claims, setClaims] = useState<TokenClaims>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setClaims(readMemberClaims());
    void loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    setMessage('');
    try {
      const response = await memberApiFetch('/member/wallet');
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message ?? 'โหลดข้อมูลวอเลตไม่สำเร็จ');
        return;
      }
      setWallet(payload as WalletResponse);
    } catch {
      setMessage('เชื่อมต่อระบบสมาชิกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  const profileRows = useMemo(() => [
    ['ชื่อผู้ใช้', claims.username ?? '-'],
    ['เบอร์โทร', claims.phone ?? '-'],
    ['อีเมล', claims.email ?? 'ยังไม่ได้ระบุ'],
    ['สถานะบัญชี', claims.status ?? wallet?.status ?? '-'],
    ['บทบาท', claims.role ?? 'สมาชิก'],
    ['รหัสสมาชิก', claims.sub ?? '-'],
  ] as const, [claims, wallet?.status]);

  return <main className="member-feature-page member-profile-page">
    <div className="member-feature-container">
      <header className="member-feature-header">
        <div>
          <p>บัญชีของฉัน</p>
          <h1>โปรไฟล์และความปลอดภัย</h1>
          <span>ดูข้อมูลบัญชี จัดการรหัสผ่าน และตรวจสอบการเข้าสู่ระบบ</span>
        </div>
        <MemberButton onClick={() => void loadWallet()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</MemberButton>
      </header>

      {message && <MemberNotice tone="warning">{message}</MemberNotice>}

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
            <strong>{loading ? 'กำลังโหลด...' : formatMoney(wallet?.availableBalance, wallet?.currency)}</strong>
            <span>ยอดล็อก {formatMoney(wallet?.lockedBalance, wallet?.currency)}</span>
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

function readMemberClaims(): TokenClaims {
  try {
    const token = window.localStorage.getItem('member_access_token');
    if (!token) return {};
    const payload = token.split('.')[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(atob(normalized).split('').map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
    const value = JSON.parse(decoded);
    return value && typeof value === 'object' ? value as TokenClaims : {};
  } catch {
    return {};
  }
}

function formatMoney(value?: string, currency = 'THB') {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency }).format(Number.isFinite(amount) ? amount : 0);
}
