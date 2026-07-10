'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminSectionRow, AdminStack } from '../_components/admin-ui';

type Invitation = {
  adminUserId: string;
  email: string;
  username: string;
  accountStatus: string;
  invitationStatus: 'ACTIVE' | 'EXPIRED' | 'REVOKED_OR_USED';
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  protected?: boolean;
  roles: Array<{ id: string; code: string; name: string; level: number }>;
};

type ReissueResult = {
  adminUserId: string;
  email: string;
  expiresAt: string;
  token: string;
  tokenVisibleOnce: boolean;
};

export default function AdminInvitationList({ allowed }: { allowed: boolean }) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');
  const [reissueResult, setReissueResult] = useState<ReissueResult | null>(null);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    void load();
  }, [allowed]);

  async function load() {
    if (!allowed) return;
    setLoading(true);
    try {
      const response = await adminApiFetch('/admin/access/invitations');
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof payload?.message === 'string' ? payload.message : 'โหลดรายการคำเชิญไม่สำเร็จ');
        return;
      }
      setItems(Array.isArray(payload?.items) ? payload.items : []);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบคำเชิญไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function revoke(item: Invitation) {
    if (!allowed || item.protected || item.accountStatus !== 'LOCKED') return;
    if (!window.confirm(`ยืนยันยกเลิกคำเชิญของ ${item.email}?`)) return;
    setBusyKey(`${item.adminUserId}:revoke`);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/access/invitations/${item.adminUserId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof payload?.message === 'string' ? payload.message : 'ยกเลิกคำเชิญไม่สำเร็จ');
        return;
      }
      setMessage(`ยกเลิกคำเชิญแล้ว (${payload?.revokedTokens ?? 0} token)`);
      setReissueResult(null);
      await load();
    } catch {
      setMessage('เชื่อมต่อระบบไม่สำเร็จ');
    } finally {
      setBusyKey('');
    }
  }

  async function reissue(item: Invitation) {
    if (!allowed || item.protected || item.accountStatus !== 'LOCKED') return;
    if (!window.confirm(`ออกลิงก์คำเชิญใหม่ให้ ${item.email}? ลิงก์เดิมจะใช้ไม่ได้ทันที`)) return;
    setBusyKey(`${item.adminUserId}:reissue`);
    setMessage('');
    setReissueResult(null);
    try {
      const response = await adminApiFetch(`/admin/access/invitations/${item.adminUserId}/reissue`, {
        method: 'POST',
        body: JSON.stringify({ expiresInHours: 24 }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof payload?.message === 'string' ? payload.message : 'ออกคำเชิญใหม่ไม่สำเร็จ');
        return;
      }
      setReissueResult(payload);
      setMessage('ออกลิงก์ใหม่แล้ว โปรดคัดลอกทันที เพราะ Token จะแสดงเพียงครั้งเดียว');
      await load();
    } catch {
      setMessage('เชื่อมต่อระบบไม่สำเร็จ');
    } finally {
      setBusyKey('');
    }
  }

  const invitationLink = reissueResult && typeof window !== 'undefined'
    ? `${window.location.origin}/accept-invitation?token=${encodeURIComponent(reissueResult.token)}`
    : '';

  async function copyLink() {
    if (!invitationLink) return;
    try {
      await navigator.clipboard.writeText(invitationLink);
      setMessage('คัดลอกลิงก์คำเชิญใหม่แล้ว');
    } catch {
      setMessage('คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องด้านล่าง');
    }
  }

  if (!allowed) return null;

  return <AdminCard title="คำเชิญผู้ดูแลระบบ" description="ตรวจสอบ ยกเลิก และออกลิงก์ใหม่ โดยลิงก์เดิมจะถูกทำลายเมื่อ reissue">
    {message && <AdminNotice>{message}</AdminNotice>}
    {reissueResult && <div style={resultStyle}>
      <strong>{reissueResult.email}</strong>
      <span>หมดอายุ: {new Date(reissueResult.expiresAt).toLocaleString('th-TH')}</span>
      <textarea value={invitationLink} readOnly rows={3} style={linkStyle} aria-label="Reissued invitation link" />
      <AdminButton onClick={copyLink}>คัดลอกลิงก์ใหม่</AdminButton>
    </div>}
    {loading ? <AdminNotice>กำลังโหลดรายการคำเชิญ...</AdminNotice> : <AdminStack>
      {items.map((item) => {
        const active = item.invitationStatus === 'ACTIVE';
        const actionable = item.accountStatus === 'LOCKED' && !item.protected;
        return <AdminSectionRow key={item.adminUserId}>
          <div style={infoStyle}>
            <div style={badgeRowStyle}>
              <AdminBadge tone={active ? 'success' : item.invitationStatus === 'EXPIRED' ? 'warning' : 'neutral'}>{item.invitationStatus}</AdminBadge>
              <AdminBadge tone={item.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>{item.accountStatus}</AdminBadge>
              {item.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}
            </div>
            <strong>{item.email}</strong>
            <span style={mutedStyle}>{item.roles.map((role) => role.code).join(', ') || 'ไม่มี Role'}</span>
            <span style={mutedStyle}>หมดอายุ: {new Date(item.expiresAt).toLocaleString('th-TH')}</span>
          </div>
          {actionable && <div style={actionStyle}>
            <AdminButton disabled={Boolean(busyKey)} onClick={() => reissue(item)}>{busyKey === `${item.adminUserId}:reissue` ? 'กำลังออกใหม่...' : 'ออกลิงก์ใหม่'}</AdminButton>
            <AdminButton disabled={Boolean(busyKey)} onClick={() => revoke(item)}>{busyKey === `${item.adminUserId}:revoke` ? 'กำลังยกเลิก...' : 'ยกเลิกคำเชิญ'}</AdminButton>
          </div>}
        </AdminSectionRow>;
      })}
      {items.length === 0 && <AdminEmpty>ยังไม่มีคำเชิญผู้ดูแลระบบ</AdminEmpty>}
    </AdminStack>}
  </AdminCard>;
}

const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const } as const;
const infoStyle = { display: 'grid', gap: 7, minWidth: 0 } as const;
const mutedStyle = { color: '#94a3b8', overflowWrap: 'anywhere' as const } as const;
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end' } as const;
const resultStyle = { marginBottom: 14, display: 'grid', gap: 9, border: '1px solid rgba(245,197,66,.28)', borderRadius: 14, padding: 14, background: 'rgba(245,197,66,.08)' } as const;
const linkStyle = { width: '100%', resize: 'vertical' as const, borderRadius: 12, border: '1px solid rgba(148,163,184,.26)', background: '#070d18', color: '#f8fafc', padding: 12, boxSizing: 'border-box' as const, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflowWrap: 'anywhere' as const } as const;
