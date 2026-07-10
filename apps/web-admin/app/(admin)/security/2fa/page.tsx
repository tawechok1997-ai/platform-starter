'use client';

import { FormEvent, useEffect, useState } from 'react';
import { adminApiFetch } from '../../../admin-api';
import { AdminButton, AdminCard, AdminNotice, AdminPage, AdminStack } from '../../_components/admin-ui';

type SetupResult = { secret: string; otpAuthUrl: string };
type EnableResult = { success: boolean; recoveryCodes: string[] };

export default function AdminTwoFactorSetupPage() {
  const [setup, setSetup] = useState<SetupResult | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [alreadyEnabled, setAlreadyEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    adminApiFetch('/admin/auth/me')
      .then(async (response) => ({ response, payload: await response.json().catch(() => null) }))
      .then(({ response, payload }) => {
        if (!active || !response.ok) return;
        if (payload?.twoFactorEnabled) setAlreadyEnabled(true);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function beginSetup() {
    setBusy(true);
    setMessage('');
    try {
      const response = await adminApiFetch('/admin/auth/2fa/setup', { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.secret || !payload?.otpAuthUrl) {
        setMessage(typeof payload?.message === 'string' ? payload.message : 'เริ่มตั้งค่า 2FA ไม่สำเร็จ');
        return;
      }
      setSetup(payload);
      setMessage('เพิ่มบัญชีนี้ในแอป Authenticator แล้วกรอกรหัส 6 หลักเพื่อยืนยัน');
    } catch {
      setMessage('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  }

  async function enable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setMessage('กรุณากรอกรหัสยืนยัน 6 หลัก');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await adminApiFetch('/admin/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      const payload = await response.json().catch(() => null) as EnableResult | null;
      if (!response.ok || !payload?.success || !Array.isArray(payload.recoveryCodes)) {
        setMessage(typeof (payload as any)?.message === 'string' ? (payload as any).message : 'เปิดใช้ 2FA ไม่สำเร็จ');
        return;
      }
      setRecoveryCodes(payload.recoveryCodes);
      setSetup(null);
      setCode('');
      setAlreadyEnabled(true);
      setMessage('เปิดใช้ 2FA แล้ว โปรดเก็บ Recovery Codes ไว้ในที่ปลอดภัย');
    } catch {
      setMessage('เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string, success: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(success);
    } catch {
      setMessage('คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกด้วยตนเอง');
    }
  }

  function continueToAdmin() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
    window.location.replace(safeNext);
  }

  return <AdminPage
    eyebrow="Security"
    title="ตั้งค่าการยืนยันตัวตนสองขั้นตอน"
    description="บัญชีที่มีสิทธิ์สำคัญต้องเปิด 2FA ก่อนใช้งานส่วนอื่นของระบบ"
  >
    {message && <AdminNotice>{message}</AdminNotice>}

    {recoveryCodes.length > 0 ? <AdminCard title="Recovery Codes" description="แต่ละรหัสใช้ได้ครั้งเดียวและจะไม่แสดงอีกหลังออกจากหน้านี้">
      <AdminStack>
        <div style={codesStyle}>{recoveryCodes.map((item) => <code key={item} style={codeItemStyle}>{item}</code>)}</div>
        <div style={actionsStyle}>
          <AdminButton onClick={() => copy(recoveryCodes.join('\n'), 'คัดลอก Recovery Codes แล้ว')}>คัดลอกรหัสทั้งหมด</AdminButton>
          <AdminButton onClick={continueToAdmin}>ดำเนินการต่อ</AdminButton>
        </div>
      </AdminStack>
    </AdminCard> : alreadyEnabled && !setup ? <AdminCard title="2FA เปิดใช้งานแล้ว" description="บัญชีนี้ผ่านข้อกำหนดความปลอดภัยสำหรับสิทธิ์ระดับสูง">
      <AdminButton onClick={continueToAdmin}>กลับไปใช้งานระบบ</AdminButton>
    </AdminCard> : !setup ? <AdminCard title="เริ่มตั้งค่า" description="ใช้ Google Authenticator, Microsoft Authenticator, 1Password หรือแอป TOTP ที่รองรับ">
      <AdminButton disabled={busy} onClick={beginSetup}>{busy ? 'กำลังเตรียม...' : 'เริ่มตั้งค่า 2FA'}</AdminButton>
    </AdminCard> : <AdminCard title="เพิ่มบัญชีใน Authenticator" description="เก็บ Secret นี้เป็นความลับ ห้ามส่งผ่านแชตหรือแนบใน Ticket">
      <AdminStack>
        <label style={fieldStyle}>Secret
          <div style={secretRowStyle}>
            <code style={secretStyle}>{setup.secret}</code>
            <AdminButton onClick={() => copy(setup.secret, 'คัดลอก Secret แล้ว')}>คัดลอก</AdminButton>
          </div>
        </label>
        <label style={fieldStyle}>Setup URI
          <textarea value={setup.otpAuthUrl} readOnly rows={3} style={textareaStyle} />
        </label>
        <form onSubmit={enable} style={formStyle}>
          <label style={fieldStyle}>รหัสยืนยัน 6 หลัก
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              disabled={busy}
              style={inputStyle}
            />
          </label>
          <AdminButton disabled={busy || code.length !== 6}>{busy ? 'กำลังยืนยัน...' : 'ยืนยันและเปิดใช้ 2FA'}</AdminButton>
        </form>
      </AdminStack>
    </AdminCard>}
  </AdminPage>;
}

const fieldStyle = { display: 'grid', gap: 8, fontWeight: 850, color: '#e2e8f0' } as const;
const formStyle = { display: 'grid', gap: 12, maxWidth: 420 } as const;
const inputStyle = { width: '100%', minHeight: 48, borderRadius: 12, border: '1px solid rgba(148,163,184,.28)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', boxSizing: 'border-box', fontSize: 18, letterSpacing: '.18em' } as const;
const textareaStyle = { width: '100%', resize: 'vertical', borderRadius: 12, border: '1px solid rgba(148,163,184,.28)', background: '#070d18', color: '#f8fafc', padding: 12, boxSizing: 'border-box', overflowWrap: 'anywhere' } as const;
const secretRowStyle = { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' } as const;
const secretStyle = { padding: 12, borderRadius: 10, background: '#070d18', color: '#f5c542', overflowWrap: 'anywhere' } as const;
const codesStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 } as const;
const codeItemStyle = { padding: 12, borderRadius: 10, background: '#070d18', color: '#f8fafc', textAlign: 'center' as const, letterSpacing: '.08em' } as const;
const actionsStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' } as const;
