'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminButton, AdminCard, AdminLinkButton, AdminNotice } from '../../../components/admin-ui';

type AdminProfile = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
};

const emptyProfile: AdminProfile = {
  displayName: '',
  firstName: '',
  lastName: '',
  position: '',
  department: '',
  avatarUrl: '',
};

export default function EditAdminProfilePage() {
  const [form, setForm] = useState<AdminProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' });
        const data = (await response.json().catch(() => null)) as AdminProfile | null;
        if (!response.ok || !data) throw new Error('โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
        if (!cancelled) setForm({ ...emptyProfile, ...data });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await adminApiFetch('/admin/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => null)) as AdminProfile | { message?: string } | null;
      if (!response.ok) {
        throw new Error(data && 'message' in data && data.message ? data.message : 'บันทึกโปรไฟล์ไม่สำเร็จ');
      }
      if (data && !('message' in data)) setForm({ ...emptyProfile, ...data });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึกโปรไฟล์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="admin-profile-edit-skeleton" aria-label="กำลังโหลดข้อมูลโปรไฟล์" />;

  return (
    <div className="admin-profile-edit-page">
      <header className="admin-profile-edit-head">
        <div>
          <span>ADMIN IDENTITY</span>
          <h1>แก้ไขโปรไฟล์ผู้ดูแล</h1>
          <p>ข้อมูลชุดนี้จะแสดงบน Topbar หน้าโปรไฟล์ และ Audit log ของระบบ</p>
        </div>
        <AdminLinkButton href="/profile" tone="default">
          <span aria-hidden="true">←</span>
          กลับหน้าโปรไฟล์
        </AdminLinkButton>
      </header>

      {error ? <AdminNotice tone="danger">{error}</AdminNotice> : null}
      {saved ? <AdminNotice tone="success">บันทึกโปรไฟล์เรียบร้อยแล้ว</AdminNotice> : null}

      <form onSubmit={submit} className="admin-profile-edit-grid">
        <AdminCard elevated className="admin-profile-edit-card">
          <div className="admin-profile-edit-card__head">
            <div>
              <span>ข้อมูลส่วนตัว</span>
              <h2>ชื่อและภาพประจำตัว</h2>
            </div>
            <span aria-hidden="true">👤</span>
          </div>
          <label>
            <span>ชื่อที่แสดง</span>
            <input
              value={form.displayName ?? ''}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              maxLength={100}
            />
          </label>
          <div className="admin-profile-edit-pair">
            <label>
              <span>ชื่อจริง</span>
              <input
                value={form.firstName ?? ''}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                maxLength={80}
              />
            </label>
            <label>
              <span>นามสกุล</span>
              <input
                value={form.lastName ?? ''}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                maxLength={80}
              />
            </label>
          </div>
          <label>
            <span>URL รูปโปรไฟล์แบบ HTTPS</span>
            <input
              type="url"
              value={form.avatarUrl ?? ''}
              onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })}
              placeholder="https://..."
              maxLength={2048}
            />
          </label>
        </AdminCard>

        <AdminCard elevated className="admin-profile-edit-card">
          <div className="admin-profile-edit-card__head">
            <div>
              <span>องค์กร</span>
              <h2>ตำแหน่งและแผนก</h2>
            </div>
            <span aria-hidden="true">🛡</span>
          </div>
          <label>
            <span>ตำแหน่ง</span>
            <input
              value={form.position ?? ''}
              onChange={(event) => setForm({ ...form, position: event.target.value })}
              maxLength={120}
            />
          </label>
          <label>
            <span>แผนก</span>
            <input
              value={form.department ?? ''}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
              maxLength={120}
            />
          </label>
          <p className="admin-profile-edit-help">
            Role และ Permission เปลี่ยนไม่ได้จากหน้านี้ เพื่อไม่ให้คนแก้ชื่อตำแหน่งแล้วบังเอิญกลายเป็นพระเจ้าแห่งระบบ
          </p>
        </AdminCard>

        <div className="admin-profile-edit-actions">
          <AdminLinkButton href="/profile" tone="default">
            ยกเลิก
          </AdminLinkButton>
          <AdminButton type="submit" tone="brand" disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
