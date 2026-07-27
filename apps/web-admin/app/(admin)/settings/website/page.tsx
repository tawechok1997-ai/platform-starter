'use client';

import type { FormEvent } from 'react';
import { AdminButton, AdminNotice, AdminPage } from '../../_components/admin-ui';
import { useAdminSettingsForm } from '../use-admin-settings-form';
import styles from '../settings-professional.module.css';

type WebsiteSettings = {
  site_name: string;
  site_description: string;
  site_url: string;
  admin_url: string;
  default_language: string;
  timezone: string;
  currency: string;
  date_format: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  login_enabled: boolean;
  home_heading: string;
  home_subtitle: string;
  announcement_label: string;
  promotions_heading: string;
  games_heading: string;
  providers_heading: string;
  featured_games_heading: string;
  popular_games_heading: string;
  recent_games_heading: string;
  favorite_games_heading: string;
  empty_games_message: string;
  empty_promotions_message: string;
  login_title: string;
  login_subtitle: string;
  register_title: string;
  register_subtitle: string;
  deposit_label: string;
  withdraw_label: string;
  support_label: string;
};

const defaults: WebsiteSettings = {
  site_name: '',
  site_description: '',
  site_url: '',
  admin_url: '',
  default_language: 'th',
  timezone: 'Asia/Bangkok',
  currency: 'THB',
  date_format: 'DD/MM/YYYY',
  maintenance_mode: false,
  registration_enabled: true,
  login_enabled: true,
  home_heading: 'ยินดีต้อนรับ',
  home_subtitle: 'เลือกเกม โปรโมชั่น และบริการที่ต้องการ',
  announcement_label: 'ประกาศ',
  promotions_heading: 'โปรโมชั่นแนะนำ',
  games_heading: 'เกมทั้งหมด',
  providers_heading: 'ค่ายเกม',
  featured_games_heading: 'เกมแนะนำ',
  popular_games_heading: 'ยอดนิยม',
  recent_games_heading: 'เล่นล่าสุด',
  favorite_games_heading: 'เกมโปรด',
  empty_games_message: 'ยังไม่มีเกมที่พร้อมแสดง',
  empty_promotions_message: 'ยังไม่มีโปรโมชั่นที่เปิดใช้งาน',
  login_title: 'ยินดีต้อนรับกลับ',
  login_subtitle: 'เข้าสู่บัญชีของคุณอย่างปลอดภัย',
  register_title: 'สมัครสมาชิก',
  register_subtitle: 'กรอกข้อมูลให้ครบในไม่กี่ขั้นตอน',
  deposit_label: 'ฝากเงิน',
  withdraw_label: 'ถอนเงิน',
  support_label: 'ติดต่อเรา',
};

export default function WebsiteSettingsPage() {
  const { form, message, saving, isDirty, save, reset, update } = useAdminSettingsForm<WebsiteSettings>({
    endpoint: '/admin/settings/website',
    defaults,
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save();
  }

  const configuredCount = Object.values(form).filter((value) => typeof value === 'boolean' || String(value).trim()).length;

  return (
    <AdminPage
      eyebrow="การตั้งค่าระบบ"
      title="ข้อมูลและข้อความเว็บไซต์"
      description="กำหนดข้อมูลหลัก โดเมน ภาษา และข้อความที่แสดงในหน้า Member"
      actions={<a href="/settings">← กลับหน้าการตั้งค่า</a>}
    >
      <div className={styles.page}>
        <section className={styles.contextBar} aria-label="สถานะการตั้งค่าเว็บไซต์">
          <div className={styles.contextCopy}>
            <strong>Website configuration</strong>
            <span>ค่ากลุ่มนี้มีผลกับชื่อเว็บไซต์ การเข้าสู่ระบบ หน้าแรก และข้อความสำคัญของสมาชิก</span>
          </div>
          <div className={styles.contextMeta}>
            <span className={styles.pill}>{configuredCount}/{Object.keys(defaults).length} ค่า</span>
            <span className={styles.pill} data-tone={isDirty ? 'warning' : 'success'}>{isDirty ? 'ยังไม่บันทึก' : 'ข้อมูลล่าสุด'}</span>
          </div>
        </section>

        {message && <AdminNotice>{message}</AdminNotice>}

        <div className={styles.layout}>
          <section className={styles.editor}>
            <header className={styles.editorHeader}>
              <div>
                <h2>ค่าการทำงานและข้อความ</h2>
                <p>แบ่งข้อมูลตามงานจริง ลดการไล่หาช่องในฟอร์มยาว และแสดงสถานะสำคัญเป็นสวิตช์</p>
              </div>
            </header>

            <form className={styles.form} onSubmit={onSubmit}>
              <div className={styles.fieldGrid}>
                <SectionLabel title="ข้อมูลเว็บไซต์" description="ชื่อ คำอธิบาย โดเมน และรูปแบบพื้นฐาน" />
                <TextField label="ชื่อเว็บไซต์" code="site_name" value={form.site_name} onChange={(value) => update('site_name', value)} />
                <TextField label="โดเมน Member" code="site_url" value={form.site_url} onChange={(value) => update('site_url', value)} placeholder="https://example.com" />
                <TextField label="โดเมน Admin" code="admin_url" value={form.admin_url} onChange={(value) => update('admin_url', value)} placeholder="https://admin.example.com" />
                <TextAreaField label="คำอธิบายเว็บไซต์" code="site_description" value={form.site_description} onChange={(value) => update('site_description', value)} />
                <SelectField label="ภาษาเริ่มต้น" code="default_language" value={form.default_language} onChange={(value) => update('default_language', value)} options={[['th', 'ไทย'], ['en', 'English']]} />
                <TextField label="เขตเวลา" code="timezone" value={form.timezone} onChange={(value) => update('timezone', value)} />
                <TextField label="สกุลเงิน" code="currency" value={form.currency} onChange={(value) => update('currency', value)} />
                <TextField label="รูปแบบวันที่" code="date_format" value={form.date_format} onChange={(value) => update('date_format', value)} />

                <SectionLabel title="สถานะระบบ" description="ควบคุมการเข้าถึงส่วนสำคัญโดยไม่ต้อง Deploy ใหม่" />
                <SwitchField label="โหมดปิดปรับปรุง" description="แสดงหน้าปิดปรับปรุงแทนหน้าเว็บไซต์ปกติ" checked={form.maintenance_mode} onChange={(value) => update('maintenance_mode', value)} />
                <SwitchField label="เปิดรับสมัครสมาชิก" description="อนุญาตให้ผู้ใช้ใหม่สร้างบัญชี" checked={form.registration_enabled} onChange={(value) => update('registration_enabled', value)} />
                <SwitchField label="เปิดให้เข้าสู่ระบบ" description="อนุญาตให้สมาชิกเข้าสู่ระบบตามปกติ" checked={form.login_enabled} onChange={(value) => update('login_enabled', value)} />

                <SectionLabel title="ข้อความหน้าแรก" description="หัวข้อและข้อความที่สมาชิกเห็นในหน้า Home" />
                <TextField label="หัวข้อหน้าแรก" code="home_heading" value={form.home_heading} onChange={(value) => update('home_heading', value)} />
                <TextField label="ป้ายประกาศ" code="announcement_label" value={form.announcement_label} onChange={(value) => update('announcement_label', value)} />
                <TextAreaField label="คำอธิบายหน้าแรก" code="home_subtitle" value={form.home_subtitle} onChange={(value) => update('home_subtitle', value)} />
                <TextField label="หัวข้อโปรโมชั่น" code="promotions_heading" value={form.promotions_heading} onChange={(value) => update('promotions_heading', value)} />
                <TextField label="หัวข้อเกมทั้งหมด" code="games_heading" value={form.games_heading} onChange={(value) => update('games_heading', value)} />
                <TextField label="หัวข้อค่ายเกม" code="providers_heading" value={form.providers_heading} onChange={(value) => update('providers_heading', value)} />
                <TextField label="หัวข้อเกมแนะนำ" code="featured_games_heading" value={form.featured_games_heading} onChange={(value) => update('featured_games_heading', value)} />
                <TextField label="หัวข้อเกมยอดนิยม" code="popular_games_heading" value={form.popular_games_heading} onChange={(value) => update('popular_games_heading', value)} />
                <TextField label="หัวข้อเล่นล่าสุด" code="recent_games_heading" value={form.recent_games_heading} onChange={(value) => update('recent_games_heading', value)} />
                <TextField label="หัวข้อเกมโปรด" code="favorite_games_heading" value={form.favorite_games_heading} onChange={(value) => update('favorite_games_heading', value)} />
                <TextAreaField label="ข้อความเมื่อไม่มีเกม" code="empty_games_message" value={form.empty_games_message} onChange={(value) => update('empty_games_message', value)} />
                <TextAreaField label="ข้อความเมื่อไม่มีโปรโมชั่น" code="empty_promotions_message" value={form.empty_promotions_message} onChange={(value) => update('empty_promotions_message', value)} />

                <SectionLabel title="เข้าสู่ระบบและการทำรายการ" description="ข้อความในหน้า Login, Register และปุ่มงานหลัก" />
                <TextField label="หัวข้อเข้าสู่ระบบ" code="login_title" value={form.login_title} onChange={(value) => update('login_title', value)} />
                <TextField label="หัวข้อสมัครสมาชิก" code="register_title" value={form.register_title} onChange={(value) => update('register_title', value)} />
                <TextAreaField label="คำอธิบายเข้าสู่ระบบ" code="login_subtitle" value={form.login_subtitle} onChange={(value) => update('login_subtitle', value)} />
                <TextAreaField label="คำอธิบายสมัครสมาชิก" code="register_subtitle" value={form.register_subtitle} onChange={(value) => update('register_subtitle', value)} />
                <TextField label="ปุ่มฝากเงิน" code="deposit_label" value={form.deposit_label} onChange={(value) => update('deposit_label', value)} />
                <TextField label="ปุ่มถอนเงิน" code="withdraw_label" value={form.withdraw_label} onChange={(value) => update('withdraw_label', value)} />
                <TextField label="ปุ่มติดต่อเรา" code="support_label" value={form.support_label} onChange={(value) => update('support_label', value)} />
              </div>

              <footer className={styles.actionBar}>
                <div className={styles.actionCopy}>
                  <strong>{isDirty ? 'มีการแก้ไขที่ยังไม่บันทึก' : 'ค่าปัจจุบันตรงกับระบบ'}</strong>
                  <span>ตรวจตัวอย่างด้านขวาก่อนบันทึก โดยเฉพาะข้อความหน้าแรกและสถานะ Login/Register</span>
                </div>
                <div className={styles.actionButtons}>
                  <AdminButton type="button" tone="secondary" disabled={!isDirty || saving} onClick={reset}>ยกเลิกการแก้ไข</AdminButton>
                  <AdminButton type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</AdminButton>
                </div>
              </footer>
            </form>
          </section>

          <aside className={styles.previewPanel}>
            <header className={styles.previewHeader}>
              <div>
                <h2>ตัวอย่างหน้า Member</h2>
                <p>จำลองข้อความสำคัญและสถานะการเข้าถึงก่อนเผยแพร่</p>
              </div>
            </header>
            <div className={styles.previewBody}>
              <div className={styles.previewFrame}>
                <h3>{form.site_name || 'ชื่อเว็บไซต์'}</h3>
                <p>{form.site_description || 'คำอธิบายเว็บไซต์'}</p>
                <section className={styles.previewSection}><small>หน้าแรก</small><h3>{form.home_heading}</h3><p>{form.home_subtitle}</p></section>
                <section className={styles.previewSection}><small>หมวดข้อมูล</small><p>{form.promotions_heading} · {form.games_heading} · {form.providers_heading}</p></section>
                <section className={styles.previewSection}><small>สมาชิก</small><p>{form.login_title} · {form.register_title}</p></section>
                <section className={styles.previewSection}><small>สถานะ</small><p>สมัครสมาชิก: {form.registration_enabled ? 'เปิด' : 'ปิด'} · Login: {form.login_enabled ? 'เปิด' : 'ปิด'} · Maintenance: {form.maintenance_mode ? 'เปิด' : 'ปิด'}</p></section>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AdminPage>
  );
}

function SectionLabel({ title, description }: { title: string; description: string }) {
  return <div className={styles.editorHeader} style={{ gridColumn: '1 / -1', padding: '4px 0 10px', borderBottom: '1px solid rgb(148 163 184 / 10%)' }}><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function TextField({ label, code, value, placeholder, onChange }: { label: string; code: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return <label className={styles.field}><span className={styles.fieldLabel}>{label}<small>{code}</small></span><input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextAreaField({ label, code, value, onChange }: { label: string; code: string; value: string; onChange: (value: string) => void }) {
  return <label className={styles.field} data-span="full"><span className={styles.fieldLabel}>{label}<small>{code}</small></span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, code, value, options, onChange }: { label: string; code: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <label className={styles.field}><span className={styles.fieldLabel}>{label}<small>{code}</small></span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function SwitchField({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className={styles.switchField}><span className={styles.switchCopy}><strong>{label}</strong><span>{description}</span></span><input className={styles.switchInput} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}
