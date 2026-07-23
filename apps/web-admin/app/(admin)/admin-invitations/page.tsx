'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { ADMIN_ACTION_PERMISSIONS } from '../_components/admin-permission-contract';
import { AdminPermissionGate } from '../_components/admin-permissions';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';
import InviteAdminPanel from '../access/invite-admin-panel';

type Role = { id: string; code: string; name: string; level: number; hasWildcard: boolean };
type Invitation = { adminUserId: string; email: string; username: string; accountStatus: string; invitationStatus: string; createdAt: string; expiresAt: string; usedAt?: string | null; protected?: boolean; roles: { id: string; code: string; name: string; level: number }[] };
type PendingAction = { type: 'revoke' | 'reissue'; item: Invitation } | null;

export default function AdminInvitationsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [items, setItems] = useState<Invitation[]>([]);
  const [message, setMessage] = useState('กำลังโหลดคำเชิญ...');
  const [busyKey, setBusyKey] = useState('');
  const [latestLink, setLatestLink] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  const normalizedItems = useMemo(() => items.map((item) => ({ ...item, invitationStatus: normalizeInvitationStatus(item) })), [items]);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [rolesRes, invitationsRes] = await Promise.all([
        adminApiFetch('/admin/access/invitations/roles'),
        adminApiFetch('/admin/access/invitations'),
      ]);
      const [rolesPayload, invitations] = await Promise.all([
        rolesRes.json().catch(() => null),
        invitationsRes.json().catch(() => null),
      ]);
      if (!rolesRes.ok || !invitationsRes.ok) throw new Error('load');
      setRoles(Array.isArray(rolesPayload?.items) ? rolesPayload.items : []);
      setItems(Array.isArray(invitations?.items) ? invitations.items : []);
    } catch {
      setRoles([]);
      setItems([]);
      setMessage('โหลดคำเชิญไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function executeAction() {
    if (!pendingAction) return;
    const { item, type } = pendingAction;
    const key = `${item.adminUserId}:${type}`;
    setBusyKey(key);
    setMessage('');
    try {
      if (type === 'revoke') {
        const response = await adminApiFetch(`/admin/access/invitations/${item.adminUserId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('revoke');
        setMessage('ยกเลิกคำเชิญแล้ว');
      } else {
        const response = await adminApiFetch(`/admin/access/invitations/${item.adminUserId}/reissue`, { method: 'POST', body: JSON.stringify({ expiresInHours: 24 }) });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.token) throw new Error('reissue');
        setLatestLink(`${window.location.origin}/accept-invitation?token=${encodeURIComponent(payload.token)}`);
        setMessage('ออกลิงก์ใหม่แล้ว Token จะแสดงเพียงครั้งเดียว');
      }
      await load();
    } catch {
      setMessage(type === 'revoke' ? 'ยกเลิกคำเชิญไม่สำเร็จ กรุณาลองใหม่' : 'ออกลิงก์ใหม่ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
      setPendingAction(null);
    }
  }

  async function copyLatestLink() {
    if (!latestLink) return;
    try { await navigator.clipboard.writeText(latestLink); setMessage('คัดลอกลิงก์แล้ว'); }
    catch { setMessage('คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องด้านล่าง'); }
  }

  return <AdminPage eyebrow="Security" title="คำเชิญผู้ดูแล" description="สร้าง ยกเลิก และออกลิงก์เชิญใหม่จากหน้าที่แยกเฉพาะ" actions={<AdminButton tone="secondary" disabled={loading || Boolean(busyKey)} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ไม่ได้') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <InviteAdminPanel roles={roles} onCreated={load} />
    {latestLink && <AdminCard title="ลิงก์ล่าสุด" description="แสดงเพียงครั้งเดียว กรุณาคัดลอกทันที"><textarea readOnly value={latestLink} rows={3} style={linkStyle} /><div style={{ marginTop: 10 }}><AdminButton onClick={copyLatestLink}>คัดลอกลิงก์</AdminButton></div></AdminCard>}
    <AdminCard title="รายการคำเชิญ" description={`${normalizedItems.length} รายการล่าสุด`}>
      <AdminStack>{normalizedItems.map((item) => <AdminSectionRow key={item.adminUserId}><div style={itemStyle}><div style={badgeStyle}><AdminBadge tone={statusTone(item.invitationStatus)}>{statusLabel(item.invitationStatus)}</AdminBadge><AdminBadge tone={item.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>{accountStatusLabel(item.accountStatus)}</AdminBadge>{item.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}</div><strong>{item.email}</strong><span>{item.roles.map((role) => role.code).join(', ') || 'ไม่มี Role'}</span><small>หมดอายุ: {new Date(item.expiresAt).toLocaleString('th-TH')}</small></div>{!item.protected && item.accountStatus === 'LOCKED' && <AdminPermissionGate anyOf={ADMIN_ACTION_PERMISSIONS.adminInvitationManage}><div style={actionStyle}><AdminButton disabled={Boolean(busyKey)} onClick={() => setPendingAction({ type: 'reissue', item })}>ออกลิงก์ใหม่</AdminButton><AdminButton tone="danger" disabled={Boolean(busyKey)} onClick={() => setPendingAction({ type: 'revoke', item })}>ยกเลิก</AdminButton></div></AdminPermissionGate>}</AdminSectionRow>)}{!loading && normalizedItems.length === 0 && <AdminEmpty>ยังไม่มีคำเชิญ</AdminEmpty>}</AdminStack>
    </AdminCard>
    <AdminConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.type === 'reissue' ? 'ออกลิงก์ใหม่' : 'ยกเลิกคำเชิญ'} description={pendingAction ? `${pendingAction.type === 'reissue' ? 'ออกลิงก์ใหม่และยกเลิกลิงก์เดิมของ' : 'ยกเลิกคำเชิญของ'} ${pendingAction.item.email}` : ''} confirmLabel={pendingAction?.type === 'reissue' ? 'ออกลิงก์ใหม่' : 'ยืนยันยกเลิก'} tone={pendingAction?.type === 'revoke' ? 'danger' : 'primary'} busy={Boolean(busyKey)} onCancel={() => setPendingAction(null)} onConfirm={() => void executeAction()} />
  </AdminPage>;
}

function normalizeInvitationStatus(item: Invitation) { const raw = String(item.invitationStatus || '').toUpperCase(); if (item.usedAt || raw === 'USED' || raw === 'ACCEPTED') return 'USED'; if (raw === 'REVOKED' || raw === 'CANCELLED' || raw === 'CANCELED') return 'REVOKED'; if (new Date(item.expiresAt).getTime() <= Date.now() || raw === 'EXPIRED') return 'EXPIRED'; return 'ACTIVE'; }
function statusTone(status: string) { return status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'warning' : status === 'USED' ? 'neutral' : 'danger'; }
function statusLabel(status: string) { return ({ ACTIVE: 'ใช้งานได้', EXPIRED: 'หมดอายุ', USED: 'ใช้แล้ว', REVOKED: 'ยกเลิกแล้ว' } as Record<string, string>)[status] ?? status; }
function accountStatusLabel(status: string) { return ({ ACTIVE: 'เปิดใช้งาน', LOCKED: 'รอรับคำเชิญ', SUSPENDED: 'ระงับ' } as Record<string, string>)[status] ?? status; }
const itemStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const badgeStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'start' };
const linkStyle = { width: '100%', resize: 'vertical' as const, borderRadius: 12, border: '1px solid rgba(148,163,184,.26)', background: '#070d18', color: '#f8fafc', padding: 12, boxSizing: 'border-box' as const, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
