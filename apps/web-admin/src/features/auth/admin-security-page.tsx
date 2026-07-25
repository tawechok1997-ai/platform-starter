'use client';

import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { useAdminLocale, type AdminLocale } from '../../../app/(admin)/admin-locale';
import { AdminDataTable, type AdminDataColumn } from '../admin-modernization/data-table';
import { AdminWorkspaceTabs } from '../admin-modernization/workspace-tabs';
import styles from './admin-security-workspace.module.css';

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
type SecurityTab = 'overview' | 'sessions' | 'two-factor' | 'recovery';

type SecurityCopy = {
  eyebrow: string;
  title: string;
  description: string;
  reload: string;
  loading: string;
  partialLoad: string;
  loadFailed: string;
  overview: string;
  sessions: string;
  twoFactor: string;
  ownerRecovery: string;
  admin: string;
  permissions: string;
  activeSessions: string;
  totalSessions: string;
  twoFactorStatus: string;
  enabled: string;
  notEnabled: string;
  recoveryReady: string;
  actionRequired: string;
  protectedAdmins: string;
  recoveryCodesRemaining: string;
  recoveryHealthyHelp: string;
  recoveryWarningHelp: string;
  account: string;
  roles: string;
  status: string;
  sessionOverview: string;
  sessionHelp: string;
  logoutOthers: string;
  logoutAll: string;
  current: string;
  active: string;
  ended: string;
  device: string;
  ip: string;
  userAgent: string;
  created: string;
  expires: string;
  endedAt: string;
  revoke: string;
  noSessions: string;
  noSessionsHelp: string;
  previousPage: string;
  nextPage: string;
  page: string;
  rowsPerPage: string;
  setupTitle: string;
  setupDescription: string;
  setupReady: string;
  setupReadyHelp: string;
  generateSecret: string;
  secretTemporary: string;
  scanAuthenticator: string;
  manualSecret: string;
  otpUrl: string;
  verificationCode: string;
  verificationPlaceholder: string;
  enableTwoFactor: string;
  clearScreen: string;
  copy: string;
  recoveryCodes: string;
  recoveryCodesDescription: string;
  copyAll: string;
  deactivateTitle: string;
  deactivateDescription: string;
  securityCodePlaceholder: string;
  deactivate: string;
  regenerateTitle: string;
  regenerateDescription: string;
  regenerate: string;
  confirm: string;
  cancel: string;
  setupFailed: string;
  enableFailed: string;
  disableFailed: string;
  regenerateFailed: string;
  sessionFailed: string;
  invalidTotp: string;
  invalidSecurityCode: string;
  connection2faFailed: string;
  connectionSessionFailed: string;
  generatedSecret: string;
  enabledSuccess: string;
  disabledSuccess: string;
  regeneratedSuccess: string;
  revokedSuccess: string;
  logoutOthersSuccess: (count: number) => string;
  copied: (label: string) => string;
  copyFailed: (label: string) => string;
  clearedSetup: string;
  clearedRecovery: string;
  sensitiveCleared: string;
  recoveryCleared: string;
  confirmDisableTitle: string;
  confirmDisableDescription: string;
  confirmRegenerateTitle: string;
  confirmRegenerateDescription: string;
  confirmLogoutOthersTitle: string;
  confirmLogoutOthersDescription: string;
  confirmLogoutAllTitle: string;
  confirmLogoutAllDescription: string;
  confirmRevokeTitle: string;
  confirmRevokeCurrent: string;
  confirmRevokeOther: string;
};

const COPY: Record<AdminLocale, SecurityCopy> = {
  th: {
    eyebrow: 'สิทธิ์และความปลอดภัย',
    title: 'ความปลอดภัยผู้ดูแล',
    description: 'จัดการ 2FA, recovery และ session โดยแสดงเฉพาะข้อมูลที่จำเป็น',
    reload: 'รีเฟรช', loading: 'กำลังโหลดข้อมูลความปลอดภัย...',
    partialLoad: 'โหลดข้อมูลหลักแล้ว แต่ข้อมูลบางส่วนไม่ครบ กรุณารีเฟรช',
    loadFailed: 'โหลดข้อมูลความปลอดภัยไม่สำเร็จ กรุณาลองใหม่',
    overview: 'ภาพรวม', sessions: 'เซสชัน', twoFactor: '2FA', ownerRecovery: 'การกู้คืน Owner',
    admin: 'ผู้ดูแล', permissions: 'สิทธิ์', activeSessions: 'เซสชันที่ใช้งาน', totalSessions: 'เซสชันทั้งหมด',
    twoFactorStatus: 'สถานะ 2FA', enabled: 'เปิดใช้งาน', notEnabled: 'ยังไม่เปิด',
    recoveryReady: 'พร้อมกู้คืน', actionRequired: 'ต้องดำเนินการ', protectedAdmins: 'Protected admins',
    recoveryCodesRemaining: 'Recovery codes คงเหลือ',
    recoveryHealthyHelp: 'มีผู้ดูแลที่ป้องกันด้วย 2FA และมี recovery code พร้อมใช้งาน',
    recoveryWarningHelp: 'ควรตรวจ 2FA และสร้าง recovery codes ก่อนเกิดเหตุ lockout',
    account: 'บัญชี', roles: 'บทบาท', status: 'สถานะ',
    sessionOverview: 'เซสชันผู้ดูแล', sessionHelp: 'รายการล่าสุด แบ่งหน้าและเปิด action เฉพาะเซสชันที่ยังใช้งาน',
    logoutOthers: 'ออกจากระบบอุปกรณ์อื่น', logoutAll: 'ปิดทุกเซสชัน', current: 'เครื่องนี้', active: 'ใช้งาน', ended: 'สิ้นสุด',
    device: 'อุปกรณ์', ip: 'IP', userAgent: 'เบราว์เซอร์และอุปกรณ์', created: 'เริ่มใช้งาน', expires: 'หมดอายุ', endedAt: 'สิ้นสุดเมื่อ', revoke: 'เพิกถอน',
    noSessions: 'ไม่พบเซสชัน', noSessionsHelp: 'เมื่อมีการเข้าสู่ระบบ รายการจะปรากฏที่นี่',
    previousPage: 'หน้าก่อนหน้า', nextPage: 'หน้าถัดไป', page: 'หน้า', rowsPerPage: 'รายการต่อหน้า',
    setupTitle: 'ตั้งค่า 2FA', setupDescription: 'ใช้แอป Authenticator และรหัส TOTP 6 หลัก',
    setupReady: 'พร้อมตั้งค่า TOTP', setupReadyHelp: 'สร้าง secret แล้วสแกน QR หรือคัดลอก OTP Auth URL',
    generateSecret: 'สร้าง 2FA secret', secretTemporary: 'Secret และ QR จะแสดงชั่วคราว 5 นาที',
    scanAuthenticator: 'สแกนด้วยแอป Authenticator', manualSecret: 'Manual secret', otpUrl: 'OTP Auth URL',
    verificationCode: 'รหัสยืนยัน', verificationPlaceholder: 'รหัส 6 หลักจาก Authenticator',
    enableTwoFactor: 'เปิด 2FA', clearScreen: 'ล้างจากหน้าจอ', copy: 'คัดลอก',
    recoveryCodes: 'Recovery codes', recoveryCodesDescription: 'บันทึกทันที แต่ละรหัสใช้ได้ครั้งเดียวและจะแสดงชั่วคราว 5 นาที', copyAll: 'คัดลอกทั้งหมด',
    deactivateTitle: 'ปิด 2FA', deactivateDescription: 'ต้องยืนยันด้วย TOTP หรือ recovery code ปัจจุบัน', securityCodePlaceholder: 'TOTP หรือ recovery code ปัจจุบัน', deactivate: 'ปิด 2FA',
    regenerateTitle: 'สร้าง Recovery codes ใหม่', regenerateDescription: 'ชุดเดิมจะใช้ไม่ได้ทันทีหลังยืนยัน', regenerate: 'สร้างชุดใหม่',
    confirm: 'ยืนยัน', cancel: 'ยกเลิก',
    setupFailed: 'เริ่มตั้งค่า 2FA ไม่สำเร็จ', enableFailed: 'เปิดใช้งาน 2FA ไม่สำเร็จ', disableFailed: 'ปิด 2FA ไม่สำเร็จ', regenerateFailed: 'สร้าง recovery codes ไม่สำเร็จ', sessionFailed: 'ดำเนินการกับ session ไม่สำเร็จ',
    invalidTotp: 'กรุณาใส่รหัส TOTP 6 หลัก', invalidSecurityCode: 'กรุณาใส่ TOTP หรือ recovery code ที่ถูกต้อง', connection2faFailed: 'เชื่อมต่อระบบ 2FA ไม่สำเร็จ', connectionSessionFailed: 'เชื่อมต่อระบบ session ไม่สำเร็จ',
    generatedSecret: 'สร้าง 2FA secret แล้ว ข้อมูลนี้จะแสดงชั่วคราว 5 นาที', enabledSuccess: 'เปิดใช้งาน 2FA แล้ว Recovery codes จะแสดงชั่วคราว 5 นาที', disabledSuccess: 'ปิด 2FA แล้ว', regeneratedSuccess: 'สร้าง recovery codes ชุดใหม่แล้ว ข้อมูลจะแสดงชั่วคราว 5 นาที', revokedSuccess: 'ปิด session แล้ว',
    logoutOthersSuccess: (count) => `ออกจากระบบอุปกรณ์อื่นแล้ว ${count.toLocaleString('th-TH')} session`,
    copied: (label) => `คัดลอก${label}แล้ว กรุณาเก็บไว้ในที่ปลอดภัย`, copyFailed: (label) => `คัดลอก${label}ไม่สำเร็จ`,
    clearedSetup: 'ล้างข้อมูลตั้งค่า 2FA จากหน้าจอแล้ว', clearedRecovery: 'ล้าง Recovery codes จากหน้าจอแล้ว', sensitiveCleared: 'ข้อมูลตั้งค่า 2FA ถูกล้างจากหน้าจอแล้วเพื่อความปลอดภัย', recoveryCleared: 'Recovery codes ถูกล้างจากหน้าจอแล้วเพื่อความปลอดภัย',
    confirmDisableTitle: 'ยืนยันปิด 2FA', confirmDisableDescription: 'บัญชีนี้จะไม่บังคับรหัสยืนยันสองขั้นตอนจนกว่าจะเปิดใหม่',
    confirmRegenerateTitle: 'สร้าง Recovery codes ชุดใหม่', confirmRegenerateDescription: 'Recovery codes ชุดเก่าทั้งหมดจะใช้ไม่ได้ทันที',
    confirmLogoutOthersTitle: 'ออกจากระบบอุปกรณ์อื่น', confirmLogoutOthersDescription: 'Session ของอุปกรณ์อื่นทั้งหมดจะถูกปิด',
    confirmLogoutAllTitle: 'ปิด Session ทั้งหมด', confirmLogoutAllDescription: 'Session ทุกเครื่องรวมเครื่องนี้จะถูกปิด',
    confirmRevokeTitle: 'ปิด Session', confirmRevokeCurrent: 'Session ปัจจุบันจะถูกปิดและต้องเข้าสู่ระบบใหม่', confirmRevokeOther: 'Session ที่เลือกจะถูกเพิกถอน',
  },
  en: {
    eyebrow: 'Access & security',
    title: 'Admin security',
    description: 'Manage 2FA, recovery, and sessions with progressive disclosure',
    reload: 'Refresh', loading: 'Loading security data...',
    partialLoad: 'Core data loaded, but some security data is incomplete. Refresh to try again.',
    loadFailed: 'Unable to load security data. Please try again.',
    overview: 'Overview', sessions: 'Sessions', twoFactor: '2FA', ownerRecovery: 'Owner recovery',
    admin: 'Administrator', permissions: 'Permissions', activeSessions: 'Active sessions', totalSessions: 'Total sessions',
    twoFactorStatus: '2FA status', enabled: 'Enabled', notEnabled: 'Not enabled',
    recoveryReady: 'Recovery ready', actionRequired: 'Action required', protectedAdmins: 'Protected admins',
    recoveryCodesRemaining: 'Recovery codes remaining',
    recoveryHealthyHelp: 'A protected administrator has 2FA and recovery codes available.',
    recoveryWarningHelp: 'Review 2FA and regenerate recovery codes before a lockout occurs.',
    account: 'Account', roles: 'Roles', status: 'Status',
    sessionOverview: 'Administrator sessions', sessionHelp: 'Recent sessions with pagination and actions only for active sessions.',
    logoutOthers: 'Log out other devices', logoutAll: 'End all sessions', current: 'Current', active: 'Active', ended: 'Ended',
    device: 'Device', ip: 'IP', userAgent: 'Browser and device', created: 'Created', expires: 'Expires', endedAt: 'Ended at', revoke: 'Revoke',
    noSessions: 'No sessions found', noSessionsHelp: 'Sessions will appear here after an administrator signs in.',
    previousPage: 'Previous page', nextPage: 'Next page', page: 'Page', rowsPerPage: 'Rows per page',
    setupTitle: 'Set up 2FA', setupDescription: 'Use an authenticator app and a six-digit TOTP code.',
    setupReady: 'TOTP setup ready', setupReadyHelp: 'Generate a secret, then scan the QR code or copy the OTP Auth URL.',
    generateSecret: 'Generate 2FA secret', secretTemporary: 'The secret and QR code are displayed for five minutes.',
    scanAuthenticator: 'Scan with an authenticator app', manualSecret: 'Manual secret', otpUrl: 'OTP Auth URL',
    verificationCode: 'Verification code', verificationPlaceholder: 'Six-digit authenticator code',
    enableTwoFactor: 'Enable 2FA', clearScreen: 'Clear from screen', copy: 'Copy',
    recoveryCodes: 'Recovery codes', recoveryCodesDescription: 'Save these now. Each code is single-use and displayed for five minutes.', copyAll: 'Copy all',
    deactivateTitle: 'Disable 2FA', deactivateDescription: 'Confirm with the current TOTP or recovery code.', securityCodePlaceholder: 'Current TOTP or recovery code', deactivate: 'Disable 2FA',
    regenerateTitle: 'Regenerate recovery codes', regenerateDescription: 'The old set becomes invalid immediately after confirmation.', regenerate: 'Regenerate',
    confirm: 'Confirm', cancel: 'Cancel',
    setupFailed: 'Unable to start 2FA setup', enableFailed: 'Unable to enable 2FA', disableFailed: 'Unable to disable 2FA', regenerateFailed: 'Unable to regenerate recovery codes', sessionFailed: 'Unable to update the session',
    invalidTotp: 'Enter a valid six-digit TOTP code.', invalidSecurityCode: 'Enter a valid TOTP or recovery code.', connection2faFailed: 'Unable to connect to the 2FA service.', connectionSessionFailed: 'Unable to connect to the session service.',
    generatedSecret: '2FA secret generated. It will be displayed for five minutes.', enabledSuccess: '2FA enabled. Recovery codes will be displayed for five minutes.', disabledSuccess: '2FA disabled.', regeneratedSuccess: 'New recovery codes generated. They will be displayed for five minutes.', revokedSuccess: 'Session revoked.',
    logoutOthersSuccess: (count) => `${count.toLocaleString('en-US')} other sessions signed out.`,
    copied: (label) => `${label} copied. Store it securely.`, copyFailed: (label) => `Unable to copy ${label}.`,
    clearedSetup: '2FA setup data cleared from the screen.', clearedRecovery: 'Recovery codes cleared from the screen.', sensitiveCleared: '2FA setup data was cleared from the screen for security.', recoveryCleared: 'Recovery codes were cleared from the screen for security.',
    confirmDisableTitle: 'Disable 2FA', confirmDisableDescription: 'This account will no longer require a second factor until 2FA is enabled again.',
    confirmRegenerateTitle: 'Regenerate recovery codes', confirmRegenerateDescription: 'All existing recovery codes become invalid immediately.',
    confirmLogoutOthersTitle: 'Log out other devices', confirmLogoutOthersDescription: 'All sessions on other devices will be revoked.',
    confirmLogoutAllTitle: 'End all sessions', confirmLogoutAllDescription: 'Every session, including this one, will be revoked.',
    confirmRevokeTitle: 'Revoke session', confirmRevokeCurrent: 'The current session will end and you must sign in again.', confirmRevokeOther: 'The selected session will be revoked.',
  },
};

const SAFE_ERRORS: Record<string, Partial<Record<AdminLocale, string>>> = {
  UNAUTHORIZED: { th: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', en: 'Your session expired. Sign in again.' },
  FORBIDDEN: { th: 'บัญชีนี้ไม่มีสิทธิ์ดำเนินการ', en: 'This account does not have permission to perform the action.' },
  INVALID_2FA_CODE: { th: 'รหัสยืนยันไม่ถูกต้อง', en: 'The verification code is invalid.' },
  RATE_LIMITED: { th: 'ลองใหม่ภายหลัง ระบบจำกัดจำนวนครั้งชั่วคราว', en: 'Try again later. Requests are temporarily rate limited.' },
};
const SENSITIVE_DISPLAY_TTL_MS = 5 * 60_000;
const TOTP_PATTERN = /^\d{6}$/;

export default function AdminSecurityPage() {
  const [locale] = useAdminLocale();
  const copy = COPY[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const searchParams = useSearchParams();
  const activeTab = normalizeTab(searchParams.get('tab'));
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
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionPageSize, setSessionPageSize] = useState(10);
  const pageBusy = loading || Boolean(busyKey);

  const loadMe = useCallback(async () => {
    const response = await adminApiFetch('/admin/auth/me');
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok || !isAdminMe(payload)) throw new Error('me');
    setMe(payload);
  }, []);

  const loadSessions = useCallback(async () => {
    const response = await adminApiFetch('/admin/auth/sessions');
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok || !isRecord(payload) || !Array.isArray(payload.items)) throw new Error('sessions');
    setSessions(payload.items.filter(isSessionItem));
  }, []);

  const loadOwnerRecoveryStatus = useCallback(async () => {
    const response = await adminApiFetch('/admin/access/owner-recovery-status');
    const payload: unknown = await response.json().catch(() => null);
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
    setMessage(copy.loading);
    const status: LoadStatus = { me: false, sessions: false, recovery: false };

    try { await loadMe(); status.me = true; } catch { if (loadRequestRef.current === requestId) setMe(null); }
    try { await loadSessions(); status.sessions = true; } catch { if (loadRequestRef.current === requestId) setSessions([]); }
    try { await loadOwnerRecoveryStatus(); status.recovery = true; } catch { if (loadRequestRef.current === requestId) setOwnerRecovery(null); }

    if (loadRequestRef.current === requestId) {
      const loaded = Object.values(status).filter(Boolean).length;
      setMessage(loaded === 3 ? '' : loaded > 0 ? copy.partialLoad : copy.loadFailed);
      setLoading(false);
    }
  }, [copy.loadFailed, copy.loading, copy.partialLoad, loadMe, loadOwnerRecoveryStatus, loadSessions]);

  useEffect(() => { void loadAll(); }, [loadAll]);
  useEffect(() => { setSessionPage(1); }, [sessionPageSize, sessions.length]);

  useEffect(() => {
    if (!setup?.otpAuthUrl) { setQrDataUrl(''); return; }
    let cancelled = false;
    QRCode.toDataURL(setup.otpAuthUrl, { margin: 1, width: 220 })
      .then((value) => { if (!cancelled) setQrDataUrl(value); })
      .catch(() => { if (!cancelled) setMessage(locale === 'th' ? 'สร้าง QR code ไม่สำเร็จ กรุณาใช้ Manual secret แทน' : 'Unable to generate the QR code. Use the manual secret instead.'); });
    return () => { cancelled = true; };
  }, [locale, setup?.otpAuthUrl]);

  useEffect(() => {
    if (!setup) return;
    const timer = window.setTimeout(() => {
      setSetup(null); setQrDataUrl(''); setCode(''); setMessage(copy.sensitiveCleared);
    }, SENSITIVE_DISPLAY_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [copy.sensitiveCleared, setup]);

  useEffect(() => {
    if (!recoveryCodes.length) return;
    const timer = window.setTimeout(() => { setRecoveryCodes([]); setMessage(copy.recoveryCleared); }, SENSITIVE_DISPLAY_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [copy.recoveryCleared, recoveryCodes]);

  function safeError(data: unknown, fallback: string) {
    if (!isRecord(data)) return fallback;
    const codeValue = typeof data.code === 'string' ? data.code : typeof data.errorCode === 'string' ? data.errorCode : '';
    return SAFE_ERRORS[codeValue]?.[locale] ?? fallback;
  }

  async function startSetup() {
    if (pageBusy) return;
    setBusyKey('setup'); setMessage(copy.loading); setRecoveryCodes([]);
    try {
      const response = await adminApiFetch('/admin/auth/2fa/setup', { method: 'POST' });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isSetupResponse(payload)) { setMessage(safeError(payload, copy.setupFailed)); return; }
      setSetup(payload); setMessage(copy.generatedSecret);
    } catch { setMessage(copy.connection2faFailed); } finally { setBusyKey(''); }
  }

  async function enable2FA() {
    const normalizedCode = code.trim();
    if (!TOTP_PATTERN.test(normalizedCode)) { setMessage(copy.invalidTotp); return; }
    if (pageBusy || !setup) return;
    setBusyKey('enable-2fa'); setMessage(copy.loading);
    try {
      const response = await adminApiFetch('/admin/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code: normalizedCode }) });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRecoveryCodeResponse(payload)) { setMessage(safeError(payload, copy.enableFailed)); return; }
      setRecoveryCodes(payload.recoveryCodes); setCode(''); setSetup(null); setQrDataUrl(''); setMessage(copy.enabledSuccess); await loadMe();
    } catch { setMessage(copy.connection2faFailed); } finally { setBusyKey(''); }
  }

  async function deactivate2FA() {
    const normalizedCode = deactivateCode.trim();
    if (!isValidSecurityCode(normalizedCode)) { setMessage(copy.invalidSecurityCode); setPendingAction(null); return; }
    setBusyKey('disable-2fa'); setMessage(copy.loading);
    try {
      const response = await adminApiFetch('/admin/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code: normalizedCode }) });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) { setMessage(safeError(payload, copy.disableFailed)); return; }
      setDeactivateCode(''); setRegenerateCode(''); setRecoveryCodes([]); setSetup(null); setQrDataUrl(''); setMessage(copy.disabledSuccess); await loadMe();
    } catch { setMessage(copy.connection2faFailed); } finally { setBusyKey(''); setPendingAction(null); }
  }

  async function regenerateRecoveryCodes() {
    const normalizedCode = regenerateCode.trim();
    if (!isValidSecurityCode(normalizedCode)) { setMessage(copy.invalidSecurityCode); setPendingAction(null); return; }
    setBusyKey('regenerate-codes'); setMessage(copy.loading);
    try {
      const response = await adminApiFetch('/admin/auth/2fa/recovery-codes/regenerate', { method: 'POST', body: JSON.stringify({ code: normalizedCode }) });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRecoveryCodeResponse(payload)) { setMessage(safeError(payload, copy.regenerateFailed)); return; }
      setRecoveryCodes(payload.recoveryCodes); setRegenerateCode(''); setMessage(copy.regeneratedSuccess);
    } catch { setMessage(copy.connection2faFailed); } finally { setBusyKey(''); setPendingAction(null); }
  }

  async function revokeSession(session: SessionItem) {
    setBusyKey(`revoke:${session.id}`); setMessage(copy.loading);
    try {
      const response = await adminApiFetch(`/admin/auth/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) { setMessage(safeError(payload, copy.sessionFailed)); return; }
      if (isRecord(payload) && payload.current === true) { clearAdminSession(); window.location.replace('/login'); return; }
      setMessage(copy.revokedSuccess); await loadSessions();
    } catch { setMessage(copy.connectionSessionFailed); } finally { setBusyKey(''); setPendingAction(null); }
  }

  async function logoutOtherDevices() {
    setBusyKey('logout-others'); setMessage(copy.loading);
    try {
      const response = await adminApiFetch('/admin/auth/sessions/logout-others', { method: 'POST' });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) { setMessage(safeError(payload, copy.sessionFailed)); return; }
      const revokedValue = isRecord(payload) ? Number(payload.revoked ?? 0) : 0;
      const revoked = Number.isFinite(revokedValue) ? Math.max(0, revokedValue) : 0;
      setMessage(copy.logoutOthersSuccess(revoked)); await loadSessions();
    } catch { setMessage(copy.connectionSessionFailed); } finally { setBusyKey(''); setPendingAction(null); }
  }

  async function endEverySession() {
    setBusyKey('logout-all'); setMessage(copy.loading);
    try {
      const response = await adminApiFetch('/admin/auth/sessions/logout-all', { method: 'POST' });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) { setMessage(safeError(payload, copy.sessionFailed)); return; }
      clearAdminSession(); window.location.replace('/login');
    } catch { setMessage(copy.connectionSessionFailed); } finally { setBusyKey(''); setPendingAction(null); }
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

  async function copyValue(value: string, label: string) {
    if (!value || pageBusy) return;
    try { await navigator.clipboard.writeText(value); setMessage(copy.copied(label)); }
    catch { setMessage(copy.copyFailed(label)); }
  }

  function clearSetup() { if (!pageBusy) { setSetup(null); setQrDataUrl(''); setCode(''); setMessage(copy.clearedSetup); } }
  function clearRecoveryCodes() { if (!pageBusy) { setRecoveryCodes([]); setMessage(copy.clearedRecovery); } }

  const activeCount = sessions.filter((item) => item.active).length;
  const otherActiveCount = sessions.filter((item) => item.active && !item.current).length;
  const visibleSessions = useMemo(() => sessions.slice((sessionPage - 1) * sessionPageSize, sessionPage * sessionPageSize), [sessionPage, sessionPageSize, sessions]);
  const sessionColumns = useMemo<readonly AdminDataColumn<SessionItem>[]>(() => [
    {
      id: 'status', header: copy.status, mobileLabel: copy.status, priority: 'primary', width: '14%',
      cell: (session) => <span className={styles.badges}><AdminBadge tone={session.active ? 'success' : 'neutral'}>{session.active ? copy.active : copy.ended}</AdminBadge>{session.current && <AdminBadge tone="warning">{copy.current}</AdminBadge>}</span>,
    },
    { id: 'device', header: copy.device, mobileLabel: copy.device, priority: 'primary', width: '22%', cell: (session) => <span className={styles.device}><strong>{session.deviceId || '-'}</strong><small>{session.userAgent || '-'}</small></span> },
    { id: 'ip', header: copy.ip, mobileLabel: copy.ip, priority: 'secondary', width: '13%', cell: (session) => session.ipAddress || '-' },
    { id: 'created', header: copy.created, mobileLabel: copy.created, priority: 'secondary', width: '16%', cell: (session) => formatDate(session.createdAt, dateLocale) },
    { id: 'expires', header: copy.expires, mobileLabel: copy.expires, priority: 'tertiary', width: '16%', cell: (session) => formatDate(session.expiresAt, dateLocale) },
    {
      id: 'action', header: '', mobileLabel: copy.revoke, priority: 'secondary', align: 'end', width: '1%',
      cell: (session) => session.active ? <AdminButton size="compact" tone="danger" disabled={pageBusy} onClick={() => setPendingAction({ kind: 'revoke-session', session })}>{copy.revoke}</AdminButton> : <span>{session.revokedAt ? formatDate(session.revokedAt, dateLocale) : '-'}</span>,
    },
  ], [copy, dateLocale, pageBusy]);

  const confirmCopy = getConfirmCopy(pendingAction, copy);
  const tabs = [
    { id: 'overview', label: copy.overview, value: 'overview' },
    { id: 'sessions', label: copy.sessions, value: 'sessions', count: activeCount },
    { id: 'two-factor', label: copy.twoFactor, value: 'two-factor' },
    { id: 'recovery', label: copy.ownerRecovery, value: 'recovery' },
  ];

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton disabled={pageBusy} onClick={() => void loadAll()}>{loading ? copy.loading : copy.reload}</AdminButton>}>
    <AdminWorkspaceTabs ariaLabel={copy.title} activeId={activeTab} tabs={tabs} />
    {message && <AdminNotice tone={isErrorMessage(message, locale) ? 'danger' : 'neutral'}>{message}</AdminNotice>}

    {activeTab === 'overview' && <SecurityOverview me={me} sessions={sessions} ownerRecovery={ownerRecovery} copy={copy} locale={dateLocale} />}
    {activeTab === 'sessions' && <AdminCard title={copy.sessionOverview} description={copy.sessionHelp} actions={<span className={styles.actions}><AdminButton size="compact" disabled={pageBusy || otherActiveCount === 0} onClick={() => setPendingAction({ kind: 'logout-others' })}>{copy.logoutOthers}</AdminButton><AdminButton size="compact" disabled={pageBusy || activeCount === 0} tone="danger" onClick={() => setPendingAction({ kind: 'logout-all' })}>{copy.logoutAll}</AdminButton></span>}>
      <AdminDataTable
        ariaLabel={copy.sessionOverview}
        columns={sessionColumns}
        rows={visibleSessions}
        rowKey={(session) => session.id}
        loading={loading}
        emptyTitle={copy.noSessions}
        emptyDescription={copy.noSessionsHelp}
        page={sessionPage}
        pageSize={sessionPageSize}
        totalItems={sessions.length}
        pageSizeOptions={[10, 20, 50]}
        onPageChange={setSessionPage}
        onPageSizeChange={setSessionPageSize}
        labels={{ loading: copy.loading, empty: copy.noSessions, previousPage: copy.previousPage, nextPage: copy.nextPage, page: (value) => `${copy.page} ${value.toLocaleString(dateLocale)}`, rowsPerPage: copy.rowsPerPage, range: (from, to, total) => locale === 'th' ? `${from.toLocaleString(dateLocale)}–${to.toLocaleString(dateLocale)} จาก ${total.toLocaleString(dateLocale)}` : `${from.toLocaleString(dateLocale)}–${to.toLocaleString(dateLocale)} of ${total.toLocaleString(dateLocale)}` }}
      />
    </AdminCard>}
    {activeTab === 'two-factor' && <TwoFactorPanel
      copy={copy} setup={setup} qrDataUrl={qrDataUrl} code={code} deactivateCode={deactivateCode} regenerateCode={regenerateCode}
      recoveryCodes={recoveryCodes} pageBusy={pageBusy} me={me}
      onCode={setCode} onDeactivateCode={setDeactivateCode} onRegenerateCode={setRegenerateCode}
      onStart={() => void startSetup()} onEnable={() => void enable2FA()} onClearSetup={clearSetup}
      onCopy={(value, label) => void copyValue(value, label)} onClearRecovery={clearRecoveryCodes}
      onDisable={() => setPendingAction({ kind: 'disable-2fa' })} onRegenerate={() => setPendingAction({ kind: 'regenerate-codes' })}
    />}
    {activeTab === 'recovery' && <OwnerRecoveryPanel ownerRecovery={ownerRecovery} copy={copy} locale={dateLocale} />}

    <AdminConfirmDialog
      open={Boolean(pendingAction)} title={confirmCopy.title} description={confirmCopy.description}
      confirmLabel={copy.confirm} cancelLabel={copy.cancel}
      tone={pendingAction?.kind === 'disable-2fa' || pendingAction?.kind === 'logout-all' || pendingAction?.kind === 'revoke-session' ? 'danger' : 'primary'}
      busy={pageBusy} onCancel={() => { if (!pageBusy) setPendingAction(null); }} onConfirm={() => void confirmPendingAction()}
    />
  </AdminPage>;
}

function SecurityOverview({ me, sessions, ownerRecovery, copy, locale }: { me: AdminMe | null; sessions: SessionItem[]; ownerRecovery: OwnerRecoveryStatus | null; copy: SecurityCopy; locale: string }) {
  const activeCount = sessions.filter((item) => item.active).length;
  return <div className={styles.overview}>
    <AdminMetricGrid>
      <AdminMetric title={copy.admin} value={me?.username ?? '-'} helper={me?.id ?? ''} />
      <AdminMetric title={copy.permissions} value={(me?.permissions?.length ?? 0).toLocaleString(locale)} />
      <AdminMetric title={copy.activeSessions} value={activeCount.toLocaleString(locale)} helper={`${sessions.length.toLocaleString(locale)} ${copy.totalSessions}`} tone={activeCount > 3 ? 'warning' : 'neutral'} />
      <AdminMetric title={copy.ownerRecovery} value={ownerRecovery?.healthy ? copy.recoveryReady : copy.actionRequired} tone={ownerRecovery?.healthy ? 'success' : 'warning'} />
    </AdminMetricGrid>
    <AdminCard title={copy.ownerRecovery} description={ownerRecovery?.healthy ? copy.recoveryHealthyHelp : copy.recoveryWarningHelp}>
      <div className={styles.readiness}>
        <AdminBadge tone={ownerRecovery?.healthy ? 'success' : 'warning'}>{ownerRecovery?.healthy ? copy.recoveryReady : copy.actionRequired}</AdminBadge>
        <dl><div><dt>{copy.protectedAdmins}</dt><dd>{(ownerRecovery?.protectedAdmins.length ?? 0).toLocaleString(locale)}</dd></div><div><dt>{copy.recoveryCodesRemaining}</dt><dd>{(ownerRecovery?.recoveryCodesRemaining ?? 0).toLocaleString(locale)}</dd></div></dl>
      </div>
    </AdminCard>
  </div>;
}

function OwnerRecoveryPanel({ ownerRecovery, copy, locale }: { ownerRecovery: OwnerRecoveryStatus | null; copy: SecurityCopy; locale: string }) {
  if (!ownerRecovery) return <AdminNotice>{copy.recoveryWarningHelp}</AdminNotice>;
  return <AdminCard title={copy.ownerRecovery} description={ownerRecovery.healthy ? copy.recoveryHealthyHelp : copy.recoveryWarningHelp}>
    <div className={styles.recoverySummary}><AdminBadge tone={ownerRecovery.healthy ? 'success' : 'warning'}>{ownerRecovery.healthy ? copy.recoveryReady : copy.actionRequired}</AdminBadge><span>{copy.recoveryCodesRemaining}: <strong>{ownerRecovery.recoveryCodesRemaining.toLocaleString(locale)}</strong></span></div>
    <div className={styles.protectedList}>{ownerRecovery.protectedAdmins.map((admin) => <article key={admin.id} className={styles.protectedAdmin}><div><strong>{admin.username}</strong><small>{admin.email || admin.id}</small><span>{admin.roles.join(', ') || '-'}</span></div><div><AdminBadge>{admin.status}</AdminBadge><AdminBadge tone={admin.twoFactorEnabled ? 'success' : 'warning'}>{admin.twoFactorEnabled ? '2FA ON' : '2FA REQUIRED'}</AdminBadge></div></article>)}</div>
  </AdminCard>;
}

function TwoFactorPanel(props: {
  copy: SecurityCopy; setup: SetupResponse | null; qrDataUrl: string; code: string; deactivateCode: string; regenerateCode: string; recoveryCodes: string[]; pageBusy: boolean; me: AdminMe | null;
  onCode: (value: string) => void; onDeactivateCode: (value: string) => void; onRegenerateCode: (value: string) => void;
  onStart: () => void; onEnable: () => void; onClearSetup: () => void; onCopy: (value: string, label: string) => void; onClearRecovery: () => void; onDisable: () => void; onRegenerate: () => void;
}) {
  const { copy, setup, qrDataUrl, code, deactivateCode, regenerateCode, recoveryCodes, pageBusy } = props;
  return <div className={styles.twoFactorGrid}>
    <AdminCard title={copy.setupTitle} description={copy.setupDescription}>
      <AdminStack>
        <div className={styles.info}><AdminBadge tone="success">TOTP</AdminBadge><p>{copy.setupReadyHelp}</p></div>
        {!setup && <AdminButton disabled={pageBusy} onClick={props.onStart}>{copy.generateSecret}</AdminButton>}
        {setup && <section className={styles.setupBox}>
          <AdminNotice tone="warning">{copy.secretTemporary}</AdminNotice>
          {qrDataUrl && <div className={styles.qr}><img src={qrDataUrl} alt="2FA QR code" /><span>{copy.scanAuthenticator}</span></div>}
          <SecretField label={copy.manualSecret} value={setup.secret} copyLabel={copy.copy} disabled={pageBusy} onCopy={() => props.onCopy(setup.secret, copy.manualSecret)} />
          <SecretField label={copy.otpUrl} value={setup.otpAuthUrl} copyLabel={copy.copy} disabled={pageBusy} onCopy={() => props.onCopy(setup.otpAuthUrl, copy.otpUrl)} />
          <label className={styles.field}><span>{copy.verificationCode}</span><input value={code} maxLength={6} onChange={(event) => props.onCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder={copy.verificationPlaceholder} /></label>
          <div className={styles.actions}><AdminButton disabled={pageBusy || !TOTP_PATTERN.test(code)} onClick={props.onEnable}>{copy.enableTwoFactor}</AdminButton><AdminButton tone="secondary" disabled={pageBusy} onClick={props.onClearSetup}>{copy.clearScreen}</AdminButton></div>
        </section>}
      </AdminStack>
    </AdminCard>

    {recoveryCodes.length > 0 && <AdminCard title={copy.recoveryCodes} description={copy.recoveryCodesDescription}>
      <div className={styles.codes}>{recoveryCodes.map((item) => <code key={item}>{item}</code>)}</div>
      <div className={styles.actions}><AdminButton disabled={pageBusy} onClick={() => props.onCopy(recoveryCodes.join('\n'), copy.recoveryCodes)}>{copy.copyAll}</AdminButton><AdminButton tone="secondary" disabled={pageBusy} onClick={props.onClearRecovery}>{copy.clearScreen}</AdminButton></div>
    </AdminCard>}

    <AdminCard title={copy.deactivateTitle} description={copy.deactivateDescription}>
      <div className={styles.inlineForm}><input value={deactivateCode} maxLength={128} onChange={(event) => props.onDeactivateCode(event.target.value)} placeholder={copy.securityCodePlaceholder} /><AdminButton disabled={pageBusy || !isValidSecurityCode(deactivateCode.trim())} tone="danger" onClick={props.onDisable}>{copy.deactivate}</AdminButton></div>
    </AdminCard>

    <AdminCard title={copy.regenerateTitle} description={copy.regenerateDescription}>
      <div className={styles.inlineForm}><input value={regenerateCode} maxLength={128} onChange={(event) => props.onRegenerateCode(event.target.value)} placeholder={copy.securityCodePlaceholder} /><AdminButton disabled={pageBusy || !isValidSecurityCode(regenerateCode.trim())} tone="secondary" onClick={props.onRegenerate}>{copy.regenerate}</AdminButton></div>
    </AdminCard>
  </div>;
}

function SecretField({ label, value, copyLabel, disabled, onCopy }: { label: string; value: string; copyLabel: string; disabled: boolean; onCopy: () => void }) {
  return <label className={styles.field}><span>{label}</span><div className={styles.copyRow}><input value={value} readOnly /><AdminButton tone="secondary" disabled={disabled} onClick={onCopy}>{copyLabel}</AdminButton></div></label>;
}

function getConfirmCopy(action: PendingAction, copy: SecurityCopy) {
  if (!action) return { title: '', description: '' };
  if (action.kind === 'disable-2fa') return { title: copy.confirmDisableTitle, description: copy.confirmDisableDescription };
  if (action.kind === 'regenerate-codes') return { title: copy.confirmRegenerateTitle, description: copy.confirmRegenerateDescription };
  if (action.kind === 'logout-others') return { title: copy.confirmLogoutOthersTitle, description: copy.confirmLogoutOthersDescription };
  if (action.kind === 'logout-all') return { title: copy.confirmLogoutAllTitle, description: copy.confirmLogoutAllDescription };
  return { title: copy.confirmRevokeTitle, description: action.session.current ? copy.confirmRevokeCurrent : copy.confirmRevokeOther };
}

function normalizeTab(value: string | null): SecurityTab {
  return value === 'sessions' || value === 'two-factor' || value === 'recovery' ? value : 'overview';
}

function isErrorMessage(message: string, locale: AdminLocale) {
  const patterns = locale === 'th' ? ['ไม่สำเร็จ', 'ไม่ถูกต้อง', 'ไม่ครบ', 'หมดอายุ'] : ['unable', 'invalid', 'incomplete', 'expired'];
  const normalized = message.toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern));
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isAdminMe(value: unknown): value is AdminMe { return isRecord(value) && typeof value.id === 'string' && typeof value.username === 'string' && (value.permissions === undefined || (Array.isArray(value.permissions) && value.permissions.every((item) => typeof item === 'string'))); }
function isSetupResponse(value: unknown): value is SetupResponse { return isRecord(value) && typeof value.secret === 'string' && value.secret.trim().length >= 8 && typeof value.otpAuthUrl === 'string' && value.otpAuthUrl.startsWith('otpauth://'); }
function isSessionItem(value: unknown): value is SessionItem { return isRecord(value) && typeof value.id === 'string' && typeof value.createdAt === 'string' && typeof value.expiresAt === 'string' && typeof value.current === 'boolean' && typeof value.active === 'boolean'; }
function isProtectedAdmin(value: unknown): value is ProtectedAdmin { return isRecord(value) && typeof value.id === 'string' && typeof value.username === 'string' && typeof value.status === 'string' && typeof value.twoFactorEnabled === 'boolean' && Array.isArray(value.roles) && value.roles.every((item) => typeof item === 'string'); }
function isOwnerRecoveryStatus(value: unknown): value is OwnerRecoveryStatus { return isRecord(value) && typeof value.healthy === 'boolean' && Number.isFinite(Number(value.recoveryCodesRemaining)) && Array.isArray(value.protectedAdmins) && value.protectedAdmins.every(isProtectedAdmin); }
function isRecoveryCodeResponse(value: unknown): value is { recoveryCodes: string[] } { return isRecord(value) && Array.isArray(value.recoveryCodes) && value.recoveryCodes.length > 0 && value.recoveryCodes.every((item) => typeof item === 'string' && item.trim().length >= 6); }
function isValidSecurityCode(value: string) { return TOTP_PATTERN.test(value) || (value.length >= 8 && value.length <= 128 && !/\s/.test(value)); }
function formatDate(value: string | null | undefined, locale: string) { if (!value) return '-'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString(locale); }
