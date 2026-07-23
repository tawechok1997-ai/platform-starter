'use client';

import { FormEvent, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { ADMIN_ACTION_PERMISSIONS } from '../_components/admin-permission-contract';
import { AdminPermissionGate } from '../_components/admin-permissions';
import { AdminButton, AdminCard, AdminNotice } from '../_components/admin-ui';

type Role = {
  id: string;
  code: string;
  name: string;
  level: number;
  hasWildcard: boolean;
};

type InvitationResult = {
  invitation: {
    email: string;
    expiresAt: string;
    role: { id: string; code: string; name: string };
  };
  token: string;
  tokenVisibleOnce: boolean;
};

export default function InviteAdminPanel({ roles, onCreated }: { roles: Role[]; onCreated: () => void | Promise<void> }) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<InvitationResult | null>(null);

  const selectableRoles = useMemo(() => roles.filter((role) => !role.hasWildcard && !['owner', 'super_admin'].includes(role.code)), [roles]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setResult(null);
    if (!email.trim() || !roleId) {
      setMessage('กรุณากรอกอีเมลและเลือก Role');
      return;
    }

    setBusy(true);
    try {
      const response = await adminApiFetch('/admin/access/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), roleId, expiresInHours }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof payload?.message === 'string' ? payload.message : 'สร้างคำเชิญไม่สำเร็จ');
        return;
      }
      setResult(payload);
      setEmail('');
      setRoleId('');
      setExpiresInHours(24);
      setMessage('สร้างคำเชิญแล้ว โปรดคัดลอกลิงก์นี้ทันที เพราะ Token จะแสดงเพียงครั้งเดียว');
      await onCreated();
    } catch {
      setMessage('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  }

  const invitationLink = result && typeof window !== 'undefined'
    ? `${window.location.origin}/accept-invitation?token=${encodeURIComponent(result.token)}`
    : '';

  async function copyLink() {
    if (!invitationLink) return;
    try {
      await navigator.clipboard.writeText(invitationLink);
      setMessage('คัดลอกลิงก์คำเชิญแล้ว');
    } catch {
      setMessage('คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องด้านล่าง');
    }
  }

  return <AdminPermissionGate anyOf={ADMIN_ACTION_PERMISSIONS.adminInvitationManage}>
    <AdminCard title="เชิญผู้ดูแลระบบ" description="สร้างบัญชีแบบล็อกและส่งลิงก์เปิดใช้งานที่ใช้ได้ครั้งเดียว">
      {message && <AdminNotice>{message}</AdminNotice>}
      <form onSubmit={submit} style={formStyle}>
        <label style={fieldStyle}>อีเมลผู้รับคำเชิญ
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="admin@example.com" disabled={busy} style={inputStyle} />
        </label>
        <label style={fieldStyle}>Role
          <select value={roleId} onChange={(event) => setRoleId(event.target.value)} disabled={busy} style={inputStyle}>
            <option value="">เลือก Role</option>
            {selectableRoles.map((role) => <option key={role.id} value={role.id}>{role.name} ({role.code})</option>)}
          </select>
        </label>
        <label style={fieldStyle}>อายุคำเชิญ
          <select value={expiresInHours} onChange={(event) => setExpiresInHours(Number(event.target.value))} disabled={busy} style={inputStyle}>
            <option value={1}>1 ชั่วโมง</option>
            <option value={12}>12 ชั่วโมง</option>
            <option value={24}>24 ชั่วโมง</option>
            <option value={72}>3 วัน</option>
            <option value={168}>7 วัน</option>
          </select>
        </label>
        <div style={actionStyle}><AdminButton disabled={busy || selectableRoles.length === 0}>{busy ? 'กำลังสร้าง...' : 'สร้างคำเชิญ'}</AdminButton></div>
      </form>
      {selectableRoles.length === 0 && <AdminNotice tone="warning">ไม่มี Role ที่บัญชีนี้มีสิทธิ์มอบให้</AdminNotice>}
      {result && <div style={resultStyle}>
        <strong>{result.invitation.email}</strong>
        <span>Role: {result.invitation.role.name}</span>
        <span>หมดอายุ: {new Date(result.invitation.expiresAt).toLocaleString('th-TH')}</span>
        <textarea value={invitationLink} readOnly rows={3} style={linkStyle} aria-label="Invitation link" />
        <AdminButton onClick={copyLink}>คัดลอกลิงก์</AdminButton>
      </div>}
    </AdminCard>
  </AdminPermissionGate>;
}

const formStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12, alignItems: 'end' } as const;
const fieldStyle = { display: 'grid', gap: 7, color: '#e2e8f0', fontWeight: 850, fontSize: 14 } as const;
const inputStyle = { width: '100%', minHeight: 46, borderRadius: 12, border: '1px solid rgba(148,163,184,.26)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' } as const;
const actionStyle = { display: 'flex', alignItems: 'end' } as const;
const resultStyle = { marginTop: 14, display: 'grid', gap: 9, border: '1px solid rgba(245,197,66,.28)', borderRadius: 14, padding: 14, background: 'rgba(245,197,66,.08)' } as const;
const linkStyle = { width: '100%', resize: 'vertical', borderRadius: 12, border: '1px solid rgba(148,163,184,.26)', background: '#070d18', color: '#f8fafc', padding: 12, boxSizing: 'border-box', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', overflowWrap: 'anywhere' } as const;
