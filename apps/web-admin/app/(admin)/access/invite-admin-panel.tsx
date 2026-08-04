'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { ADMIN_ACTION_PERMISSIONS } from '../_components/admin-permission-contract';
import { AdminPermissionGate } from '../_components/admin-permissions';
import { AdminBadge, AdminButton, AdminCard, AdminNotice } from '../_components/admin-ui';

type Role = {
  id: string;
  code: string;
  name: string;
  level: number;
  hasWildcard: boolean;
};

type InvitationRole = {
  id: string;
  code: string;
  name: string;
  level?: number;
};

type InvitationResult = {
  invitation: {
    email: string;
    expiresAt: string;
    department?: string | null;
    primaryRole: InvitationRole;
    roles: InvitationRole[];
    permissionCodes?: string[];
  };
  token: string;
  tokenVisibleOnce: boolean;
};

type RolePreview = {
  grantable: boolean;
  reason?: string | null;
  primaryRole: InvitationRole;
  roles: InvitationRole[];
  permissionCodes: string[];
  modules: string[];
  permissionCount: number;
};

type Props = {
  roles: Role[];
  onCreated: () => unknown | Promise<unknown>;
};

type NoticeState = {
  text: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
};

const TOKEN_DISPLAY_TTL_MS = 60_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROLES = 8;

export default function InviteAdminPanel({ roles, onCreated }: Props) {
  const [email, setEmail] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [primaryRoleId, setPrimaryRoleId] = useState('');
  const [department, setDepartment] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [preview, setPreview] = useState<RolePreview | null>(null);
  const [result, setResult] = useState<InvitationResult | null>(null);

  const selectableRoles = useMemo(
    () =>
      roles.filter(
        (role) => !role.hasWildcard && !['owner', 'super_admin'].includes(role.code),
      ),
    [roles],
  );
  const selectedRoles = useMemo(
    () => selectableRoles.filter((role) => selectedRoleIds.includes(role.id)),
    [selectableRoles, selectedRoleIds],
  );

  const invitationLink =
    result && typeof window !== 'undefined'
      ? `${window.location.origin}/accept-invitation?token=${encodeURIComponent(result.token)}`
      : '';

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => {
      setResult(null);
      setNotice({
        text: 'ลิงก์คำเชิญถูกล้างจากหน้าจอแล้วเพื่อความปลอดภัย',
        tone: 'neutral',
      });
    }, TOKEN_DISPLAY_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [result]);

  useEffect(() => {
    if (primaryRoleId && selectedRoleIds.includes(primaryRoleId)) return;
    setPrimaryRoleId(selectedRoleIds[0] ?? '');
  }, [primaryRoleId, selectedRoleIds]);

  function toggleRole(roleId: string) {
    if (busy || previewBusy) return;
    setPreview(null);
    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) return current.filter((id) => id !== roleId);
      if (current.length >= MAX_ROLES) {
        setNotice({ text: `เลือกได้ไม่เกิน ${MAX_ROLES} บทบาท`, tone: 'warning' });
        return current;
      }
      return [...current, roleId];
    });
  }

  async function loadPreview(): Promise<RolePreview | null> {
    if (selectedRoleIds.length === 0) {
      setNotice({ text: 'กรุณาเลือกอย่างน้อยหนึ่งบทบาท', tone: 'danger' });
      return null;
    }
    if (!primaryRoleId || !selectedRoleIds.includes(primaryRoleId)) {
      setNotice({
        text: 'กรุณาเลือกบทบาทหลักจากบทบาทที่เลือกไว้',
        tone: 'danger',
      });
      return null;
    }

    setPreviewBusy(true);
    try {
      const response = await adminApiFetch('/admin/access/role-preview', {
        method: 'POST',
        body: JSON.stringify({ roleIds: selectedRoleIds, primaryRoleId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRolePreview(payload)) {
        setNotice({
          text: 'ตรวจสิทธิ์บทบาทไม่สำเร็จ กรุณาลองใหม่',
          tone: 'danger',
        });
        return null;
      }
      setPreview(payload);
      setNotice(
        payload.grantable
          ? {
              text: 'ตรวจบทบาทและสิทธิ์แล้ว สามารถสร้างคำเชิญได้',
              tone: 'success',
            }
          : {
              text: payload.reason || 'บัญชีนี้ไม่มีสิทธิ์มอบบทบาทที่เลือก',
              tone: 'danger',
            },
      );
      return payload;
    } catch {
      setNotice({
        text: 'เชื่อมต่อระบบตรวจสิทธิ์ไม่สำเร็จ กรุณาลองใหม่',
        tone: 'danger',
      });
      return null;
    } finally {
      setPreviewBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || previewBusy) return;
    setNotice(null);
    setResult(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setNotice({ text: 'กรุณากรอกอีเมลให้ถูกต้อง', tone: 'danger' });
      return;
    }
    if (
      selectedRoleIds.length === 0 ||
      selectedRoleIds.some(
        (id) => !selectableRoles.some((role) => role.id === id),
      )
    ) {
      setNotice({
        text: 'กรุณาเลือกบทบาทที่บัญชีนี้มีสิทธิ์มอบให้',
        tone: 'danger',
      });
      return;
    }
    if (!primaryRoleId || !selectedRoleIds.includes(primaryRoleId)) {
      setNotice({ text: 'กรุณาเลือกบทบาทหลัก', tone: 'danger' });
      return;
    }
    if (
      !Number.isInteger(expiresInHours) ||
      expiresInHours < 1 ||
      expiresInHours > 720
    ) {
      setNotice({
        text: 'อายุคำเชิญต้องอยู่ระหว่าง 1 ถึง 720 ชั่วโมง',
        tone: 'danger',
      });
      return;
    }

    const checkedPreview =
      preview &&
      preview.primaryRole.id === primaryRoleId &&
      sameIds(
        preview.roles.map((role) => role.id),
        selectedRoleIds,
      )
        ? preview
        : await loadPreview();
    if (!checkedPreview?.grantable) return;

    setBusy(true);
    try {
      const response = await adminApiFetch('/admin/access/invitations', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          roleIds: selectedRoleIds,
          primaryRoleId,
          department: department.trim() || undefined,
          expiresInHours,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isInvitationResult(payload)) {
        setNotice({
          text: 'สร้างคำเชิญไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองใหม่',
          tone: 'danger',
        });
        return;
      }

      setResult(payload);
      setEmail('');
      setSelectedRoleIds([]);
      setPrimaryRoleId('');
      setDepartment('');
      setExpiresInHours(24);
      setPreview(null);
      const refreshResult = await Promise.resolve(onCreated());
      const refreshComplete = refreshResult !== false;
      setNotice(
        refreshComplete
          ? {
              text: 'สร้างคำเชิญแล้ว ลิงก์และรหัสเชิญจะแสดงเพียง 60 วินาที',
              tone: 'success',
            }
          : {
              text: 'สร้างคำเชิญแล้ว แต่รีเฟรชข้อมูลไม่ครบ กรุณาลองรีเฟรชอีกครั้ง',
              tone: 'warning',
            },
      );
    } catch {
      setNotice({
        text: 'เชื่อมต่อระบบคำเชิญไม่สำเร็จ กรุณาลองใหม่',
        tone: 'danger',
      });
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!invitationLink || busy) return;
    try {
      await navigator.clipboard.writeText(invitationLink);
      setNotice({
        text: 'คัดลอกลิงก์คำเชิญแล้ว กรุณาส่งผ่านช่องทางที่ปลอดภัย',
        tone: 'success',
      });
    } catch {
      setNotice({
        text: 'คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกจากช่องด้านล่าง',
        tone: 'warning',
      });
    }
  }

  function clearResult() {
    if (busy) return;
    setResult(null);
    setNotice({ text: 'ล้างลิงก์คำเชิญจากหน้าจอแล้ว', tone: 'neutral' });
  }

  return (
    <AdminPermissionGate anyOf={ADMIN_ACTION_PERMISSIONS.adminInvitationManage}>
      <AdminCard
        title="เชิญผู้ดูแลระบบ"
        description="เลือกหลายบทบาท กำหนดบทบาทหลัก และตรวจสิทธิ์ก่อนสร้างบัญชี"
      >
        {notice && <AdminNotice tone={notice.tone}>{notice.text}</AdminNotice>}
        <form onSubmit={submit} style={formStyle}>
          <label style={fieldStyle}>
            อีเมลผู้รับคำเชิญ
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={254}
              placeholder="admin@example.com"
              disabled={busy}
              style={inputStyle}
            />
          </label>
          <label style={fieldStyle}>
            แผนก
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              maxLength={120}
              placeholder="เช่น Finance Operations"
              disabled={busy}
              style={inputStyle}
            />
          </label>
          <label style={fieldStyle}>
            บทบาทหลัก
            <select
              value={primaryRoleId}
              onChange={(event) => {
                setPrimaryRoleId(event.target.value);
                setPreview(null);
              }}
              disabled={busy || selectedRoles.length === 0}
              style={inputStyle}
            >
              <option value="">เลือกบทบาทหลัก</option>
              {selectedRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </label>
          <label style={fieldStyle}>
            อายุคำเชิญ
            <select
              value={expiresInHours}
              onChange={(event) => setExpiresInHours(Number(event.target.value))}
              disabled={busy}
              style={inputStyle}
            >
              <option value={1}>1 ชั่วโมง</option>
              <option value={12}>12 ชั่วโมง</option>
              <option value={24}>24 ชั่วโมง</option>
              <option value={72}>3 วัน</option>
              <option value={168}>7 วัน</option>
            </select>
          </label>

          <fieldset style={roleFieldsetStyle} disabled={busy || previewBusy}>
            <legend style={legendStyle}>
              บทบาทเสริม ({selectedRoleIds.length}/{MAX_ROLES})
            </legend>
            <div style={roleGridStyle}>
              {selectableRoles.map((role) => (
                <label key={role.id} style={roleOptionStyle}>
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span>
                    <strong>{role.name}</strong>
                    <small>
                      {role.code} · ระดับ {role.level}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div style={actionStyle}>
            <AdminButton
              type="button"
              tone="secondary"
              disabled={busy || previewBusy || selectedRoleIds.length === 0}
              onClick={() => void loadPreview()}
            >
              {previewBusy ? 'กำลังตรวจ...' : 'ตรวจสิทธิ์ก่อนสร้าง'}
            </AdminButton>
            <AdminButton
              disabled={busy || previewBusy || selectableRoles.length === 0}
            >
              {busy ? 'กำลังสร้าง...' : 'สร้างคำเชิญ'}
            </AdminButton>
          </div>
        </form>

        {selectableRoles.length === 0 && (
          <AdminNotice tone="warning">
            ไม่มีบทบาทที่บัญชีนี้มีสิทธิ์มอบให้
          </AdminNotice>
        )}

        {preview && (
          <div style={previewStyle}>
            <div style={badgeRowStyle}>
              <AdminBadge tone={preview.grantable ? 'success' : 'danger'}>
                {preview.grantable ? 'มอบได้' : 'มอบไม่ได้'}
              </AdminBadge>
              <AdminBadge>{preview.permissionCount} สิทธิ์</AdminBadge>
            </div>
            <strong>บทบาทหลัก: {preview.primaryRole.name}</strong>
            <span>
              บทบาททั้งหมด: {preview.roles.map((role) => role.name).join(', ')}
            </span>
            <span>โมดูล: {preview.modules.join(', ') || '-'}</span>
          </div>
        )}

        {result && (
          <div style={resultStyle}>
            <strong>{result.invitation.email}</strong>
            <span>บทบาทหลัก: {result.invitation.primaryRole.name}</span>
            <span>
              บทบาททั้งหมด:{' '}
              {result.invitation.roles.map((role) => role.name).join(', ')}
            </span>
            {result.invitation.department && (
              <span>แผนก: {result.invitation.department}</span>
            )}
            <span>หมดอายุ: {formatDate(result.invitation.expiresAt)}</span>
            <textarea
              value={invitationLink}
              readOnly
              rows={3}
              style={linkStyle}
              aria-label="ลิงก์คำเชิญ"
            />
            <div style={resultActionStyle}>
              <AdminButton onClick={() => void copyLink()} disabled={busy}>
                คัดลอกลิงก์
              </AdminButton>
              <AdminButton tone="secondary" onClick={clearResult} disabled={busy}>
                ล้างจากหน้าจอ
              </AdminButton>
            </div>
          </div>
        )}
      </AdminCard>
    </AdminPermissionGate>
  );
}

function sameIds(left: string[], right: string[]) {
  const sortedRight = [...right].sort();
  return (
    left.length === right.length &&
    [...left].sort().every((id, index) => id === sortedRight[index])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isInvitationRole(value: unknown): value is InvitationRole {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.code === 'string' &&
    typeof value.name === 'string'
  );
}

function isInvitationResult(value: unknown): value is InvitationResult {
  if (!isRecord(value) || !isRecord(value.invitation)) return false;
  return (
    typeof value.token === 'string' &&
    value.token.trim().length >= 32 &&
    value.tokenVisibleOnce === true &&
    typeof value.invitation.email === 'string' &&
    typeof value.invitation.expiresAt === 'string' &&
    isInvitationRole(value.invitation.primaryRole) &&
    Array.isArray(value.invitation.roles) &&
    value.invitation.roles.every(isInvitationRole)
  );
}

function isRolePreview(value: unknown): value is RolePreview {
  return (
    isRecord(value) &&
    typeof value.grantable === 'boolean' &&
    isInvitationRole(value.primaryRole) &&
    Array.isArray(value.roles) &&
    value.roles.every(isInvitationRole) &&
    Array.isArray(value.permissionCodes) &&
    value.permissionCodes.every((item) => typeof item === 'string') &&
    Array.isArray(value.modules) &&
    value.modules.every((item) => typeof item === 'string') &&
    typeof value.permissionCount === 'number'
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
}

const formStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
  gap: 12,
  alignItems: 'end',
} as const;
const fieldStyle = { display: 'grid', gap: 7, fontWeight: 850, fontSize: 14 } as const;
const inputStyle = {
  width: '100%',
  minHeight: 46,
  borderRadius: 12,
  border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
  background: 'var(--admin-surface-input, transparent)',
  color: 'inherit',
  padding: '0 12px',
  boxSizing: 'border-box',
} as const;
const roleFieldsetStyle = {
  gridColumn: '1 / -1',
  border: '1px solid color-mix(in srgb, currentColor 16%, transparent)',
  borderRadius: 14,
  padding: 12,
  minWidth: 0,
} as const;
const legendStyle = { padding: '0 6px', fontWeight: 850 } as const;
const roleGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(210px, 100%), 1fr))',
  gap: 8,
} as const;
const roleOptionStyle = {
  display: 'flex',
  gap: 9,
  alignItems: 'flex-start',
  padding: 10,
  borderRadius: 11,
  border: '1px solid color-mix(in srgb, currentColor 12%, transparent)',
} as const;
const actionStyle = {
  gridColumn: '1 / -1',
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap' as const,
};
const previewStyle = {
  marginTop: 14,
  display: 'grid',
  gap: 8,
  border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
  borderRadius: 14,
  padding: 14,
} as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const resultStyle = {
  marginTop: 14,
  display: 'grid',
  gap: 9,
  border: '1px solid color-mix(in srgb, currentColor 20%, transparent)',
  borderRadius: 14,
  padding: 14,
} as const;
const resultActionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const linkStyle = {
  width: '100%',
  resize: 'vertical' as const,
  borderRadius: 12,
  border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
  background: 'var(--admin-surface-input, transparent)',
  color: 'inherit',
  padding: 12,
  boxSizing: 'border-box' as const,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  overflowWrap: 'anywhere' as const,
};
