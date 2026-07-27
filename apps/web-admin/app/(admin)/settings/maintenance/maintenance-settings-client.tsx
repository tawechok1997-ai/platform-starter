'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
} from '../../_components/admin-ui';
import { useAdminSettingsForm } from '../use-admin-settings-form';
import settingsStyles from '../settings-professional.module.css';
import styles from './maintenance-professional.module.css';

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

const SERVICE_OPTIONS: Array<{
  key: keyof Pick<MaintenanceSettings, 'enabled' | 'member_enabled' | 'admin_enabled' | 'deposit_enabled' | 'withdraw_enabled' | 'provider_enabled'>;
  label: string;
  description: string;
}> = [
  { key: 'enabled', label: 'ปิดระบบทั้งหมด', description: 'ใช้เฉพาะเหตุการณ์ที่กระทบทั้งแพลตฟอร์ม' },
  { key: 'member_enabled', label: 'ปิดหน้า Member', description: 'สมาชิกเข้าใช้งานเว็บไซต์ไม่ได้ชั่วคราว' },
  { key: 'admin_enabled', label: 'ปิดหน้า Admin', description: 'จำกัดการเข้าถึงพื้นที่ผู้ดูแล' },
  { key: 'deposit_enabled', label: 'ปิดบริการฝากเงิน', description: 'หยุดรับรายการฝากและการตรวจหลักฐาน' },
  { key: 'withdraw_enabled', label: 'ปิดบริการถอนเงิน', description: 'หยุดสร้างและดำเนินการรายการถอน' },
  { key: 'provider_enabled', label: 'ปิดค่ายเกม', description: 'หยุดเปิดเกมและการเชื่อมต่อผู้ให้บริการ' },
];

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
      setMessage('ต้องเปิดสิทธิ์ Admin access ก่อนจำกัดให้เฉพาะ Super Admin');
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

  return (
    <AdminPage
      eyebrow="การตั้งค่าระบบ"
      title="โหมดปิดปรับปรุง"
      description="ควบคุมการหยุดบริการเป็นรายส่วน พร้อมตรวจผลกระทบและช่วงเวลาก่อนบันทึก"
      actions={<a href="/settings">← กลับหน้าการตั้งค่า</a>}
    >
      <div className={settingsStyles.page}>
        <section className={settingsStyles.contextBar} aria-label="สถานะ Maintenance">
          <div className={settingsStyles.contextCopy}>
            <strong>{maintenanceActive ? 'มีบริการที่ถูกตั้งให้หยุด' : 'ทุกบริการเปิดตามปกติ'}</strong>
            <span>ใช้การปิดเฉพาะส่วนเท่าที่จำเป็น และตรวจข้อความผู้ใช้ก่อนเปิดใช้งานจริง</span>
          </div>
          <div className={settingsStyles.contextMeta}>
            <span className={settingsStyles.pill} data-tone={maintenanceActive ? 'warning' : 'success'}>{maintenanceActive ? 'MAINTENANCE' : 'NORMAL'}</span>
            <span className={settingsStyles.pill}>{affectedServices.length} บริการ</span>
            <span className={settingsStyles.pill} data-tone={isDirty ? 'warning' : 'success'}>{isDirty ? 'ยังไม่บันทึก' : 'ข้อมูลล่าสุด'}</span>
          </div>
        </section>

        {message && <AdminNotice tone={message.includes('ไม่') || message.includes('ต้อง') || message.includes('กรุณา') ? 'danger' : 'neutral'}>{message}</AdminNotice>}

        <AdminMetricGrid>
          <AdminMetric title="สถานะ" value={maintenanceActive ? 'MAINTENANCE' : 'NORMAL'} tone={maintenanceActive ? 'danger' : 'success'} />
          <AdminMetric title="บริการที่ได้รับผลกระทบ" value={String(affectedServices.length)} helper={affectedServices.join(', ') || 'ไม่มี'} tone={affectedServices.length ? 'warning' : 'success'} />
          <AdminMetric title="สิทธิ์ Admin" value={form.allow_admin_access ? 'ALLOWED' : 'BLOCKED'} tone={form.allow_admin_access ? 'warning' : 'neutral'} />
          <AdminMetric title="ช่วงเวลา" value={form.start_time || form.end_time ? 'SCHEDULED' : 'MANUAL'} helper={formatRange(form.start_time, form.end_time)} />
        </AdminMetricGrid>

        <form className={settingsStyles.form} onSubmit={requestSave}>
          <div className={settingsStyles.layout}>
            <section className={settingsStyles.editor}>
              <header className={settingsStyles.editorHeader}>
                <div>
                  <h2>ขอบเขตและเงื่อนไข</h2>
                  <p>กำหนดบริการ ข้อความ ช่วงเวลา และสิทธิ์ผู้ดูแลจากพื้นที่เดียว</p>
                </div>
              </header>

              <div className={settingsStyles.fieldGrid}>
                <SectionLabel title="บริการที่ต้องหยุด" description="เลือกเฉพาะบริการที่ได้รับผลกระทบ หลีกเลี่ยงการปิดทั้งระบบโดยไม่จำเป็น" />
                <div className={styles.serviceGrid} style={{ gridColumn: '1 / -1' }}>
                  {SERVICE_OPTIONS.map((option) => (
                    <label className={styles.serviceCard} key={option.key}>
                      <span className={styles.serviceCopy}><strong>{option.label}</strong><span>{option.description}</span></span>
                      <input
                        className={settingsStyles.switchInput}
                        type="checkbox"
                        checked={form[option.key]}
                        disabled={busy}
                        onChange={(event) => update(option.key, event.target.checked)}
                      />
                    </label>
                  ))}
                </div>

                <SectionLabel title="ข้อความและช่วงเวลา" description="ข้อความนี้จะแสดงต่อผู้ใช้ที่ได้รับผลกระทบ" />
                <label className={settingsStyles.field} data-span="full">
                  <span className={settingsStyles.fieldLabel}>ข้อความแจ้งผู้ใช้<small>message</small></span>
                  <textarea
                    value={form.message}
                    disabled={busy}
                    maxLength={1000}
                    onChange={(event) => update('message', event.target.value)}
                    placeholder="ระบบกำลังปรับปรุง กรุณาลองใหม่ภายหลัง"
                  />
                  <p className={settingsStyles.help}>{form.message.length}/1000 ตัวอักษร</p>
                </label>
                <label className={settingsStyles.field}>
                  <span className={settingsStyles.fieldLabel}>เวลาเริ่มต้น<small>start_time</small></span>
                  <input type="datetime-local" value={toLocalInputValue(form.start_time)} disabled={busy} onChange={(event) => update('start_time', event.target.value)} />
                </label>
                <label className={settingsStyles.field}>
                  <span className={settingsStyles.fieldLabel}>เวลาสิ้นสุด<small>end_time</small></span>
                  <input type="datetime-local" value={toLocalInputValue(form.end_time)} disabled={busy} onChange={(event) => update('end_time', event.target.value)} />
                </label>

                <SectionLabel title="สิทธิ์ระหว่างปิดปรับปรุง" description="คงช่องทางเข้าระบบเฉพาะทีมที่ต้องแก้ไขเหตุการณ์" />
                <label className={settingsStyles.switchField}>
                  <span className={settingsStyles.switchCopy}><strong>อนุญาต Admin access</strong><span>ให้ผู้ดูแลเข้าระบบระหว่าง Maintenance</span></span>
                  <input className={settingsStyles.switchInput} type="checkbox" checked={form.allow_admin_access} disabled={busy} onChange={(event) => {
                    update('allow_admin_access', event.target.checked);
                    if (!event.target.checked) update('super_admin_only', false);
                  }} />
                </label>
                <label className={settingsStyles.switchField}>
                  <span className={settingsStyles.switchCopy}><strong>เฉพาะ Super Admin</strong><span>จำกัด Admin access ให้ผู้ดูแลระดับสูงสุด</span></span>
                  <input className={settingsStyles.switchInput} type="checkbox" checked={form.super_admin_only} disabled={busy || !form.allow_admin_access} onChange={(event) => update('super_admin_only', event.target.checked)} />
                </label>
              </div>

              <footer className={settingsStyles.actionBar}>
                <div className={settingsStyles.actionCopy}>
                  <strong>{isDirty ? 'มีการแก้ไขที่ต้องยืนยัน' : 'ค่าปัจจุบันตรงกับระบบ'}</strong>
                  <span>{maintenanceActive ? 'การบันทึกอาจหยุดบริการทันที โปรดตรวจ Preview ด้านขวา' : 'ตรวจว่าทุกบริการเปิดตามที่ต้องการก่อนบันทึก'}</span>
                </div>
                <div className={settingsStyles.actionButtons}>
                  <AdminButton type="button" tone="secondary" disabled={busy || !isDirty} onClick={reset}>ยกเลิกการแก้ไข</AdminButton>
                  <AdminButton type="submit" tone={maintenanceActive ? 'danger' : 'primary'} disabled={busy || !isDirty}>{saving ? 'กำลังบันทึก...' : 'ตรวจและบันทึก'}</AdminButton>
                </div>
              </footer>
            </section>

            <aside className={settingsStyles.previewPanel}>
              <header className={settingsStyles.previewHeader}>
                <div><h2>ผลกระทบก่อนบันทึก</h2><p>สรุปสิ่งที่ผู้ใช้และทีมปฏิบัติการจะพบหลังยืนยัน</p></div>
              </header>
              <div className={settingsStyles.previewBody}>
                <div className={settingsStyles.previewFrame}>
                  <h3>{maintenanceActive ? 'ระบบกำลังปิดปรับปรุง' : 'ระบบเปิดให้บริการ'}</h3>
                  <p>{form.message.trim() || 'ยังไม่ได้ระบุข้อความแจ้งผู้ใช้'}</p>
                  <section className={settingsStyles.previewSection}><small>ช่วงเวลา</small><p>{formatRange(form.start_time, form.end_time)}</p></section>
                  <section className={settingsStyles.previewSection}>
                    <small>บริการ</small>
                    <div className={styles.impactList}>
                      {affectedServices.length > 0
                        ? affectedServices.map((service) => <div className={styles.impactItem} key={service}><strong>{service}</strong><AdminBadge tone="danger">หยุดให้บริการ</AdminBadge></div>)
                        : <div className={`${styles.impactItem} ${styles.safeItem}`}><strong>ทุกบริการ</strong><AdminBadge tone="success">เปิดตามปกติ</AdminBadge></div>}
                    </div>
                  </section>
                  <section className={settingsStyles.previewSection}>
                    <small>สิทธิ์ผู้ดูแล</small>
                    <p>{form.allow_admin_access ? (form.super_admin_only ? 'เฉพาะ Super Admin' : 'Admin ที่ได้รับอนุญาต') : 'ปิดการเข้าถึง Admin'}</p>
                  </section>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>

      <AdminConfirmDialog
        open={confirmOpen}
        title={maintenanceActive ? 'ยืนยันเปิดโหมดปิดปรับปรุง' : 'ยืนยันกลับสู่การให้บริการปกติ'}
        description={maintenanceActive ? `บริการที่ได้รับผลกระทบ: ${affectedServices.join(', ')}` : 'ระบบจะยกเลิกสถานะปิดปรับปรุงตามค่าที่กำหนด'}
        confirmLabel={maintenanceActive ? 'ยืนยันปิดบริการ' : 'ยืนยันเปิดบริการ'}
        tone={maintenanceActive ? 'danger' : 'primary'}
        busy={saving}
        onCancel={() => { if (!saving) setConfirmOpen(false); }}
        onConfirm={() => void confirmSave()}
        details={<div className={styles.confirmDetails}><strong>ข้อความผู้ใช้</strong><p>{form.message.trim() || '-'}</p><strong>ช่วงเวลา</strong><p>{formatRange(form.start_time, form.end_time)}</p></div>}
      />
    </AdminPage>
  );
}

function SectionLabel({ title, description }: { title: string; description: string }) {
  return <div className={settingsStyles.editorHeader} style={{ gridColumn: '1 / -1', padding: '4px 0 10px', borderBottom: '1px solid rgb(148 163 184 / 10%)' }}><div><h2>{title}</h2><p>{description}</p></div></div>;
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
