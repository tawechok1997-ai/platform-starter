'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { adminApiFetch, clearAdminSession } from '../../../app/admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../../../app/(admin)/_components/admin-ui';

type AdminMe = { id: string; username: string; permissions?: string[] };
type SetupResponse = { secret: string; otpAuthUrl: string };
type SessionItem = { id: string; deviceId?: string | null; ipAddress?: string | null; userAgent?: string | null; createdAt: string; expiresAt: string; revokedAt?: string | null; current: boolean; active: boolean };
type OwnerRecoveryStatus = { healthy: boolean; recoveryCodesRemaining: number; protectedAdmins: Array<{ id: string; username: string; email?: string | null; status: string; twoFactorEnabled: boolean; roles: string[] }> };
type PendingAction =
  | { kind: 'disable-2fa' }
  | { kind: 'regenerate-codes' }
  | { kind: 'revoke-session'; session: SessionItem }
  | { kind: 'logout-others' }
  | { kind: 'logout-all' }
  | null;

const SAFE_ERRORS: Record<string, string> = {
  UNAUTHORIZED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  FORBIDDEN: 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการ',
  INVALID_2FA_CODE: 'รหัสยืนยันไม่ถูกต้อง',
  RATE_LIMITED: 'ลองใหม่ภายหลัง ระบบจำกัดจำนวนครั้งชั่วคราว',
};

export default function AdminSecurityPage() {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [setup, setSetup] = useState<SetupResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [ownerRecovery, setOwnerRecovery] = useState<OwnerRecoveryStatus | null>(null);
  const [code, setCode] = useState('');
  const [deactivateCode, setDeactivateCode] = useState('');
  const [regenerateCode, setRegenerateCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => { void loadAll(); }, []);
  useEffect(() => {
    if (!setup?.otpAuthUrl) { setQrDataUrl(''); return; }
    QRCode.toDataURL(setup.otpAuthUrl, { margin: 1, width: 220 }).then(setQrDataUrl).catch(() => setMessage('สร้าง QR code ไม่สำเร็จ'));
  }, [setup?.otpAuthUrl]);

  function safeError(data: unknown, fallback: string) {
    const payload = data as { code?: string; errorCode?: string } | null;
    return SAFE_ERRORS[payload?.code ?? payload?.errorCode ?? ''] ?? fallback;
  }

  async function loadAll() {
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      await Promise.all([loadMe(), loadSessions(), loadOwnerRecoveryStatus()]);
    } catch {
      setMessage('โหลดข้อมูลความปลอดภัยไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function loadMe() {
    const res = await adminApiFetch('/admin/auth/me');
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(safeError(data, 'โหลดข้อมูลแอดมินไม่สำเร็จ'));
    setMe(data);
  }

  async function loadSessions() {
    const res = await adminApiFetch('/admin/auth/sessions');
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(safeError(data, 'โหลด sessions ไม่สำเร็จ'));
    setSessions(data.items ?? []);
  }

  async function loadOwnerRecoveryStatus() {
    const res = await adminApiFetch('/admin/access/owner-recovery-status');
    const data = await res.json().catch(() => null);
    if (res.status === 403) return;
    if (!res.ok) throw new Error(safeError(data, 'โหลดสถานะ owner recovery ไม่สำเร็จ'));
    setOwnerRecovery(data);
  }

  async function startSetup() {
    if (loading) return;
    setLoading(true); setMessage('กำลังสร้าง 2FA secret...'); setRecoveryCodes([]);
    try {
      const res = await adminApiFetch('/admin/auth/2fa/setup', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(safeError(data, 'เริ่มตั้งค่า 2FA ไม่สำเร็จ')); return; }
      setSetup(data);
      setMessage('สร้าง 2FA secret แล้ว ให้บันทึก secret นี้ไว้ในแอป Authenticator');
    } catch { setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ'); }
    finally { setLoading(false); }
  }

  async function enable2FA() {
    if (!code.trim()) { setMessage('กรุณาใส่รหัสยืนยัน'); return; }
    if (loading) return;
    setLoading(true); setMessage('กำลังเปิดใช้งาน 2FA...');
    try {
      const res = await adminApiFetch('/admin/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code: code.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(safeError(data, 'เปิดใช้งาน 2FA ไม่สำเร็จ')); return; }
      setRecoveryCodes(data?.recoveryCodes ?? []);
      setCode('');
      setMessage('เปิดใช้งาน 2FA แล้ว กรุณาบันทึก recovery codes ทันที ระบบจะแสดงให้เห็นครั้งเดียว');
      await loadMe();
    } catch { setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ'); }
    finally { setLoading(false); }
  }

  async function deactivate2FA() {
    setLoading(true); setMessage('กำลังเปลี่ยนสถานะ 2FA...');
    try {
      const res = await adminApiFetch('/admin/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code: deactivateCode.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(safeError(data, 'เปลี่ยนสถานะ 2FA ไม่สำเร็จ')); return; }
      setDeactivateCode(''); setRegenerateCode(''); setRecoveryCodes([]); setSetup(null);
      setMessage('อัปเดตสถานะ 2FA แล้ว');
      await loadMe();
    } catch { setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ'); }
    finally { setLoading(false); setPendingAction(null); }
  }

  async function regenerateRecoveryCodes() {
    setLoading(true); setMessage('กำลังสร้าง recovery codes ชุดใหม่...');
    try {
      const res = await adminApiFetch('/admin/auth/2fa/recovery-codes/regenerate', { method: 'POST', body: JSON.stringify({ code: regenerateCode.trim() }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(safeError(data, 'สร้าง recovery codes ไม่สำเร็จ')); return; }
      setRecoveryCodes(data?.recoveryCodes ?? []); setRegenerateCode('');
      setMessage('สร้าง recovery codes ชุดใหม่แล้ว กรุณาบันทึกทันที');
    } catch { setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ'); }
    finally { setLoading(false); setPendingAction(null); }
  }

  async function revokeSession(session: SessionItem) {
    setLoading(true); setMessage('กำลังปิด session...');
    try {
      const res = await adminApiFetch(`/admin/auth/sessions/${session.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(safeError(data, 'ปิด session ไม่สำเร็จ')); return; }
      if (data?.current) { clearAdminSession(); window.location.replace('/login'); return; }
      setMessage('ปิด session แล้ว'); await loadSessions();
    } catch { setMessage('เชื่อมต่อระบบ session ไม่สำเร็จ'); }
    finally { setLoading(false); setPendingAction(null); }
  }

  async function logoutOtherDevices() {
    setLoading(true); setMessage('กำลังออกจากระบบอุปกรณ์อื่น...');
    try {
      const res = await adminApiFetch('/admin/auth/sessions/logout-others', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(safeError(data, 'ออกจากระบบอุปกรณ์อื่นไม่สำเร็จ')); return; }
      setMessage(`ออกจากระบบอุปกรณ์อื่นแล้ว ${data?.revoked ?? 0} session`); await loadSessions();
    } catch { setMessage('เชื่อมต่อระบบ session ไม่สำเร็จ'); }
    finally { setLoading(false); setPendingAction(null); }
  }

  async function endEverySession() {
    setLoading(true); setMessage('กำลังปิด session ทั้งหมด...');
    try {
      const res = await adminApiFetch('/admin/auth/sessions/logout-all', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(safeError(data, 'ปิด session ทั้งหมดไม่สำเร็จ')); return; }
      clearAdminSession(); window.location.replace('/login');
    } catch { setMessage('เชื่อมต่อระบบ session ไม่สำเร็จ'); }
    finally { setLoading(false); setPendingAction(null); }
  }

  async function confirmPendingAction() {
    const action = pendingAction;
    if (!action || loading) return;
    if (action.kind === 'disable-2fa') return void deactivate2FA();
    if (action.kind === 'regenerate-codes') return void regenerateRecoveryCodes();
    if (action.kind === 'revoke-session') return void revokeSession(action.session);
    if (action.kind === 'logout-others') return void logoutOtherDevices();
    return void endEverySession();
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`คัดลอก${label}แล้ว`); }
    catch { setMessage(`คัดลอก${label}ไม่สำเร็จ`); }
  }

  const activeCount = sessions.filter((item) => item.active).length;
  const otherActiveCount = sessions.filter((item) => item.active && !item.current).length;
  const confirmCopy = pendingAction ? {
    title: pendingAction.kind === 'disable-2fa' ? 'ยืนยันปิด 2FA' : pendingAction.kind === 'regenerate-codes' ? 'สร้าง Recovery Codes ชุดใหม่' : pendingAction.kind === 'logout-others' ? 'ออกจากระบบอุปกรณ์อื่น' : pendingAction.kind === 'logout-all' ? 'ปิด Session ทั้งหมด' : 'ปิด Session',
    description: pendingAction.kind === 'disable-2fa' ? 'บัญชีนี้จะไม่บังคับรหัสยืนยันสองขั้นตอนจนกว่าจะเปิดใหม่' : pendingAction.kind === 'regenerate-codes' ? 'Recovery codes ชุดเก่าทั้งหมดจะใช้ไม่ได้ทันที' : pendingAction.kind === 'logout-all' ? 'Session ทุกเครื่องรวมเครื่องนี้จะถูกปิด' : pendingAction.kind === 'logout-others' ? 'Session ของอุปกรณ์อื่นทั้งหมดจะถูกปิด' : pendingAction.session.current ? 'Session ปัจจุบันจะถูกปิดและต้องเข้าสู่ระบบใหม่' : 'Session ที่เลือกจะถูกเพิกถอน',
  } : null;

  return <AdminPage eyebrow="Security" title="Admin Security" description="ตั้งค่า 2FA และดู session ของบัญชีแอดมิน" actions={<AdminButton disabled={loading} onClick={() => void loadAll()}>{loading ? 'กำลังโหลด...' : 'Reload'}</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title="Admin" value={me?.username ?? '-'} helper={me?.id ?? ''} /><AdminMetric title="Permissions" value={String(me?.permissions?.length ?? 0)} helper="from current session" /><AdminMetric title="Active sessions" value={String(activeCount)} helper={`${sessions.length} loaded`} /></AdminMetricGrid>

    {ownerRecovery && <AdminCard title="Owner recovery readiness" description="ตรวจความพร้อมในการกู้คืนสิทธิ์ owner โดยไม่แสดง recovery code จริง"><AdminStack><div style={ownerRecoveryInfoStyle}><AdminBadge tone={ownerRecovery.healthy ? 'success' : 'warning'}>{ownerRecovery.healthy ? 'RECOVERY READY' : 'ACTION REQUIRED'}</AdminBadge><p>{ownerRecovery.healthy ? 'มี protected admin ที่เปิด 2FA และมี recovery code เหลืออยู่' : 'ต้องตรวจ 2FA ของ protected admin และ/หรือสร้าง recovery codes ชุดใหม่ก่อนเกิดเหตุ lockout'}</p></div><div style={recoverySummaryStyle}><span>Protected admins: {ownerRecovery.protectedAdmins.length}</span><span>Recovery codes remaining: {ownerRecovery.recoveryCodesRemaining}</span></div>{ownerRecovery.protectedAdmins.map((admin) => <div key={admin.id} style={ownerRecoveryRowStyle}><span>{admin.username} · {admin.status}</span><AdminBadge tone={admin.twoFactorEnabled ? 'success' : 'warning'}>{admin.twoFactorEnabled ? '2FA ON' : '2FA REQUIRED'}</AdminBadge></div>)}</AdminStack></AdminCard>}

    <AdminCard title="2FA Setup" description="สร้าง secret แล้วเปิดในแอป Authenticator เช่น Google Authenticator, 1Password หรือ Authy"><AdminStack><div style={infoStyle}><AdminBadge tone="success">TOTP READY</AdminBadge><p>Backend ตรวจรหัส TOTP จาก secret จริงแล้ว สแกน QR หรือคัดลอก OTP Auth URL เข้าแอป Authenticator แล้วใส่รหัส 6 หลักเพื่อเปิดใช้งาน</p></div>{!setup && <AdminButton disabled={loading} onClick={() => void startSetup()}>Generate 2FA Secret</AdminButton>}{setup && <section style={setupBoxStyle}>{qrDataUrl && <div style={qrBoxStyle}><img src={qrDataUrl} alt="2FA QR code" style={qrImageStyle} /><span>สแกนด้วยแอป Authenticator</span></div>}<label style={labelStyle}>Manual secret<div style={copyRowStyle}><input value={setup.secret} readOnly style={inputStyle} /><AdminButton tone="secondary" onClick={() => void copy(setup.secret, ' secret')}>Copy</AdminButton></div></label><label style={labelStyle}>OTP Auth URL<div style={copyRowStyle}><input value={setup.otpAuthUrl} readOnly style={inputStyle} /><AdminButton tone="secondary" onClick={() => void copy(setup.otpAuthUrl, ' OTP URL')}>Copy</AdminButton></div></label><label style={labelStyle}>Verification code<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="ใส่รหัส 6 หลักจาก Authenticator" style={inputStyle} /></label><AdminButton disabled={loading} onClick={() => void enable2FA()}>Enable 2FA</AdminButton></section>}</AdminStack></AdminCard>

    {recoveryCodes.length > 0 && <AdminCard title="Recovery Codes" description="บันทึกไว้ทันที ใช้แทนรหัส Authenticator ได้ และแต่ละ code ใช้ได้ครั้งเดียว"><AdminNotice>ระบบจะแสดง recovery codes ชุดนี้ให้เห็นครั้งเดียวเท่านั้น โปรดเก็บในที่ปลอดภัย</AdminNotice><div style={recoveryGridStyle}>{recoveryCodes.map((item) => <code key={item} style={recoveryCodeStyle}>{item}</code>)}</div><AdminButton onClick={() => void copy(recoveryCodes.join('\n'), ' recovery codes')}>Copy all recovery codes</AdminButton></AdminCard>}

    <AdminCard title="Deactivate 2FA" description="เปลี่ยนสถานะ 2FA โดยต้องยืนยันด้วย TOTP หรือ recovery code ปัจจุบัน"><div style={copyRowStyle}><input value={deactivateCode} onChange={(event) => setDeactivateCode(event.target.value)} placeholder="ใส่ TOTP code หรือ recovery code ปัจจุบัน" style={inputStyle} /><AdminButton disabled={loading || !deactivateCode.trim()} tone="danger" onClick={() => setPendingAction({ kind: 'disable-2fa' })}>Deactivate</AdminButton></div></AdminCard>
    <AdminCard title="Regenerate Recovery Codes" description="สร้าง recovery codes ชุดใหม่ ชุดเก่าจะใช้ไม่ได้ทันที"><div style={copyRowStyle}><input value={regenerateCode} onChange={(event) => setRegenerateCode(event.target.value)} placeholder="ใส่ TOTP code หรือ recovery code ปัจจุบัน" style={inputStyle} /><AdminButton disabled={loading || !regenerateCode.trim()} tone="secondary" onClick={() => setPendingAction({ kind: 'regenerate-codes' })}>Regenerate</AdminButton></div></AdminCard>

    <AdminCard title="Admin Sessions" description="รายการ session ล่าสุดของบัญชีแอดมินนี้"><div style={sessionToolbarStyle}><AdminButton disabled={loading || otherActiveCount === 0} onClick={() => setPendingAction({ kind: 'logout-others' })}>Logout other devices</AdminButton><AdminButton disabled={loading || activeCount === 0} tone="danger" onClick={() => setPendingAction({ kind: 'logout-all' })}>End all sessions</AdminButton></div><AdminStack>{sessions.map((session) => <section key={session.id} style={sessionBoxStyle}><div style={sessionTopStyle}><div style={badgeRowStyle}><AdminBadge tone={session.active ? 'success' : 'neutral'}>{session.active ? 'ACTIVE' : 'ENDED'}</AdminBadge>{session.current && <AdminBadge tone="warning">CURRENT</AdminBadge>}</div>{session.active && <AdminButton disabled={loading} tone="danger" onClick={() => setPendingAction({ kind: 'revoke-session', session })}>Revoke</AdminButton>}</div><strong>{session.deviceId || 'Unknown device'}</strong><p>IP: {session.ipAddress || '-'}</p><p style={agentStyle}>UA: {session.userAgent || '-'}</p><p>Created: {new Date(session.createdAt).toLocaleString('th-TH')}</p><p>Expires: {new Date(session.expiresAt).toLocaleString('th-TH')}</p>{session.revokedAt && <p>Ended: {new Date(session.revokedAt).toLocaleString('th-TH')}</p>}</section>)}{sessions.length === 0 && <AdminNotice>ยังไม่มี session ให้แสดง</AdminNotice>}</AdminStack></AdminCard>

    <AdminConfirmDialog open={Boolean(pendingAction)} title={confirmCopy?.title ?? ''} description={confirmCopy?.description ?? ''} confirmLabel="ยืนยัน" tone={pendingAction?.kind === 'disable-2fa' || pendingAction?.kind === 'logout-all' || pendingAction?.kind === 'revoke-session' ? 'danger' : 'primary'} busy={loading} onCancel={() => setPendingAction(null)} onConfirm={() => void confirmPendingAction()} />
  </AdminPage>;
}

const ownerRecoveryInfoStyle = { border: '1px solid rgba(245,197,66,.28)', borderRadius: 16, padding: 12, background: 'rgba(245,197,66,.08)', display: 'grid', gap: 8 };
const recoverySummaryStyle = { display: 'flex', gap: 16, flexWrap: 'wrap' as const, color: '#cbd5e1' };
const ownerRecoveryRowStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const, borderTop: '1px solid rgba(148,163,184,.14)', paddingTop: 8 };
const infoStyle = { border: '1px solid rgba(34,197,94,.28)', borderRadius: 16, padding: 12, background: 'rgba(34,197,94,.08)', display: 'grid', gap: 8 } as const;
const setupBoxStyle = { display: 'grid', gap: 12, minWidth: 0 } as const;
const labelStyle = { display: 'grid', gap: 7, fontWeight: 850, minWidth: 0 } as const;
const copyRowStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 8, minWidth: 0 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%', boxSizing: 'border-box' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const };
const qrBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 14, display: 'grid', justifyItems: 'center', gap: 10, background: '#0b1220', minWidth: 0 } as const;
const qrImageStyle = { width: 220, height: 220, maxWidth: '100%', borderRadius: 12, background: '#fff', padding: 8 } as const;
const recoveryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 8, margin: '12px 0' } as const;
const recoveryCodeStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 12, padding: 10, background: 'rgba(245,197,66,.08)', color: '#f5c542', fontWeight: 900, textAlign: 'center' as const, letterSpacing: 1, overflowWrap: 'anywhere' as const };
const sessionBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 12, display: 'grid', gap: 6, minWidth: 0, background: 'rgba(148,163,184,.045)' } as const;
const sessionTopStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 10, alignItems: 'center', minWidth: 0 } as const;
const sessionToolbarStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: 10, marginBottom: 12 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const agentStyle = { overflowWrap: 'anywhere' as const, color: '#94a3b8' };