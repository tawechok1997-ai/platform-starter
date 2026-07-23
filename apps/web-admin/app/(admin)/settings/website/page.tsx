'use client';

import type { FormEvent } from 'react';
import { AdminButton, AdminCard, AdminGrid, AdminNotice, AdminPage, AdminToolbar } from '../../_components/admin-ui';
import { useAdminSettingsForm } from '../use-admin-settings-form';

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

  return (
    <AdminPage eyebrow="Settings" title="Website Settings" description="ตั้งค่าข้อมูลเว็บไซต์และข้อความหลักที่หน้า Member ใช้งาน" actions={<a href="/settings">← Settings</a>}>
      {message && <AdminNotice>{message}</AdminNotice>}
      {isDirty && <AdminNotice>มีการแก้ไขที่ยังไม่ได้บันทึก</AdminNotice>}
      <AdminGrid>
        <AdminCard title="Website Configuration" description="ข้อมูลโดเมน ภาษา และสถานะการใช้งาน">
          <form onSubmit={onSubmit}>
            <AdminToolbar>
              <TextField label="Site Name" value={form.site_name} onChange={(value) => update('site_name', value)} />
              <TextAreaField label="Site Description" value={form.site_description} onChange={(value) => update('site_description', value)} />
              <TextField label="Domain" value={form.site_url} onChange={(value) => update('site_url', value)} />
              <TextField label="Admin Domain" value={form.admin_url} onChange={(value) => update('admin_url', value)} />
              <label style={labelStyle}>Default Language<select value={form.default_language} onChange={(event) => update('default_language', event.target.value)}><option value="th">Thai</option><option value="en">English</option></select></label>
              <TextField label="Timezone" value={form.timezone} onChange={(value) => update('timezone', value)} />
              <TextField label="Currency" value={form.currency} onChange={(value) => update('currency', value)} />
              <TextField label="Date Format" value={form.date_format} onChange={(value) => update('date_format', value)} />
              <CheckboxField label="Maintenance Mode" checked={form.maintenance_mode} onChange={(value) => update('maintenance_mode', value)} />
              <CheckboxField label="Registration Enabled" checked={form.registration_enabled} onChange={(value) => update('registration_enabled', value)} />
              <CheckboxField label="Login Enabled" checked={form.login_enabled} onChange={(value) => update('login_enabled', value)} />
            </AdminToolbar>

            <section style={sectionStyle}>
              <h3>Member Home Content</h3>
              <AdminToolbar>
                <TextField label="Home Heading" value={form.home_heading} onChange={(value) => update('home_heading', value)} />
                <TextAreaField label="Home Subtitle" value={form.home_subtitle} onChange={(value) => update('home_subtitle', value)} />
                <TextField label="Announcement Label" value={form.announcement_label} onChange={(value) => update('announcement_label', value)} />
                <TextField label="Promotions Heading" value={form.promotions_heading} onChange={(value) => update('promotions_heading', value)} />
                <TextField label="Games Heading" value={form.games_heading} onChange={(value) => update('games_heading', value)} />
                <TextField label="Providers Heading" value={form.providers_heading} onChange={(value) => update('providers_heading', value)} />
                <TextField label="Featured Games Heading" value={form.featured_games_heading} onChange={(value) => update('featured_games_heading', value)} />
                <TextField label="Popular Games Heading" value={form.popular_games_heading} onChange={(value) => update('popular_games_heading', value)} />
                <TextField label="Recent Games Heading" value={form.recent_games_heading} onChange={(value) => update('recent_games_heading', value)} />
                <TextField label="Favorite Games Heading" value={form.favorite_games_heading} onChange={(value) => update('favorite_games_heading', value)} />
                <TextAreaField label="Empty Games Message" value={form.empty_games_message} onChange={(value) => update('empty_games_message', value)} />
                <TextAreaField label="Empty Promotions Message" value={form.empty_promotions_message} onChange={(value) => update('empty_promotions_message', value)} />
              </AdminToolbar>
            </section>

            <section style={sectionStyle}>
              <h3>Auth and Action Labels</h3>
              <AdminToolbar>
                <TextField label="Login Title" value={form.login_title} onChange={(value) => update('login_title', value)} />
                <TextAreaField label="Login Subtitle" value={form.login_subtitle} onChange={(value) => update('login_subtitle', value)} />
                <TextField label="Register Title" value={form.register_title} onChange={(value) => update('register_title', value)} />
                <TextAreaField label="Register Subtitle" value={form.register_subtitle} onChange={(value) => update('register_subtitle', value)} />
                <TextField label="Deposit Label" value={form.deposit_label} onChange={(value) => update('deposit_label', value)} />
                <TextField label="Withdraw Label" value={form.withdraw_label} onChange={(value) => update('withdraw_label', value)} />
                <TextField label="Support Label" value={form.support_label} onChange={(value) => update('support_label', value)} />
              </AdminToolbar>
            </section>

            <AdminToolbar>
              <AdminButton type="submit" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'Save Changes'}</AdminButton>
              <AdminButton type="button" tone="secondary" disabled={!isDirty || saving} onClick={reset}>Reset</AdminButton>
            </AdminToolbar>
          </form>
        </AdminCard>

        <AdminCard title="Member Preview" description="ตัวอย่างข้อความสำคัญก่อนบันทึก">
          <div style={previewBoxStyle}>
            <strong>{form.site_name || 'Website Name'}</strong>
            <p>{form.site_description || 'Website description preview'}</p>
            <section style={previewSectionStyle}><small>HOME</small><h3>{form.home_heading}</h3><p>{form.home_subtitle}</p></section>
            <section style={previewSectionStyle}><small>ANNOUNCEMENT</small><strong>{form.announcement_label}</strong></section>
            <section style={previewSectionStyle}><small>SECTIONS</small><p>{form.promotions_heading} · {form.games_heading} · {form.providers_heading}</p></section>
            <section style={previewSectionStyle}><small>AUTH</small><p>{form.login_title}</p><p>{form.register_title}</p></section>
            <p>Language: {form.default_language} · Currency: {form.currency}</p>
            <p>Register: {form.registration_enabled ? 'เปิด' : 'ปิด'} · Login: {form.login_enabled ? 'เปิด' : 'ปิด'}</p>
          </div>
        </AdminCard>
      </AdminGrid>
    </AdminPage>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={labelStyle}>{label}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label style={labelStyle}>{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label style={checkboxStyle}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}

const labelStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const checkboxStyle = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, fontWeight: 800 } as const;
const sectionStyle = { marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(148,163,184,.18)' } as const;
const previewBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 14, padding: 16, background: 'rgba(148,163,184,.06)', overflowWrap: 'anywhere' as const } as const;
const previewSectionStyle = { marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,.16)' } as const;
