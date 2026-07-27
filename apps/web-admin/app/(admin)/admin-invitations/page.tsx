'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { ADMIN_ACTION_PERMISSIONS } from '../_components/admin-permission-contract';
import { AdminPermissionGate } from '../_components/admin-permissions';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminNotice,
  AdminPage,
  AdminSectionRow,
  AdminStack,
} from '../_components/admin-ui';
import InviteAdminPanel from '../access/invite-admin-panel';

type Role = { id: string; code: string; name: string; level: number; hasWildcard: boolean };
type InvitationRole = { id: string; code: string; name: string; level: number };
type Invitation = {
  adminUserId: string;
  email: string;
  username?: string;
  accountStatus: string;
  invitationStatus: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string | null;
  protected?: boolean;
  roles: InvitationRole[];
};
type PendingAction = { type: 'revoke' | 'reissue'; item: Invitation } | null;

type LoadResult = {
  rolesOk: boolean;
  invitationsOk: boolean;
};

const INVITATION_LINK_TTL_MS = 60_000;

export default function AdminInvitationsPage() {
  const loadRequestRef = useRef(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [items, setItems] = useState<Invitation[]>([]);
  const [message, setMessage] = useState('กำลังโหลดคำเชิญ...');
  const [busyKey, setBusyKey] = useState('');
  const [latestLink, setLatestLink] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(true);
  const pageBusy = loading || Boolean(busyKey);

  const load = useCallback(async (): Promise<LoadResult> => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setLoading(true);
    setMessage('กำลังโหลดคำเชิญ...');

    let rolesOk = false;
    let invitationsOk = false;

    try {
      const response = await adminApiFetch('/admin/access/invitations/roles');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) throw new Error('roles');
      if (loadRequestRef.current !== requestId) return { rolesOk: false, invitationsOk: false };
      setRoles(payload.items.filter(isRole));
      rolesOk = true;
    } catch {
      if (loadRequestRef.current === requestId) setRoles([]);
    }

    try {
      const response = await adminApiFetch('/admin/access/invitations');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) throw new Error('invitations');
      if (loadRequestRef.current !== requestId) return { rolesOk, invitationsOk: false };
      setItems(payload.items.filter(isInvitation));
      invitationsOk = true;
    } catch {
      if (loadRequestRef.current === requestId) setItems([]);
    }

    if (loadRequestRef.current === requestId) {
      if (rolesOk && invitationsOk) setMessage('');
      else if (invitationsOk) setMessage('โหลดรายการคำเชิญแล้ว แต่โหลดบทบาทไม่สำเร็จ จึงยังสร้างคำเชิญใหม่ไม่ได้');
      else if (rolesOk) setMessage('โหลดบทบาทแล้ว แต่โหลดรายการคำเชิญไม่สำเร็จ กรุณารีเฟรช');
      else setMessage('โหลดคำเชิญไม่สำเร็จ กรุณาลองใหม่');
      setLoading(false);
    }

    return { rolesOk, invitationsOk };
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!latestLink) return;
    const timer = window.setTimeout(() => {
      setLatestLink('');
      setMessage('ลิงก์คำเชิญถูกล้างจากหน้าจอแล้วเพื่อความปลอดภัย');
    }, INVITATION_LINK_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [latestLink]);

  const normalizedItems = useMemo(
    () => items.map((item) => ({ ...item, invitationStatus: normalizeInvitationStatus(item) })),
    [items],
  );

  async function executeAction() {
    if (!pendingAction || pageBusy) return;
    const { item, type } = pendingAction;
    const key = `${item.adminUserId}:${type}`;
    setBusyKey(key);
    setMessage('');
    let reissuedLink = '';

    try {
      if (type === 'revoke') {
        const response = await adminApiFetch(`/admin/access/invitations/${encodeURIComponent(item.adminUserId)}`, { method: 'DELETE' });
        await response.json().catch(() => null);
        if (!response.ok) throw new Error('revoke');
        setLatestLink('');
        setMessage('ยกเลิกคำเชิญแล้ว');
      } else {
        const response = await adminApiFetch(`/admin/access/invitations/${encodeURIComponent(item.adminUserId)}/reissue`, {
          method: 'POST',
          body: JSON.stringify({ expiresInHours: 24 }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isRecord(payload) || typeof payload.token !== 'string' || payload.token.trim().length < 32) {
          throw new Error('reissue');
        }
        reissuedLink = `${window.location.origin}/accept-invitation?token=${encodeURIComponent(payload.token.trim())}`;
      }

      await load();
      if (reissuedLink) {
        setLatestLink(reissuedLink);
        setMessage('ออกลิงก์ใหม่แล้ว ลิงก์จะแสดง 60 วินาทีและ Token จะแสดงเพียงครั้งเดียว');
      }
      setPendingAction(null);
    } catch {
      setMessage(type === 'revoke'
        ? 'ยกเลิกคำเชิญไม่สำเร็จ กรุณาลองใหม่'
        : 'ออกลิงก์ใหม่ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  async function copyLatestLink() {
    if (!latestLink || pageBusy) return;
    try {
      await navigator.clipboard.writeText(latestLink);
      setMessage('คัดลอกลิงก์แล้ว กรุณาส่งผ่านช่องทางที่ปลอดภัย');
    } catch {
      setMessage('คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องด้านล่าง');
    }
  }

  function clearLatestLink() {
    if (pageBusy) return;
    setLatestLink('');
    setMessage('ล้างลิงก์คำเชิญจากหน้าจอแล้ว');
  }

  return <AdminPage
    eyebrow="ความปลอดภัย"
    title="คำเชิญผู้ดูแล"
    description="สร้าง ยกเลิก และออกลิงก์เชิญใหม่จากหน้าที่แยกเฉพาะ"
    actions={<AdminButton tone="secondary" disabled={pageBusy} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}
  >
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ไม่ได้') ? 'danger' : message.includes('ยังสร้าง') ? 'warning' : 'neutral'}>{message}</AdminNotice>}

    <InviteAdminPanel roles={roles} onCreated={async () => { await load(); }} />

    {latestLink && <AdminCard title="ลิงก์ล่าสุด" description="แสดงชั่วคราว 60 วินาที กรุณาคัดลอกและส่งผ่านช่องทางที่ปลอดภัย">
      <textarea readOnly value={latestLink} rows={3} style={linkStyle} aria-label="ลิงก์คำเชิญล่าสุด" />
      <div style={linkActionStyle}>
        <AdminButton onClick={() => void copyLatestLink()} disabled={pageBusy}>คัดลอกลิงก์</AdminButton>
        <AdminButton tone="secondary" onClick={clearLatestLink} disabled={pageBusy}>ล้างจากหน้าจอ</AdminButton>
      </div>
    </AdminCard>}

    <AdminCard title="รายการคำเชิญ" description={`${normalizedItems.length} รายการล่าสุด`}>
      <AdminStack>
        {normalizedItems.map((item) => <AdminSectionRow key={item.adminUserId}>
          <div style={itemStyle}>
            <div style={badgeStyle}>
              <AdminBadge tone={statusTone(item.invitationStatus)}>{statusLabel(item.invitationStatus)}</AdminBadge>
              <AdminBadge tone={item.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>{accountStatusLabel(item.accountStatus)}</AdminBadge>
              {item.protected && <AdminBadge tone="danger">ป้องกัน</AdminBadge>}
            </div>
            <strong>{item.email}</strong>
            <span>{item.roles.map((role) => role.code).join(', ') || 'ไม่มีบทบาท'}</span>
            <small>สร้างเมื่อ: {formatDate(item.createdAt)} · หมดอายุ: {formatDate(item.expiresAt)}</small>
          </div>
          {!item.protected && item.accountStatus === 'LOCKED' && <AdminPermissionGate anyOf={ADMIN_ACTION_PERMISSIONS.adminInvitationManage}>
            <div style={actionStyle}>
              <AdminButton disabled={pageBusy} onClick={() => setPendingAction({ type: 'reissue', item })}>ออกลิงก์ใหม่</AdminButton>
              <AdminButton tone="danger" disabled={pageBusy} onClick={() => setPendingAction({ type: 'revoke', item })}>ยกเลิก</AdminButton>
            </div>
          </AdminPermissionGate>}
        </AdminSectionRow>)}
        {!loading && normalizedItems.length === 0 && <AdminEmpty>ยังไม่มีคำเชิญ</AdminEmpty>}
      </AdminStack>
    </AdminCard>

    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={pendingAction?.type === 'reissue' ? 'ออกลิงก์ใหม่' : 'ยกเลิกคำเชิญ'}
      description={pendingAction ? `${pendingAction.type === 'reissue' ? 'ออกลิงก์ใหม่และยกเลิกลิงก์เดิมของ' : 'ยกเลิกคำเชิญของ'} ${pendingAction.item.email}` : ''}
      confirmLabel={pendingAction?.type === 'reissue' ? 'ออกลิงก์ใหม่' : 'ยืนยันยกเลิก'}
      tone={pendingAction?.type === 'revoke' ? 'danger' : 'primary'}
      busy={Boolean(busyKey)}
      onCancel={() => { if (!busyKey) setPendingAction(null); }}
      onConfirm={() => void executeAction()}
      details={pendingAction ? <div style={confirmDetailsStyle}><strong>Role</strong><p>{pendingAction.item.roles.map((role) => role.code).join(', ') || 'ไม่มีบทบาท'}</p><strong>หมดอายุเดิม</strong><p>{formatDate(pendingAction.item.expiresAt)}</p></div> : null}
    />
  </AdminPage>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isRole(value: unknown): value is Role {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && Number.isFinite(Number(value.level))
    && typeof value.hasWildcard === 'boolean';
}

function isInvitationRole(value: unknown): value is InvitationRole {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && Number.isFinite(Number(value.level));
}

function isInvitation(value: unknown): value is Invitation {
  return isRecord(value)
    && typeof value.adminUserId === 'string'
    && typeof value.email === 'string'
    && typeof value.accountStatus === 'string'
    && typeof value.invitationStatus === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.expiresAt === 'string'
    && Array.isArray(value.roles)
    && value.roles.every(isInvitationRole);
}

function normalizeInvitationStatus(item: Invitation) {
  const raw = String(item.invitationStatus || '').toUpperCase();
  if (item.usedAt || raw === 'USED' || raw === 'ACCEPTED') return 'USED';
  if (raw === 'REVOKED' || raw === 'CANCELLED' || raw === 'CANCELED') return 'REVOKED';
  const expiresAt = new Date(item.expiresAt).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || raw === 'EXPIRED') return 'EXPIRED';
  return 'ACTIVE';
}

function statusTone(status: string) {
  return status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'warning' : status === 'USED' ? 'neutral' : 'danger';
}

function statusLabel(status: string) {
  return ({ ACTIVE: 'ใช้งานได้', EXPIRED: 'หมดอายุ', USED: 'ใช้แล้ว', REVOKED: 'ยกเลิกแล้ว' } as Record<string, string>)[status] ?? status;
}

function accountStatusLabel(status: string) {
  return ({ ACTIVE: 'เปิดใช้งาน', LOCKED: 'รอรับคำเชิญ', SUSPENDED: 'ระงับ' } as Record<string, string>)[status] ?? status;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
}

const itemStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const badgeStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'start' };
const linkActionStyle = { marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const linkStyle = { width: '100%', resize: 'vertical' as const, borderRadius: 12, border: '1px solid rgba(148,163,184,.26)', background: '#070d18', color: '#f8fafc', padding: 12, boxSizing: 'border-box' as const, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const confirmDetailsStyle = { display: 'grid', gap: 6, overflowWrap: 'anywhere' as const };
