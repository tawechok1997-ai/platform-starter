'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminStack,
} from '../../_components/admin-ui';
import { useAdminSettingsForm } from '../use-admin-settings-form';

type MaintenanceSettings = {
  enabled: boolean;
  member_enabled: boolean;
  admin_enabled: boolean;
  deposit_enabled: boolean;
  withdraw_enabled: boolean;
  provider_enabled: boolean;
  message: string;
  start_time: string;
  end_time: string;
  allow_admin_access: boolean;
  super_admin_only: boolean;
};

const DEFAULTS: MaintenanceSettings = {
  enabled: false,
  member_enabled: false,
  admin_enabled: false,
  deposit_enabled: false,
  withdraw_enabled: false,
  provider_enabled: false,
  message: '',
  start_time: '',
  end_time: '',
  allow_admin_access: false,
  super_admin_only: false,
};

export default function MaintenanceSettingsClient() {
  const {
    form,
    message,
    loading,
    saving,
    isDirty,
    setMessage,
    save,
    reset,
    update,
  } = useAdminSettingsForm<MaintenanceSettings>({
    endpoint: '/admin/settings/maintenance',
    defaults: DEFAULTS,
    loadingMessage: 'กำลังโหลดการตั้งค่าปิดปรับปรุง...',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const affectedServices = useMemo(() => {
    const services: string[] = [];
    if (form.enabled) services.push('ระบบทั้งหมด');
    if (form.member_enabled) services.push('Member');
    if (form.admin_enabled) services.push('Admin');
    if (form.deposit_enabled) services.push('ฝากเงิน');
    if (form.withdraw_enabled) services.push('ถอนเงิน');
    if (form.provider_enabled) services.push('ค่ายเกม');
    return services;
  }, [form]);

  const maintenanceActive = affectedServices.length > 0;
  const busy = loading || saving;

  function validate() {
    if (maintenanceActive && form.message.trim().length < 5) {
      setMessage('กรุณาระบุข้อความแจ้งผู้ใช้ตั้งแต่ 5 ตัวอักษรขึ้นไป');
      return false;
    }
    if (form.super_admin_only && !form.allow_admin_access) {
      setMessage('ต้องเปิด Allow Admin Access ก่อนจำกัดเป็น Super Admin only');
      return false;
    }
    const start = parseOptionalDate(form.start_time);
    const end = parseOptionalDate(form.end_time);
    if (form.start_time && !start) {
      setMessage('เวลาเริ่มต้นไม่ถูกต้อง');
      return false;
    }
    if (form.end_time && !end) {
      setMessage('เวลาสิ้นสุดไม่ถูกต้อง');
      return false;
    }
    if (start && end && start.getTime() >= end.getTime()) {
      setMessage('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น');
      return false;
    }
    return true;
  }

  function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !isDirty || !validate()) return;
    setConfirmOpen(true);
  }

  async function confirmSave() {
    if (busy || !validate()) return;
    const saved = await save();
    if (saved) setConfirmOpen(false);
  }

  return <AdminPage
    eyebrow="Settings"
    title="Maintenance Settings"
    description="เปิดหรือปิดปรับปรุงระบบแบบมีการตรวจสอบผลกระทบก่อนบันทึก"
    actions={<a href="/settings">← Settings</a>}
  >
    {message && <AdminNotice tone={message.includes('ไม่') || message.includes('ต้อง') || message.includes('กรุณา') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    {isDirty && <AdminNotice tone="warning">มีการแก้ไขที่ยังไม่ได้บันทึก ตรวจผลกระทบก่อนยืนยัน</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="สถานะ" value={maintenanceActive ? 'MAINTENANCE' : 'NORMAL'} tone={maintenanceActive ? 'danger' : 'success'} />
      <AdminMetric title="บริการที่ได้รับผลกระทบ" value={String(affectedServices.length)} helper={affectedServices.join(', ') || 'ไม่มี'} tone={affectedServices.length ? 'warning' : 'success'} />
      <AdminMetric title="Admin access" value={form.allow_admin_access ? 'ALLOWED' : 'BLOCKED'} tone={form.allow_admin_access ? 'warning' : 'neutral'} />
      <AdminMetric title="ช่วงเวลา" value={form.start_time || form.end_time ? 'SCHEDULED' : 'MANUAL'} helper={formatRange(form.start_time, form.end_time)} />
    </AdminMetricGrid>

    <form onSubmit={requestSave}>
      <AdminCard title="ขอบเขตการปิดปรับปรุง" description="เลือกเฉพาะบริการที่ต้องหยุด หลีกเลี่ยงการเปิดทั้งระบบโดยไม่จำเป็น">
        <div style={toggleGridStyle}>
          <Toggle label="Maintenance Mode ทั้งระบบ" checked={form.enabled} disabled={busy} onChange={(value) => update('enabled', value)} />
          <Toggle label="Member Maintenance" checked={form.member_enabled} disabled={busy} onChange={(value) => update('member_enabled', value)} />
          <Toggle label="Admin Maintenance" checked={form.admin_enabled} disabled={busy} onChange={(value) => update('admin_enabled', value)} />
          <Toggle label="Deposit Maintenance" checked={form.deposit_enabled} disabled={busy} onChange={(value) => update('deposit_enabled', value)} />
          <Toggle label="Withdraw Maintenance" checked={form.withdraw_enabled} disabled={busy} onChange={(value) => update('withdraw_enabled', value)} />
          <Toggle label="Provider Maintenance" checked={form.provider_enabled} disabled={busy} onChange={(value) => update('provider_enabled', value)} />
        </div>
      </AdminCard>

      <AdminCard title="ข้อความและช่วงเวลา" description="ข้อความนี้จะแสดงต่อผู้ใช้ที่ได้รับผลกระทบ">
        <AdminStack>
          <label style={fieldStyle}>ข้อความแจ้งผู้ใช้
            <textarea
              value={form.message}
              disabled={busy}
              maxLength={1000}
              onChange={(event) => update('message', event.target.value)}
              placeholder="ระบบกำลังปรับปรุง กรุณาลองใหม่ภายหลัง"
              style={textareaStyle}
            />
          </label>
          <div style={dateGridStyle}>
            <label style={fieldStyle}>เวลาเริ่มต้น
              <input type="datetime-local" value={toLocalInputValue(form.start_time)} disabled={busy} onChange={(event) => update('start_time', event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>เวลาสิ้นสุด
              <input type="datetime-local" value={toLocalInputValue(form.end_time)} disabled={busy} onChange={(event) => update('end_time', event.target.value)} style={inputStyle} />
            </label>
          </div>
        </AdminStack>
      </AdminCard>

      <AdminCard title="สิทธิ์ผู้ดูแลระหว่างปิดปรับปรุง" description="คงช่องทางเข้าระบบเฉพาะเมื่อทีมปฏิบัติการต้องแก้ไขเหตุการณ์">
        <AdminStack>
          <Toggle label="Allow Admin Access" checked={form.allow_admin_access} disabled={busy} onChange={(value) => {
            update('allow_admin_access', value);
            if (!value) update('super_admin_only', false);
          }} />
          <Toggle label="Super Admin only" checked={form.super_admin_only} disabled={busy || !form.allow_admin_access} onChange={(value) => update('super_admin_only', value)} />
        </AdminStack>
      </AdminCard>

      <AdminCard title="ผลกระทบก่อนบันทึก" description="ตรวจรายการนี้ก่อนยืนยันทุกครั้ง">
        <AdminStack>
          {affectedServices.length > 0 ? affectedServices.map((service) => <div key={service} style={summaryRowStyle}><strong>{service}</strong><AdminBadge tone="danger">หยุดให้บริการ</AdminBadge></div>) : <div style={summaryRowStyle}><strong>ทุกบริการ</strong><AdminBadge tone="success">เปิดตามปกติ</AdminBadge></div>}
          <div style={summaryRowStyle}><strong>ข้อความ</strong><span>{form.message.trim() || '-'}</span></div>
          <div style={summaryRowStyle}><strong>ช่วงเวลา</strong><span>{formatRange(form.start_time, form.end_time)}</span></div>
        </AdminStack>
      </AdminCard>

      <div style={actionStyle}>
        <AdminButton type="submit" tone={maintenanceActive ? 'danger' : 'primary'} disabled={busy || !isDirty}>{saving ? 'กำลังบันทึก...' : 'ตรวจและบันทึก'}</AdminButton>
        <AdminButton type="button" tone="secondary" disabled={busy || !isDirty} onClick={reset}>Reset</AdminButton>
      </div>
    </form>

    <AdminConfirmDialog
      open={confirmOpen}
      title={maintenanceActive ? 'ยืนยันเปิดโหมดปิดปรับปรุง' : 'ยืนยันกลับสู่การให้บริการปกติ'}
      description={maintenanceActive ? `บริการที่ได้รับผลกระทบ: ${affectedServices.join(', ')}` : 'ระบบจะยกเลิกสถานะปิดปรับปรุงตามค่าที่กำหนด'}
      confirmLabel={maintenanceActive ? 'ยืนยันปิดบริการ' : 'ยืนยันเปิดบริการ'}
      tone={maintenanceActive ? 'danger' : 'primary'}
      busy={saving}
      onCancel={() => { if (!saving) setConfirmOpen(false); }}
      onConfirm={() => void confirmSave()}
      details={<div style={confirmDetailsStyle}><strong>ข้อความผู้ใช้</strong><p>{form.message.trim() || '-'}</p><strong>ช่วงเวลา</strong><p>{formatRange(form.start_time, form.end_time)}</p></div>}
    />
  </AdminPage>;
}

function Toggle({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <label style={toggleStyle}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /> <span>{label}</span></label>;
}

function parseOptionalDate(value: string) {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalInputValue(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatRange(startValue: string, endValue: string) {
  const start = parseOptionalDate(startValue);
  const end = parseOptionalDate(endValue);
  if (!start && !end) return 'ดำเนินการด้วยตนเอง';
  return `${start ? start.toLocaleString('th-TH') : 'ทันที'} → ${end ? end.toLocaleString('th-TH') : 'จนกว่าจะปิดเอง'}`;
}

const toggleGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10 } as const;
const toggleStyle = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(148,163,184,.18)', color: '#e2e8f0', fontWeight: 800 } as const;
const fieldStyle = { display: 'grid', gap: 8, color: '#cbd5e1', fontWeight: 800 } as const;
const inputStyle = { width: '100%', minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box' as const, fontSize: 16 };
const textareaStyle = { ...inputStyle, minHeight: 110, padding: 12, resize: 'vertical' as const };
const dateGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 } as const;
const summaryRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const, overflowWrap: 'anywhere' as const };
const actionStyle = { display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' as const };
const confirmDetailsStyle = { display: 'grid', gap: 6, overflowWrap: 'anywhere' as const };
