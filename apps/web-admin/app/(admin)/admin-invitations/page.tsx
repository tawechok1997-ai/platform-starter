'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';
import InviteAdminPanel from '../access/invite-admin-panel';

type Role = { id: string; code: string; name: string; level: number; hasWildcard: boolean };
type Invitation = { adminUserId: string; email: string; username: string; accountStatus: string; invitationStatus: string; createdAt: string; expiresAt: string; usedAt?: string | null; protected?: boolean; roles: { id: string; code: string; name: string; level: number }[] };

export default function AdminInvitationsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [items, setItems] = useState<Invitation[]>([]);
  const [message, setMessage] = useState('กำลังโหลดคำเชิญ...');
  const [busyKey, setBusyKey] = useState('');
  const [latestLink, setLatestLink] = useState('');

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const [overviewRes, invitationsRes] = await Promise.all([
        adminApiFetch('/admin/access/overview'),
        adminApiFetch('/admin/access/invitations'),
      ]);
      const [overview, invitations] = await Promise.all([
        overviewRes.json().catch(() => null),
        invitationsRes.json().catch(() => null),
      ]);
      if (!overviewRes.ok || !invitationsRes.ok) {
        setMessage(overview?.message ?? invitations?.message ?? 'โหลดคำเชิญไม่สำเร็จ');
        return;
      }
      setRoles(Array.isArray(overview?.roles) ? overview.roles : []);
      setItems(Array.isArray(invitations?.items) ? invitations.items : []);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบคำเชิญไม่สำเร็จ');
    }
  }

  async function revoke(item: Invitation) {
    if (item.protected || !window.confirm(`ยืนยันยกเลิกคำเชิญของ ${item.email}?`)) return;
    setBusyKey(`${item.adminUserId}:revoke`);
    try {
      const response = await adminApiFetch(`/admin/access/invitations/${item.adminUserId}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage(payload?.message ?? 'ยกเลิกคำเชิญไม่สำเร็จ'); return; }
      setMessage('ยกเลิกคำเชิญแล้ว');
      await load();
    } finally {
      setBusyKey('');
    }
  }

  async function reissue(item: Invitation) {
    if (item.protected || !window.confirm(`ออกลิงก์ใหม่ให้ ${item.email} และยกเลิกลิงก์เดิม?`)) return;
    setBusyKey(`${item.adminUserId}:reissue`);
    setLatestLink('');
    try {
      const response = await adminApiFetch(`/admin/access/invitations/${item.adminUserId}/reissue`, { method: 'POST', body: JSON.stringify({ expiresInHours: 24 }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage(payload?.message ?? 'ออกลิงก์ใหม่ไม่สำเร็จ'); return; }
      const link = `${window.location.origin}/accept-invitation?token=${encodeURIComponent(payload.token)}`;
      setLatestLink(link);
      setMessage('ออกลิงก์ใหม่แล้ว Token จะแสดงเพียงครั้งเดียว');
      await load();
    } finally {
      setBusyKey('');
    }
  }

  async function copyLatestLink() {
    if (!latestLink) return;
    try { await navigator.clipboard.writeText(latestLink); setMessage('คัดลอกลิงก์แล้ว'); }
    catch { setMessage('คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องด้านล่าง'); }
  }

  return <AdminPage eyebrow="Security" title="คำเชิญผู้ดูแล" description="สร้าง ยกเลิก และออกลิงก์เชิญใหม่จากหน้าที่แยกเฉพาะ">
    {message && <AdminNotice>{message}</AdminNotice>}
    <InviteAdminPanel roles={roles} onCreated={load} />
    {latestLink && <AdminCard title="ลิงก์ล่าสุด" description="แสดงเพียงครั้งเดียว กรุณาคัดลอกทันที"><textarea readOnly value={latestLink} rows={3} style={linkStyle} /><div style={{ marginTop: 10 }}><AdminButton onClick={copyLatestLink}>คัดลอกลิงก์</AdminButton></div></AdminCard>}
    <AdminCard title="รายการคำเชิญ" description={`${items.length} รายการล่าสุด`}>
      <AdminStack>{items.map((item) => <AdminSectionRow key={item.adminUserId}><div style={itemStyle}><div style={badgeStyle}><AdminBadge tone={item.invitationStatus === 'ACTIVE' ? 'success' : item.invitationStatus === 'EXPIRED' ? 'warning' : 'danger'}>{item.invitationStatus}</AdminBadge><AdminBadge tone={item.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>{item.accountStatus}</AdminBadge>{item.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}</div><strong>{item.email}</strong><span>{item.roles.map((role) => role.code).join(', ') || 'ไม่มี Role'}</span><small>หมดอายุ: {new Date(item.expiresAt).toLocaleString('th-TH')}</small></div>{!item.protected && item.accountStatus === 'LOCKED' && <div style={actionStyle}><AdminButton disabled={Boolean(busyKey)} onClick={() => reissue(item)}>ออกลิงก์ใหม่</AdminButton><AdminButton disabled={Boolean(busyKey)} onClick={() => revoke(item)}>ยกเลิก</AdminButton></div>}</AdminSectionRow>)}{items.length === 0 && <AdminEmpty>ยังไม่มีคำเชิญ</AdminEmpty>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

const itemStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const badgeStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'start' };
const linkStyle = { width: '100%', resize: 'vertical' as const, borderRadius: 12, border: '1px solid rgba(148,163,184,.26)', background: '#070d18', color: '#f8fafc', padding: 12, boxSizing: 'border-box' as const, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
