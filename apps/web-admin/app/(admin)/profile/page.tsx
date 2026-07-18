'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminCard, AdminEmptyState, AdminLinkButton } from '../../components/admin-ui';
import { AdminIcon } from '../_components/admin-icon';

type AdminRole = string | { name?: string; code?: string; level?: number };

type AdminProfile = {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
  status?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  roles?: AdminRole[];
  permissions?: string[];
};

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setError('');
      try {
        const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' });
        const data = await response.json().catch(() => null) as AdminProfile | null;
        if (!response.ok || !data) throw new Error('โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
        if (!cancelled) setProfile(data);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => { cancelled = true; };
  }, []);

  const displayName = useMemo(() => {
    if (!profile) return 'ผู้ดูแลระบบ';
    return profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || 'ผู้ดูแลระบบ';
  }, [profile]);

  if (loading) return <ProfileSkeleton />;

  if (error || !profile) {
    return <AdminEmptyState icon={<AdminIcon name="user" />} title="โหลดโปรไฟล์ไม่สำเร็จ" description={error || 'ไม่พบข้อมูลบัญชีผู้ดูแล'} actionHref="/dashboard" actionLabel="กลับ Dashboard" />;
  }

  const roleNames = (profile.roles ?? []).map((role) => typeof role === 'string' ? role : role.name || role.code || 'Role');
  const position = profile.position || roleNames[0] || 'Admin';
  const permissions = profile.permissions ?? [];
  const permissionGroups = groupPermissions(permissions);

  return (
    <div className="admin-profile-page">
      <header className="admin-profile-hero">
        <div className="admin-profile-hero__identity">
          <span className="admin-profile-hero__avatar">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt={`รูปโปรไฟล์ ${displayName}`} /> : initials(displayName)}
            <i aria-label="ออนไลน์" />
          </span>
          <div>
            <span className="admin-profile-hero__eyebrow">ADMIN IDENTITY</span>
            <h1>{displayName}</h1>
            <p>{position}{profile.department ? ` · ${profile.department}` : ''}</p>
            <div className="admin-profile-hero__badges">
              <span data-tone="success">{profile.status || 'ACTIVE'}</span>
              <span data-tone={profile.twoFactorEnabled ? 'brand' : 'warning'}>{profile.twoFactorEnabled ? '2FA เปิดใช้งาน' : 'ยังไม่เปิด 2FA'}</span>
              {roleNames.map((role) => <span key={role}>{role}</span>)}
            </div>
          </div>
        </div>
        <div className="admin-profile-hero__actions">
          <AdminLinkButton href="/security" tone="default"><AdminIcon name="security" />ความปลอดภัย</AdminLinkButton>
          <AdminLinkButton href="/activity" tone="brand"><AdminIcon name="activity" />กิจกรรมบัญชี</AdminLinkButton>
        </div>
      </header>

      <section className="admin-profile-grid">
        <AdminCard className="admin-profile-panel admin-profile-panel--details" elevated>
          <div className="admin-profile-panel__head"><div><span>ข้อมูลประจำตัว</span><h2>รายละเอียดบัญชี</h2></div><AdminIcon name="user" /></div>
          <dl className="admin-profile-details">
            <ProfileField label="ชื่อที่แสดง" value={displayName} />
            <ProfileField label="Username" value={profile.username ? `@${profile.username}` : 'ยังไม่ระบุ'} mono />
            <ProfileField label="อีเมล" value={profile.email || 'ยังไม่ระบุ'} />
            <ProfileField label="ตำแหน่ง" value={position} />
            <ProfileField label="แผนก" value={profile.department || 'ยังไม่ระบุ'} />
            <ProfileField label="เข้าสู่ระบบล่าสุด" value={formatDate(profile.lastLoginAt)} />
            <ProfileField label="สร้างบัญชีเมื่อ" value={formatDate(profile.createdAt)} />
          </dl>
        </AdminCard>

        <AdminCard className="admin-profile-panel admin-profile-panel--security" elevated>
          <div className="admin-profile-panel__head"><div><span>SECURITY POSTURE</span><h2>สถานะความปลอดภัย</h2></div><AdminIcon name="security" /></div>
          <div className="admin-security-score">
            <div className="admin-security-score__ring" data-secure={profile.twoFactorEnabled}><strong>{profile.twoFactorEnabled ? '100' : '65'}</strong><span>/100</span></div>
            <div><strong>{profile.twoFactorEnabled ? 'บัญชีได้รับการป้องกัน' : 'ควรเปิดใช้งาน 2FA'}</strong><p>การยืนยันสองขั้นตอนช่วยลดความเสี่ยงจากรหัสผ่านรั่วและการยึดบัญชีผู้ดูแล</p></div>
          </div>
          <ul className="admin-security-checklist">
            <li data-ok><span><AdminIcon name="security" /></span><div><strong>Session authentication</strong><p>ตรวจสอบเซสชันและสิทธิ์ทุกครั้งที่เปิดหน้า</p></div></li>
            <li data-ok={profile.twoFactorEnabled || undefined}><span><AdminIcon name="security" /></span><div><strong>Two-factor authentication</strong><p>{profile.twoFactorEnabled ? 'เปิดใช้งานแล้ว' : 'ยังไม่เปิดใช้งาน'}</p></div></li>
            <li data-ok><span><AdminIcon name="activity" /></span><div><strong>Audit trail</strong><p>การทำงานสำคัญถูกบันทึกเพื่อตรวจสอบย้อนหลัง</p></div></li>
          </ul>
        </AdminCard>
      </section>

      <AdminCard className="admin-profile-panel admin-profile-panel--permissions" elevated>
        <div className="admin-profile-panel__head"><div><span>ACCESS CONTROL</span><h2>Role และสิทธิ์การเข้าถึง</h2><p>{permissions.includes('*') ? 'บัญชีนี้มีสิทธิ์ระดับสูงสุด' : `มีสิทธิ์ทั้งหมด ${permissions.length} รายการ`}</p></div><AdminIcon name="security" /></div>
        {permissionGroups.length > 0 ? <div className="admin-permission-groups">
          {permissionGroups.map(([module, items]) => <section key={module}>
            <header><strong>{moduleLabel(module)}</strong><span>{items.length}</span></header>
            <div>{items.map((permission) => <code key={permission}>{permission}</code>)}</div>
          </section>)}
        </div> : <p className="admin-profile-muted">บัญชีนี้ยังไม่มีรายการ permission ที่แสดงได้</p>}
      </AdminCard>
    </div>
  );
}

function ProfileField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt>{label}</dt><dd className={mono ? 'mono' : undefined}>{value}</dd></div>;
}

function ProfileSkeleton() {
  return <div className="admin-profile-page" aria-label="กำลังโหลดโปรไฟล์"><div className="admin-profile-skeleton admin-profile-skeleton--hero" /><div className="admin-profile-grid"><div className="admin-profile-skeleton" /><div className="admin-profile-skeleton" /></div><div className="admin-profile-skeleton admin-profile-skeleton--wide" /></div>;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.slice(0, 1).toLocaleUpperCase('th')).join('') || 'AD';
}

function formatDate(value?: string) {
  if (!value) return 'ยังไม่มีข้อมูล';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'ยังไม่มีข้อมูล';
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(date);
}

function groupPermissions(permissions: string[]) {
  const grouped = new Map<string, string[]>();
  for (const permission of permissions) {
    const module = permission === '*' ? 'system' : permission.split('.')[0] || 'other';
    const items = grouped.get(module) ?? [];
    items.push(permission);
    grouped.set(module, items);
  }
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function moduleLabel(module: string) {
  const labels: Record<string, string> = {
    admin: 'ผู้ดูแลและสิทธิ์', affiliate: 'Affiliate', bonus: 'โบนัส', commission: 'Commission', deposit: 'รายการฝาก', game: 'เกมและ Provider', provider: 'Provider', promotion: 'โปรโมชั่น', promotions: 'โปรโมชั่น', reports: 'รายงาน', risk: 'ความเสี่ยง', security: 'ความปลอดภัย', settings: 'การตั้งค่า', system: 'ระบบทั้งหมด', topups: 'รายการฝาก', users: 'สมาชิก', wallet: 'Wallet', withdraw: 'รายการถอน',
  };
  return labels[module] || module;
}
