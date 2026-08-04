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
  AdminLinkButton,
  AdminNotice,
  AdminPage,
  AdminSkeleton,
} from '../_components/admin-ui';
import InviteAdminPanel from '../access/invite-admin-panel';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';
import styles from './admin-invitations.module.css';

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
type NoticeState = { text: string; tone: 'neutral' | 'success' | 'warning' | 'danger' };
type LoadResult = { rolesOk: boolean; invitationsOk: boolean };

const INVITATION_LINK_TTL_MS = 60_000;
const PAGE_SIZE = 20;

export default function AdminInvitationsPage() {
  const loadRequestRef = useRef(0);
  const noticeRef = useRef<NoticeState | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [items, setItems] = useState<Invitation[]>([]);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [rolesAvailable, setRolesAvailable] = useState(true);
  const [invitationsAvailable, setInvitationsAvailable] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [latestLink, setLatestLink] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageBusy = loading || Boolean(busyKey);

  const updateNotice = useCallback((next: NoticeState | null) => {
    noticeRef.current = next;
    setNotice(next);
  }, []);

  const load = useCallback(async (announce = true): Promise<LoadResult> => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setLoading(true);

    const [roleResult, invitationResult] = await Promise.all([
      fetchRoles(),
      fetchInvitations(),
    ]);

    if (loadRequestRef.current !== requestId) {
      return { rolesOk: false, invitationsOk: false };
    }

    const rolesOk = roleResult !== null;
    const invitationsOk = invitationResult !== null;

    if (rolesOk) setRoles(roleResult);
    if (invitationsOk) setItems(invitationResult);
    setRolesAvailable(rolesOk);
    setInvitationsAvailable(invitationsOk);

    if (announce) {
      if (rolesOk && invitationsOk) {
        if (noticeRef.current?.tone !== 'success') updateNotice(null);
      } else if (invitationsOk) {
        updateNotice({ text: 'โหลดรายการคำเชิญแล้ว แต่โหลดบทบาทไม่สำเร็จ จึงยังสร้างคำเชิญใหม่ไม่ได้', tone: 'warning' });
      } else if (rolesOk) {
        updateNotice({ text: 'โหลดบทบาทแล้ว แต่โหลดรายการคำเชิญไม่สำเร็จ ข้อมูลเดิมยังแสดงอยู่', tone: 'warning' });
      } else {
        updateNotice({ text: 'โหลดคำเชิญไม่สำเร็จ กรุณาลองใหม่', tone: 'danger' });
      }
    }

    setLoading(false);
    return { rolesOk, invitationsOk };
  }, [updateNotice]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!latestLink) return undefined;
    const timer = window.setTimeout(() => {
      setLatestLink('');
      updateNotice({ text: 'ลิงก์คำเชิญถูกล้างจากหน้าจอแล้วเพื่อความปลอดภัย', tone: 'neutral' });
    }, INVITATION_LINK_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [latestLink, updateNotice]);

  const normalizedItems = useMemo(
    () => items.map((item) => ({ ...item, invitationStatus: normalizeInvitationStatus(item) })),
    [items],
  );
  const totalPages = Math.max(1, Math.ceil(normalizedItems.length / PAGE_SIZE));
  const visibleItems = normalizedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function executeAction() {
    if (!pendingAction || pageBusy) return;
    const { item, type } = pendingAction;
    const key = `${item.adminUserId}:${type}`;
    setBusyKey(key);
    updateNotice(null);
    let reissuedLink = '';

    try {
      if (type === 'revoke') {
        const response = await adminApiFetch(`/admin/access/invitations/${encodeURIComponent(item.adminUserId)}`, { method: 'DELETE' });
        await response.json().catch(() => null);
        if (!response.ok) throw new Error('revoke');
        setLatestLink('');
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

      const loadResult = await load(false);
      if (reissuedLink) {
        setLatestLink(reissuedLink);
        updateNotice(refreshNotice('ออกลิงก์ใหม่แล้ว ลิงก์และรหัสเชิญจะแสดงเพียง 60 วินาที', loadResult));
      } else {
        updateNotice(refreshNotice('ยกเลิกคำเชิญแล้ว', loadResult));
      }
      setPendingAction(null);
    } catch {
      updateNotice({
        text: type === 'revoke' ? 'ยกเลิกคำเชิญไม่สำเร็จ กรุณาลองใหม่' : 'ออกลิงก์ใหม่ไม่สำเร็จ กรุณาลองใหม่',
        tone: 'danger',
      });
    } finally {
      setBusyKey('');
    }
  }

  async function copyLatestLink() {
    if (!latestLink || pageBusy) return;
    try {
      await navigator.clipboard.writeText(latestLink);
      updateNotice({ text: 'คัดลอกลิงก์แล้ว กรุณาส่งผ่านช่องทางที่ปลอดภัย', tone: 'success' });
    } catch {
      updateNotice({ text: 'คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องด้านล่าง', tone: 'warning' });
    }
  }

  function clearLatestLink() {
    if (pageBusy) return;
    setLatestLink('');
    updateNotice({ text: 'ล้างลิงก์คำเชิญจากหน้าจอแล้ว', tone: 'neutral' });
  }

  async function handleCreated(): Promise<boolean> {
    updateNotice(null);
    const loadResult = await load(false);
    return loadResult.rolesOk && loadResult.invitationsOk;
  }

  const columns = useMemo<readonly AdminDataColumn<Invitation>[]>(() => [
    {
      id: 'status',
      header: 'สถานะ',
      mobileLabel: 'สถานะ',
      priority: 'secondary',
      width: '18%',
      cell: (item) => <span className={styles.badges}>
        <AdminBadge tone={statusTone(item.invitationStatus)}>{statusLabel(item.invitationStatus)}</AdminBadge>
        <AdminBadge tone={item.accountStatus === 'ACTIVE' ? 'success' : 'neutral'}>{accountStatusLabel(item.accountStatus)}</AdminBadge>
        {item.protected ? <AdminBadge tone="danger">ป้องกัน</AdminBadge> : null}
      </span>,
    },
    {
      id: 'identity',
      header: 'ผู้รับคำเชิญ',
      mobileLabel: 'ผู้รับคำเชิญ',
      priority: 'primary',
      width: '26%',
      cell: (item) => <span className={styles.identity}><strong>{item.email}</strong><small>{item.username || item.adminUserId}</small></span>,
    },
    {
      id: 'roles',
      header: 'บทบาท',
      mobileLabel: 'บทบาท',
      priority: 'secondary',
      width: '22%',
      cell: (item) => <span className={styles.roles}><strong>{item.roles.map((role) => role.code).join(', ') || 'ไม่มีบทบาท'}</strong><small>{item.roles.map((role) => role.name).join(', ') || '-'}</small></span>,
    },
    {
      id: 'dates',
      header: 'ระยะเวลา',
      mobileLabel: 'ระยะเวลา',
      priority: 'secondary',
      width: '22%',
      cell: (item) => <span className={styles.dates}><strong>หมดอายุ {formatDate(item.expiresAt)}</strong><small>สร้าง {formatDate(item.createdAt)}</small></span>,
    },
    {
      id: 'actions',
      header: 'การทำงาน',
      mobileLabel: 'การทำงาน',
      priority: 'secondary',
      align: 'end',
      width: '12%',
      cell: (item) => !item.protected && item.accountStatus === 'LOCKED' ? <AdminPermissionGate anyOf={ADMIN_ACTION_PERMISSIONS.adminInvitationManage}>
        <span className={styles.rowActions}>
          <AdminButton size="compact" disabled={pageBusy} onClick={() => setPendingAction({ type: 'reissue', item })}>ออกลิงก์ใหม่</AdminButton>
          <AdminButton size="compact" tone="danger" disabled={pageBusy} onClick={() => setPendingAction({ type: 'revoke', item })}>ยกเลิก</AdminButton>
        </span>
      </AdminPermissionGate> : '-',
    },
  ], [pageBusy]);

  const initialLoading = loading && items.length === 0 && roles.length === 0 && !notice;

  return <AdminPage
    eyebrow="ความปลอดภัย"
    title="คำเชิญผู้ดูแล"
    description="สร้าง ยกเลิก และออกลิงก์เชิญใหม่ พร้อมตรวจบทบาทก่อนส่ง"
    actions={<AdminButton tone="secondary" disabled={pageBusy} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}
  >
    {notice ? <AdminNotice tone={notice.tone}>
      <div className={styles.notice}>
        <span>{notice.text}</span>
        <div className={styles.noticeActions}>
          {!rolesAvailable || !invitationsAvailable ? <AdminButton size="compact" tone="secondary" disabled={pageBusy} onClick={() => void load()}>ลองใหม่</AdminButton> : null}
          {!rolesAvailable ? <AdminLinkButton href="/admin-roles" size="compact" tone="ghost">จัดการบทบาท</AdminLinkButton> : null}
        </div>
      </div>
    </AdminNotice> : null}

    {initialLoading ? <AdminCard title="กำลังโหลดคำเชิญ" description="กำลังตรวจบทบาทและรายการล่าสุด"><AdminSkeleton lines={7} /></AdminCard> : <>
      <InviteAdminPanel roles={roles} onCreated={handleCreated} />

      {latestLink ? <AdminCard title="ลิงก์ล่าสุด" description="แสดงชั่วคราว 60 วินาที กรุณาคัดลอกและส่งผ่านช่องทางที่ปลอดภัย">
        <textarea readOnly value={latestLink} rows={3} className={styles.latestLink} aria-label="ลิงก์คำเชิญล่าสุด" />
        <div className={styles.linkActions}>
          <AdminButton onClick={() => void copyLatestLink()} disabled={pageBusy}>คัดลอกลิงก์</AdminButton>
          <AdminButton tone="secondary" onClick={clearLatestLink} disabled={pageBusy}>ล้างจากหน้าจอ</AdminButton>
        </div>
      </AdminCard> : null}

      <AdminCard title="รายการคำเชิญ" description={`${normalizedItems.length} รายการล่าสุด`}>
        <AdminDataTable
          ariaLabel="รายการคำเชิญผู้ดูแล"
          columns={columns}
          rows={visibleItems}
          rowKey={(item) => item.adminUserId}
          loading={loading}
          emptyTitle={invitationsAvailable ? 'ยังไม่มีคำเชิญ' : 'โหลดรายการคำเชิญไม่สำเร็จ'}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={normalizedItems.length}
          onPageChange={setPage}
          labels={{
            loading: 'กำลังโหลดคำเชิญ',
            empty: 'ยังไม่มีคำเชิญ',
            previousPage: 'หน้าก่อนหน้า',
            nextPage: 'หน้าถัดไป',
            page: (value) => `หน้า ${value.toLocaleString('th-TH')}`,
            rowsPerPage: 'รายการต่อหน้า',
            range: (from, to, total) => `${from.toLocaleString('th-TH')}–${to.toLocaleString('th-TH')} จาก ${total.toLocaleString('th-TH')}`,
          }}
        />
      </AdminCard>
    </>}

    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={pendingAction?.type === 'reissue' ? 'ออกลิงก์ใหม่' : 'ยกเลิกคำเชิญ'}
      description={pendingAction ? `${pendingAction.type === 'reissue' ? 'ออกลิงก์ใหม่และยกเลิกลิงก์เดิมของ' : 'ยกเลิกคำเชิญของ'} ${pendingAction.item.email}` : ''}
      confirmLabel={pendingAction?.type === 'reissue' ? 'ออกลิงก์ใหม่' : 'ยืนยันยกเลิก'}
      tone={pendingAction?.type === 'revoke' ? 'danger' : 'primary'}
      busy={Boolean(busyKey)}
      onCancel={() => { if (!busyKey) setPendingAction(null); }}
      onConfirm={() => void executeAction()}
      details={pendingAction ? <div className={styles.confirmDetails}><strong>บทบาท</strong><p>{pendingAction.item.roles.map((role) => role.code).join(', ') || 'ไม่มีบทบาท'}</p><strong>หมดอายุเดิม</strong><p>{formatDate(pendingAction.item.expiresAt)}</p></div> : null}
    />
  </AdminPage>;
}

async function fetchRoles(): Promise<Role[] | null> {
  try {
    const response = await adminApiFetch('/admin/access/invitations/roles');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) return null;
    return payload.items.filter(isRole);
  } catch {
    return null;
  }
}

async function fetchInvitations(): Promise<Invitation[] | null> {
  try {
    const response = await adminApiFetch('/admin/access/invitations');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) return null;
    return payload.items.filter(isInvitation);
  } catch {
    return null;
  }
}

function refreshNotice(successText: string, result: LoadResult): NoticeState {
  if (result.rolesOk && result.invitationsOk) return { text: successText, tone: 'success' };
  return { text: `${successText} แต่รีเฟรชข้อมูลไม่ครบ กรุณาลองรีเฟรชอีกครั้ง`, tone: 'warning' };
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
