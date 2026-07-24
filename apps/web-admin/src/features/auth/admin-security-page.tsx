'use client';

import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApiFetch, clearAdminSession } from '../../../app/admin-api';
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
} from '../../../app/(admin)/_components/admin-ui';

type AdminMe = { id: string; username: string; permissions?: string[] };
type SetupResponse = { secret: string; otpAuthUrl: string };
type SessionItem = {
  id: string;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  current: boolean;
  active: boolean;
};
type ProtectedAdmin = {
  id: string;
  username: string;
  email?: string | null;
  status: string;
  twoFactorEnabled: boolean;
  roles: string[];
};
type OwnerRecoveryStatus = {
  healthy: boolean;
  recoveryCodesRemaining: number;
  protectedAdmins: ProtectedAdmin[];
};
type PendingAction =
  | { kind: 'disable-2fa' }
  | { kind: 'regenerate-codes' }
  | { kind: 'revoke-session'; session: SessionItem }
  | { kind: 'logout-others' }
  | { kind: 'logout-all' }
  | null;

type LoadStatus = { me: boolean; sessions: boolean; recovery: boolean };

const SAFE_ERRORS: Record<string, string> = {
  UNAUTHORIZED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  FORBIDDEN: 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการ',
  INVALID_2FA_CODE: 'รหัสยืนยันไม่ถูกต้อง',
  RATE_LIMITED: 'ลองใหม่ภายหลัง ระบบจำกัดจำนวนครั้งชั่วคราว',
};
const SENSITIVE_DISPLAY_TTL_MS = 5 * 60_000;
const TOTP_PATTERN = /^\d{6}$/;

export default function AdminSecurityPage() {
  const loadRequestRef = useRef(0);
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
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const pageBusy = loading || Boolean(busyKey);

  const loadMe = useCallback(async () => {
    const response = await adminApiFetch('/admin/auth/me');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !isAdminMe(payload)) throw new Error('me');
    setMe(payload);
  }, []);

  const loadSessions = useCallback(async () => {
    const response = await adminApiFetch('/admin/auth/sessions');
    const payload = await response.json().catch(() => null);
    if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) throw new Error('sessions');
    setSessions(payload.items.filter(isSessionItem));
  }, []);

  const loadOwnerRecoveryStatus = useCallback(async () => {
    const response = await adminApiFetch('/admin/access/owner-recovery-status');
    const payload = await response.json().catch(() => null);
    if (response.status === 403) {
      setOwnerRecovery(null);
      return;
    }
    if (!response.ok || !isOwnerRecoveryStatus(payload)) throw new Error('recovery');
    setOwnerRecovery(payload);
  }, []);

  const loadAll = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setLoading(true);
    setMessage('กำลังโหลดข้อมูลความปลอดภัย...');
    const status: LoadStatus = { me: false, sessions: false, recovery: false };

    try {
      await loadMe();
      status.me = true;
    } catch {
      if (loadRequestRef.current === requestId) setMe(null);
    }

    try {
      await loadSessions();
      status.sessions = true;
    } catch {
      if (loadRequestRef.current === requestId) setSessions([]);
    }

    try {
      await loadOwnerRecoveryStatus();
      status.recovery = true;
    } catch {
      if (loadRequestRef.current === requestId) setOwnerRecovery(null);
    }

    if (loadRequestRef.current === requestId) {
      const loaded = Object.values(status).filter(Boolean).length;
      setMessage(loaded === 3 ? '' : loaded > 0
        ? 'โหลดข้อมูลหลักแล้ว แต่ข้อมูลความปลอดภัยบางส่วนไม่ครบ กรุณารีเฟรช'
        : 'โหลดข้อมูลความปลอดภัยไม่สำเร็จ กรุณาลองใหม่');
      setLoading(false);
    }
  }, [loadMe, loadOwnerRecoveryStatus, loadSessions]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!setup?.otpAuthUrl) {
      setQrDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(setup.otpAuthUrl, { margin: 1, width: 220 })
      .then((value) => { if (!cancelled) setQrDataUrl(value); })
      .catch(() => { if (!cancelled) setMessage('สร้าง QR code ไม่สำเร็จ กรุณาใช้ Manual secret แทน'); });
    return () => { cancelled = true; };
  }, [setup?.otpAuthUrl]);

  useEffect(() => {
    if (!setup) return;
    const timer = window.setTimeout(() => {
      setSetup(null);
      setQrDataUrl('');
      setCode('');
      setMessage('ข้อมูลตั้งค่า 2FA ถูกล้างจากหน้าจอแล้วเพื่อความปลอดภัย');
    }, SENSITIVE_DISPLAY_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [setup]);

  useEffect(() => {
    if (!recoveryCodes.length) return;
    const timer = window.setTimeout(() => {
      setRecoveryCodes([]);
      setMessage('Recovery codes ถูกล้างจากหน้าจอแล้วเพื่อความปลอดภัย');
    }, SENSITIVE_DISPLAY_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [recoveryCodes]);

  function safeError(data: unknown, fallback: string) {
    if (!isRecord(data)) return fallback;
    const codeValue = typeof data.code === 'string' ? data.code : typeof data.errorCode === 'string' ? data.errorCode : '';
    return SAFE_ERRORS[codeValue] ?? fallback;
  }

  async function startSetup() {
    if (pageBusy) return;
    setBusyKey('setup');
    setMessage('กำลังสร้าง 2FA secret...');
    setRecoveryCodes([]);
    try {
      const response = await adminApiFetch('/admin/auth/2fa/setup', { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isSetupResponse(payload)) {
        setMessage(safeError(payload, 'เริ่มตั้งค่า 2FA ไม่สำเร็จ'));
        return;
      }
      setSetup(payload);
      setMessage('สร้าง 2FA secret แล้ว ข้อมูลนี้จะแสดงชั่วคราว 5 นาที');
    } catch {
      setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ');
    } finally {
      setBusyKey('');
    }
  }

  async function enable2FA() {
    const normalizedCode = code.trim();
    if (!TOTP_PATTERN.test(normalizedCode)) {
      setMessage('กรุณาใส่รหัส TOTP 6 หลัก');
      return;
    }
    if (pageBusy || !setup) return;
    setBusyKey('enable-2fa');
    setMessage('กำลังเปิดใช้งาน 2FA...');
    try {
      const response = await adminApiFetch('/admin/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: normalizedCode }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecoveryCodeResponse(payload)) {
        setMessage(safeError(payload, 'เปิดใช้งาน 2FA ไม่สำเร็จ'));
        return;
      }
      setRecoveryCodes(payload.recoveryCodes);
      setCode('');
      setSetup(null);
      setQrDataUrl('');
      setMessage('เปิดใช้งาน 2FA แล้ว Recovery codes จะแสดงชั่วคราว 5 นาที');
      await loadMe();
    } catch {
      setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ');
    } finally {
      setBusyKey('');
    }
  }

  async function deactivate2FA() {
    const normalizedCode = deactivateCode.trim();
    if (!isValidSecurityCode(normalizedCode)) {
      setMessage('กรุณาใส่ TOTP หรือ recovery code ที่ถูกต้อง');
      setPendingAction(null);
      return;
    }
    setBusyKey('disable-2fa');
    setMessage('กำลังปิด 2FA...');
    try {
      const response = await adminApiFetch('/admin/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: normalizedCode }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(safeError(payload, 'ปิด 2FA ไม่สำเร็จ'));
        return;
      }
      setDeactivateCode('');
      setRegenerateCode('');
      setRecoveryCodes([]);
      setSetup(null);
      setQrDataUrl('');
      setMessage('ปิด 2FA แล้ว');
      await loadMe();
    } catch {
      setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ');
    } finally {
      setBusyKey('');
      setPendingAction(null);
    }
  }

  async function regenerateRecoveryCodes() {
    const normalizedCode = regenerateCode.trim();
    if (!isValidSecurityCode(normalizedCode)) {
      setMessage('กรุณาใส่ TOTP หรือ recovery code ที่ถูกต้อง');
      setPendingAction(null);
      return;
    }
    setBusyKey('regenerate-codes');
    setMessage('กำลังสร้าง recovery codes ชุดใหม่...');
    try {
      const response = await adminApiFetch('/admin/auth/2fa/recovery-codes/regenerate', {
        method: 'POST',
        body: JSON.stringify({ code: normalizedCode }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecoveryCodeResponse(payload)) {
        setMessage(safeError(payload, 'สร้าง recovery codes ไม่สำเร็จ'));
        return;
      }
      setRecoveryCodes(payload.recoveryCodes);
      setRegenerateCode('');
      setMessage('สร้าง recovery codes ชุดใหม่แล้ว ข้อมูลจะแสดงชั่วคราว 5 นาที');
    } catch {
      setMessage('เชื่อมต่อระบบ 2FA ไม่สำเร็จ');
    } finally {
      setBusyKey('');
      setPendingAction(null);
    }
  }

  async function revokeSession(session: SessionItem) {
    setBusyKey(`revoke:${session.id}`);
    setMessage('กำลังปิด session...');
    try {
      const response = await adminApiFetch(`/admin/auth/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(safeError(payload, 'ปิด session ไม่สำเร็จ'));
        return;
      }
      if (isRecord(payload) && payload.current === true) {
        clearAdminSession();
        window.location.replace('/login');
        return;
      }
      setMessage('ปิด session แล้ว');
      await loadSessions();
    } catch {
      setMessage('เชื่อมต่อระบบ session ไม่สำเร็จ');
    } finally {
      setBusyKey('');
      setPendingAction(null);
    }
  }

  async function logoutOtherDevices() {
    setBusyKey('logout-others');
    setMessage('กำลังออกจากระบบอุปกรณ์อื่น...');
    try {
      const response = await adminApiFetch('/admin/auth/sessions/logout-others', { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(safeError(payload, 'ออกจากระบบอุปกรณ์อื่นไม่สำเร็จ'));
        return;
      }
      const revoked = isRecord(payload) ? Number(payload.revoked ?? 0) : 0;
      setMessage(`ออกจากระบบอุปกรณ์อื่นแล้ว ${Number.isFinite(revoked) ? Math.max(0, revoked) : 0} session`);
      await loadSessions();
    } catch {
      setMessage('เชื่อมต่อระบบ session ไม่สำเร็จ');
    } finally {
      setBusyKey('');
      setPendingAction(null);
    }
  }

  async function endEverySession() {
    setBusyKey('logout-all');
    setMessage('กำลังปิด session ทั้งหมด...');
    try {
      const response = await adminApiFetch('/admin/auth/sessions/logout-all', { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(safeError(payload, 'ปิด session ทั้งหมดไม่สำเร็จ'));
        return;
      }
      clearAdminSession();
      window.location.replace('/login');
    } catch {
      setMessage('เชื่อมต่อระบบ session ไม่สำเร็จ');
    } finally {
      setBusyKey('');
      setPendingAction(null);
    }
  }

  async function confirmPendingAction() {
    const action = pendingAction;
    if (!action || pageBusy) return;
    if (action.kind === 'disable-2fa') return void deactivate2FA();
    if (action.kind === 'regenerate-codes') return void regenerateRecoveryCodes();
    if (action.kind === 'revoke-session') return void revokeSession(action.session);
    if (action.kind === 'logout-others') return void logoutOtherDevices();
    return void endEverySession();
  }

  async function copy(value: string, label: string) {
    if (!value || pageBusy) return;
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`คัดลอก${label}แล้ว กรุณาเก็บไว้ในที่ปลอดภัย`);
    } catch {
      setMessage(`คัดลอก${label}ไม่สำเร็จ`);
    }
  }

  function clearSetup() {
    if (pageBusy) return;
    setSetup(null);
    setQrDataUrl('');
    setCode('');
    setMessage('ล้างข้อมูลตั้งค่า 2FA จากหน้าจอแล้ว');
  }

  function clearRecoveryCodes() {
    if (pageBusy) return;
    setRecoveryCodes([]);
    setMessage('ล้าง Recovery codes จากหน้าจอแล้ว');
  }

  const activeCount = sessions.filter((item) => item.active).length;
  const otherActiveCount = sessions.filter((item) => item.active && !item.current).length;
  const confirmCopy = pendingAction ? {
    title: pendingAction.kind === 'disable-2fa' ? 'ยืนยันปิด 2FA'
      : pendingAction.kind === 'regenerate-codes' ? 'สร้าง Recovery Codes ชุดใหม่'
        : pendingAction.kind === 'logout-others' ? 'ออกจากระบบอุปกรณ์อื่น'
          : pendingAction.kind === 'logout-all' ? 'ปิด Session ทั้งหมด' : 'ปิด Session',
    description: pendingAction.kind === 'disable-2fa' ? 'บัญชีนี้จะไม่บังคับรหัสยืนยันสองขั้นตอนจนกว่าจะเปิดใหม่'
      : pendingAction.kind === 'regenerate-codes' ? 'Recovery codes ชุดเก่าทั้งหมดจะใช้ไม่ได้ทันที'
        : pendingAction.kind === 'logout-all' ? 'Session ทุกเครื่องรวมเครื่องนี้จะถูกปิด'
          : pendingAction.kind === 'logout-others' ? 'Session ของอุปกรณ์อื่นทั้งหมดจะถูกปิด'
            : pendingAction.session.current ? 'Session ปัจจุบันจะถูกปิดและต้องเข้าสู่ระบบใหม่' : 'Session ที่เลือกจะถูกเพิกถอน',
  } : null;

  return <AdminPage
    eyebrow="Security"
    title="Admin Security"
    description="ตั้งค่า 2FA และดู session ของบัญชีแอดมิน"
    actions={<AdminButton disabled={pageBusy} onClick={() => void loadAll()}>{loading ? 'กำลังโหลด...' : 'Reload'}</AdminButton>}
  >
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ไม่ถูกต้อง') || message.includes('ไม่ครบ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="Admin" value={me?.username ?? '-'} helper={me?.id ?? ''} />
      <AdminMetric title="Permissions" value={String(me?.permissions?.length ?? 0)} helper="from current session" />
      <AdminMetric title="Active sessions" value={String(activeCount)} helper={`${sessions.length} loaded`} />
    </AdminMetricGrid>

    {ownerRecovery && <AdminCard title="Owner recovery readiness" description="ตรวจความพร้อมในการกู้คืนสิทธิ์ owner โดยไม่แสดง recovery code จริง">
      <AdminStack>
        <div style={ownerRecoveryInfoStyle}>
          <AdminBadge tone={ownerRecovery.healthy ? 'success' : 'warning'}>{ownerRecovery.healthy ? 'RECOVERY READY' : 'ACTION REQUIRED'}</AdminBadge>
          <p>{ownerRecovery.healthy ? 'มี protected admin ที่เปิด 2FA และมี recovery code เหลืออยู่' : 'ต้องตรวจ 2FA ของ protected admin และ/หรือสร้าง recovery codes ชุดใหม่ก่อนเกิดเหตุ lockout'}</p>
        </div>
        <div style={recoverySummaryStyle}>
          <span>Protected admins: {ownerRecovery.protectedAdmins.length}</span>
          <span>Recovery codes remaining: {ownerRecovery.recoveryCodesRemaining}</span>
        </div>
        {ownerRecovery.protectedAdmins.map((admin) => <div key={admin.id} style={ownerRecoveryRowStyle}>
          <span>{admin.username} · {admin.status}</span>
          <AdminBadge tone={admin.twoFactorEnabled ? 'success' : 'warning'}>{admin.twoFactorEnabled ? '2FA ON' : '2FA REQUIRED'}</AdminBadge>
        </div>)}
      </AdminStack>
    </AdminCard>}

    <AdminCard title="2FA Setup" description="สร้าง secret แล้วเปิดในแอป Authenticator เช่น Google Authenticator, 1Password หรือ Authy">
      <AdminStack>
        <div style={infoStyle}><AdminBadge tone="success">TOTP READY</AdminBadge><p>สแกน QR หรือคัดลอก OTP Auth URL แล้วใส่รหัส 6 หลักเพื่อเปิดใช้งาน</p></div>
        {!setup && <AdminButton disabled={pageBusy} onClick={() => void startSetup()}>Generate 2FA Secret</AdminButton>}
        {setup && <section style={setupBoxStyle}>
          <AdminNotice tone="warning">Secret และ QR จะแสดงชั่วคราว 5 นาที</AdminNotice>
          {qrDataUrl && <div style={qrBoxStyle}><img src={qrDataUrl} alt="2FA QR code" style={qrImageStyle} /><span>สแกนด้วยแอป Authenticator</span></div>}
          <label style={labelStyle}>Manual secret<div style={copyRowStyle}><input value={setup.secret} readOnly style={inputStyle} /><AdminButton tone="secondary" disabled={pageBusy} onClick={() => void copy(setup.secret, ' secret')}>Copy</AdminButton></div></label>
          <label style={labelStyle}>OTP Auth URL<div style={copyRowStyle}><input value={setup.otpAuthUrl} readOnly style={inputStyle} /><AdminButton tone="secondary" disabled={pageBusy} onClick={() => void copy(setup.otpAuthUrl, ' OTP URL')}>Copy</AdminButton></div></label>
          <label style={labelStyle}>Verification code<input value={code} maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="ใส่รหัส 6 หลักจาก Authenticator" style={inputStyle} /></label>
          <div style={securityActionStyle}><AdminButton disabled={pageBusy || !TOTP_PATTERN.test(code)} onClick={() => void enable2FA()}>Enable 2FA</AdminButton><AdminButton tone="secondary" disabled={pageBusy} onClick={clearSetup}>ล้างข้อมูล</AdminButton></div>
        </section>}
      </AdminStack>
    </AdminCard>

    {recoveryCodes.length > 0 && <AdminCard title="Recovery Codes" description="บันทึกไว้ทันที แต่ละ code ใช้ได้ครั้งเดียว">
      <AdminNotice tone="warning">Recovery codes จะแสดงชั่วคราว 5 นาที</AdminNotice>
      <div style={recoveryGridStyle}>{recoveryCodes.map((item) => <code key={item} style={recoveryCodeStyle}>{item}</code>)}</div>
      <div style={securityActionStyle}><AdminButton disabled={pageBusy} onClick={() => void copy(recoveryCodes.join('\n'), ' recovery codes')}>Copy all recovery codes</AdminButton><AdminButton tone="secondary" disabled={pageBusy} onClick={clearRecoveryCodes}>ล้างจากหน้าจอ</AdminButton></div>
    </AdminCard>}

    <AdminCard title="Deactivate 2FA" description="ต้องยืนยันด้วย TOTP หรือ recovery code ปัจจุบัน">
      <div style={copyRowStyle}><input value={deactivateCode} maxLength={128} onChange={(event) => setDeactivateCode(event.target.value)} placeholder="ใส่ TOTP code หรือ recovery code ปัจจุบัน" style={inputStyle} /><AdminButton disabled={pageBusy || !isValidSecurityCode(deactivateCode.trim())} tone="danger" onClick={() => setPendingAction({ kind: 'disable-2fa' })}>Deactivate</AdminButton></div>
    </AdminCard>

    <AdminCard title="Regenerate Recovery Codes" description="ชุดเก่าจะใช้ไม่ได้ทันที">
      <div style={copyRowStyle}><input value={regenerateCode} maxLength={128} onChange={(event) => setRegenerateCode(event.target.value)} placeholder="ใส่ TOTP code หรือ recovery code ปัจจุบัน" style={inputStyle} /><AdminButton disabled={pageBusy || !isValidSecurityCode(regenerateCode.trim())} tone="secondary" onClick={() => setPendingAction({ kind: 'regenerate-codes' })}>Regenerate</AdminButton></div>
    </AdminCard>

    <AdminCard title="Admin Sessions" description="รายการ session ล่าสุดของบัญชีแอดมินนี้">
      <div style={sessionToolbarStyle}><AdminButton disabled={pageBusy || otherActiveCount === 0} onClick={() => setPendingAction({ kind: 'logout-others' })}>Logout other devices</AdminButton><AdminButton disabled={pageBusy || activeCount === 0} tone="danger" onClick={() => setPendingAction({ kind: 'logout-all' })}>End all sessions</AdminButton></div>
      <AdminStack>
        {sessions.map((session) => <section key={session.id} style={sessionBoxStyle}>
          <div style={sessionTopStyle}><div style={badgeRowStyle}><AdminBadge tone={session.active ? 'success' : 'neutral'}>{session.active ? 'ACTIVE' : 'ENDED'}</AdminBadge>{session.current && <AdminBadge tone="warning">CURRENT</AdminBadge>}</div>{session.active && <AdminButton disabled={pageBusy} tone="danger" onClick={() => setPendingAction({ kind: 'revoke-session', session })}>Revoke</AdminButton>}</div>
          <strong>{session.deviceId || 'Unknown device'}</strong>
          <p>IP: {session.ipAddress || '-'}</p>
          <p style={agentStyle}>UA: {session.userAgent || '-'}</p>
          <p>Created: {formatDate(session.createdAt)}</p>
          <p>Expires: {formatDate(session.expiresAt)}</p>
          {session.revokedAt && <p>Ended: {formatDate(session.revokedAt)}</p>}
        </section>)}
        {sessions.length === 0 && <AdminNotice>ยังไม่มี session ให้แสดง</AdminNotice>}
      </AdminStack>
    </AdminCard>

    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={confirmCopy?.title ?? ''}
      description={confirmCopy?.description ?? ''}
      confirmLabel="ยืนยัน"
      tone={pendingAction?.kind === 'disable-2fa' || pendingAction?.kind === 'logout-all' || pendingAction?.kind === 'revoke-session' ? 'danger' : 'primary'}
      busy={pageBusy}
      onCancel={() => { if (!pageBusy) setPendingAction(null); }}
      onConfirm={() => void confirmPendingAction()}
    />
  </AdminPage>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isAdminMe(value: unknown): value is AdminMe {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.username === 'string'
    && (value.permissions === undefined || (Array.isArray(value.permissions) && value.permissions.every((item) => typeof item === 'string')));
}

function isSetupResponse(value: unknown): value is SetupResponse {
  return isRecord(value)
    && typeof value.secret === 'string'
    && value.secret.trim().length >= 8
    && typeof value.otpAuthUrl === 'string'
    && value.otpAuthUrl.startsWith('otpauth://');
}

function isSessionItem(value: unknown): value is SessionItem {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.createdAt === 'string'
    && typeof value.expiresAt === 'string'
    && typeof value.current === 'boolean'
    && typeof value.active === 'boolean';
}

function isProtectedAdmin(value: unknown): value is ProtectedAdmin {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.username === 'string'
    && typeof value.status === 'string'
    && typeof value.twoFactorEnabled === 'boolean'
    && Array.isArray(value.roles)
    && value.roles.every((item) => typeof item === 'string');
}

function isOwnerRecoveryStatus(value: unknown): value is OwnerRecoveryStatus {
  return isRecord(value)
    && typeof value.healthy === 'boolean'
    && Number.isFinite(Number(value.recoveryCodesRemaining))
    && Array.isArray(value.protectedAdmins)
    && value.protectedAdmins.every(isProtectedAdmin);
}

function isRecoveryCodeResponse(value: unknown): value is { recoveryCodes: string[] } {
  return isRecord(value)
    && Array.isArray(value.recoveryCodes)
    && value.recoveryCodes.length > 0
    && value.recoveryCodes.every((item) => typeof item === 'string' && item.trim().length >= 6);
}

function isValidSecurityCode(value: string) {
  return TOTP_PATTERN.test(value) || (value.length >= 8 && value.length <= 128 && !/\s/.test(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH');
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
const securityActionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const sessionBoxStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 16, padding: 12, display: 'grid', gap: 6, minWidth: 0, background: 'rgba(148,163,184,.045)' } as const;
const sessionTopStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))', gap: 10, alignItems: 'center', minWidth: 0 } as const;
const sessionToolbarStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: 10, marginBottom: 12 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const agentStyle = { overflowWrap: 'anywhere' as const, color: '#94a3b8' };
