'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminNotice, AdminSectionRow, AdminStack } from '../_components/admin-ui';

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
  const [pendingAction, setPendingAction] = useState<{ item: Invitation; action: 'revoke' | 'reissue' } | null>(null);

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
      setPendingAction(null);
    }
  }

  async function reissue(item: Invitation) {
    if (!allowed || item.protected || item.accountStatus !== 'LOCKED') return;
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
      setPendingAction(null);
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
    {reissueResult && <div className="admin-invitation-list__result">
      <strong>{reissueResult.email}</strong>
      <span>หมดอายุ: {new Date(reissueResult.expiresAt).toLocaleString('th-TH')}</span>
      <textarea value={invitationLink} readOnly rows={3} className="admin-invitation-list__link" aria-label="Reissued invitation link" />
      <AdminButton onClick={copyLink}>คัดลอกลิงก์ใหม่</AdminButton>
    </div>}
    {loading ? <AdminNotice>กำลังโหลดรายการคำเชิญ...</AdminNotice> : <AdminStack>
      {items.map((item) => {
        const active = item.invitationStatus === 'ACTIVE';
        const actionable = item.accountStatus === 'LOCKED' && !item.protected;
        return <AdminSectionRow key={item.adminUserId}>
          <div className="admin-invitation-list__info">
            <div className="admin-invitation-list__badges">
              <AdminBadge tone={active ? 'success' : item.invitationStatus === 'EXPIRED' ? 'warning' : 'neutral'}>{item.invitationStatus}</AdminBadge>
              <AdminBadge tone={item.accountStatus === 'ACTIVE' ? 'success' : 'warning'}>{item.accountStatus}</AdminBadge>
              {item.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}
            </div>
            <strong>{item.email}</strong>
            <span className="admin-invitation-list__muted">{item.roles.map((role) => role.code).join(', ') || 'ไม่มี Role'}</span>
            <span className="admin-invitation-list__muted">หมดอายุ: {new Date(item.expiresAt).toLocaleString('th-TH')}</span>
          </div>
          {actionable && <div className="admin-invitation-list__actions">
            <AdminButton disabled={Boolean(busyKey)} onClick={() => setPendingAction({ item, action: 'reissue' })}>ออกลิงก์ใหม่</AdminButton>
            <AdminButton disabled={Boolean(busyKey)} tone="danger" onClick={() => setPendingAction({ item, action: 'revoke' })}>ยกเลิกคำเชิญ</AdminButton>
          </div>}
        </AdminSectionRow>;
      })}
      {items.length === 0 && <AdminEmpty>ยังไม่มีคำเชิญผู้ดูแลระบบ</AdminEmpty>}
    </AdminStack>}
    <AdminConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.action === 'reissue' ? 'ออกลิงก์คำเชิญใหม่' : 'ยกเลิกคำเชิญ'} description={pendingAction?.action === 'reissue' ? 'ลิงก์เดิมจะใช้งานไม่ได้ทันที และลิงก์ใหม่จะแสดงเพียงครั้งเดียวหลังยืนยัน' : 'ผู้รับจะไม่สามารถใช้ลิงก์คำเชิญนี้เพื่อสร้างบัญชีผู้ดูแลได้'} confirmLabel={pendingAction?.action === 'reissue' ? 'ออกลิงก์ใหม่' : 'ยกเลิกคำเชิญ'} tone={pendingAction?.action === 'reissue' ? 'primary' : 'danger'} busy={Boolean(pendingAction && busyKey === `${pendingAction.item.adminUserId}:${pendingAction.action}`)} details={pendingAction ? <p><strong>ผู้รับ:</strong> {pendingAction.item.email}</p> : null} onCancel={() => { if (!busyKey) setPendingAction(null); }} onConfirm={() => { if (!pendingAction) return; void (pendingAction.action === 'reissue' ? reissue(pendingAction.item) : revoke(pendingAction.item)); }} />
  </AdminCard>;
}
