'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, formatMoney } from '../../_components/admin-ui';

type MemberDetail = {
  user: { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; createdAt: string; updatedAt: string; lastLoginAt?: string | null; phoneVerifiedAt?: string | null; emailVerifiedAt?: string | null; profile?: { displayName?: string | null } | null };
  wallet: { id: string; currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string } | null;
  bankAccounts: BankAccount[];
  topUps: MoneyItem[];
  withdrawals: MoneyItem[];
  ledgers: LedgerItem[];
  activity: ActivityItem[];
  sessions: MemberSession[];
  loginHistory: LoginHistoryItem[];
  dataSources?: { kyc?: string | null; risk?: string | null; vip?: string | null; vipReason?: string | null };
  generatedAt: string;
};

type BankAccount = { id: string; bankName: string; accountName: string; accountNumberMasked?: string | null; status: string; createdAt: string; updatedAt: string };
type MoneyItem = { id: string; amount: string; currency: string; status: string; method?: string | null; accountNumberMasked?: string | null; createdAt: string; reviewedAt?: string | null };
type LedgerItem = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string; createdByAdmin?: { username?: string | null } | null };
type ActivityItem = { id: string; action: string; module: string; targetId?: string | null; createdAt: string; adminUser?: { username?: string | null } | null };
type MemberSession = { id: string; ipAddress?: string | null; userAgent?: string | null; deviceId?: string | null; expiresAt: string; revokedAt?: string | null; createdAt: string; updatedAt: string };
type LoginHistoryItem = { id: string; success: boolean; ipAddress?: string | null; userAgent?: string | null; reason?: string | null; createdAt: string };
type RiskAlert = { id: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; status: string; title: string; description?: string | null; createdAt: string; resolvedAt?: string | null };
type KycDocument = { id: string; documentType: string; status: string; originalName: string; reviewNote?: string | null; version: number; createdAt: string };
type KycSnapshot = { item: { id: string; memberId: string; status: string; riskLevel?: string | null; reviewNote?: string | null; version: number; submittedAt?: string | null; reviewedAt?: string | null; createdAt: string; updatedAt: string } | null; documents: KycDocument[] };

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<MemberDetail | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [kyc, setKyc] = useState<KycSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [restrictedMessage, setRestrictedMessage] = useState('');

  useEffect(() => { if (id) void load(); }, [id]);

  const canManageStatus = permissions.includes('*') || permissions.includes('users.suspend');
  const canViewRisk = permissions.includes('*') || permissions.includes('risk.view');

  async function load() {
    setLoading(true);
    setRestrictedMessage('');
    const [memberRes, meRes] = await Promise.all([
      adminApiFetch(`/admin/members/${id}`),
      adminApiFetch('/admin/auth/me'),
    ]);
    const [payload, mePayload] = await Promise.all([
      memberRes.json().catch(() => null),
      meRes.json().catch(() => null),
    ]);

    if (memberRes.ok) {
      setData(payload);
      setMessage('');
    } else {
      setData(null);
      setMessage(payload?.message ?? 'โหลดข้อมูลสมาชิกไม่สำเร็จ');
    }

    const effectivePermissions = meRes.ok && Array.isArray(mePayload?.permissions) ? mePayload.permissions as string[] : [];
    setPermissions(effectivePermissions);
    const riskAllowed = effectivePermissions.includes('*') || effectivePermissions.includes('risk.view');

    if (memberRes.ok && riskAllowed && id) {
      const [riskRes, kycRes] = await Promise.all([
        adminApiFetch(`/admin/risk-alerts?memberId=${encodeURIComponent(id)}&take=20`),
        adminApiFetch(`/admin/kyc/members/${encodeURIComponent(id)}`),
      ]);
      const [riskPayload, kycPayload] = await Promise.all([
        riskRes.json().catch(() => null),
        kycRes.json().catch(() => null),
      ]);
      setRiskAlerts(riskRes.ok && Array.isArray(riskPayload?.items) ? riskPayload.items : []);
      setKyc(kycRes.ok && kycPayload && typeof kycPayload === 'object' ? kycPayload as KycSnapshot : null);
      if (!riskRes.ok || !kycRes.ok) setRestrictedMessage('โหลด Risk/KYC บางส่วนไม่สำเร็จ แต่ข้อมูล Member หลักยังใช้งานได้');
    } else {
      setRiskAlerts([]);
      setKyc(null);
      if (memberRes.ok && !riskAllowed) setRestrictedMessage('Risk และ KYC ถูกซ่อนเพราะบัญชีนี้ไม่มีสิทธิ์ risk.view');
    }

    setLoading(false);
  }

  async function updateStatus(nextStatus: string) {
    if (!canManageStatus) {
      setMessage('บัญชี Admin นี้ไม่มีสิทธิ์ users.suspend');
      return;
    }
    const res = await adminApiFetch(`/admin/members/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, reason: 'quick action from member detail page' }) });
    const payload = await res.json().catch(() => null);
    if (!res.ok) setMessage(payload?.message ?? 'อัปเดตสถานะไม่สำเร็จ');
    else setMessage('อัปเดตสถานะแล้ว');
    await load();
  }

  const activeSessions = data?.sessions.filter((item) => !item.revokedAt && new Date(item.expiresAt).getTime() > Date.now()).length ?? 0;
  const openRiskAlerts = riskAlerts.filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING').length;

  return <AdminPage eyebrow="Members" title="Member Detail" description="ข้อมูลสมาชิก Wallet ธุรกรรม KYC Risk Session Login history และ Audit evidence จาก owner จริง" actions={<><AdminLinkButton href="/members">Back</AdminLinkButton><AdminButton tone="secondary" onClick={() => void load()}>Reload</AdminButton></>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    {restrictedMessage && <AdminNotice tone="warning">{restrictedMessage}</AdminNotice>}
    {loading && !data && <AdminEmpty>กำลังโหลดข้อมูลสมาชิก...</AdminEmpty>}
    {data && <>
      <AdminMetricGrid>
        <AdminMetric title="Status" value={data.user.status} helper={data.user.shortId} />
        <AdminMetric title="Available" value={formatMoney(data.wallet?.availableBalance ?? '0')} helper={data.wallet?.currency ?? 'THB'} />
        <AdminMetric title="Active sessions" value={String(activeSessions)} helper={`${data.sessions.length} recent`} />
        {canViewRisk && <AdminMetric title="Risk alerts" value={String(openRiskAlerts)} helper={`${riskAlerts.length} recent`} tone={openRiskAlerts ? 'warning' : 'success'} />}
      </AdminMetricGrid>

      <AdminGrid>
        <AdminCard title={data.user.username} description={`${data.user.profile?.displayName ?? 'No display name'} · ${data.user.shortId}`}>
          <AdminStack>
            <AdminRow><strong>Status</strong><AdminBadge tone={statusTone(data.user.status)}>{data.user.status}</AdminBadge></AdminRow>
            <AdminRow><strong>Phone</strong><span>{data.user.phone ?? '-'}</span></AdminRow>
            <AdminRow><strong>Phone verified</strong><span>{data.user.phoneVerifiedAt ? new Date(data.user.phoneVerifiedAt).toLocaleString('th-TH') : '-'}</span></AdminRow>
            <AdminRow><strong>Email</strong><span>{data.user.email ?? '-'}</span></AdminRow>
            <AdminRow><strong>Email verified</strong><span>{data.user.emailVerifiedAt ? new Date(data.user.emailVerifiedAt).toLocaleString('th-TH') : '-'}</span></AdminRow>
            <AdminRow><strong>Joined</strong><span>{new Date(data.user.createdAt).toLocaleString('th-TH')}</span></AdminRow>
            <AdminRow><strong>Last login</strong><span>{data.user.lastLoginAt ? new Date(data.user.lastLoginAt).toLocaleString('th-TH') : '-'}</span></AdminRow>
          </AdminStack>
        </AdminCard>

        <AdminCard title="Wallet" description={data.wallet ? `${data.wallet.currency} · ${data.wallet.status}` : 'No wallet'}>
          {data.wallet ? <AdminStack>
            <AdminRow><strong>Balance</strong><span>{formatMoney(data.wallet.balance)}</span></AdminRow>
            <AdminRow><strong>Locked</strong><span>{formatMoney(data.wallet.lockedBalance)}</span></AdminRow>
            <AdminRow><strong>Available</strong><span>{formatMoney(data.wallet.availableBalance)}</span></AdminRow>
            <AdminRow><strong>Updated</strong><span>{new Date(data.wallet.updatedAt).toLocaleString('th-TH')}</span></AdminRow>
          </AdminStack> : <AdminEmpty>ไม่มี wallet</AdminEmpty>}
        </AdminCard>
      </AdminGrid>

      <AdminGrid>
        <AdminCard title="KYC" description="Read-only snapshot จาก KYC owner กลาง" action={canViewRisk ? <AdminLinkButton href="/kyc-center">KYC Center</AdminLinkButton> : undefined}>
          {!canViewRisk ? <AdminNotice tone="warning">ต้องมี risk.view เพื่อดู KYC</AdminNotice> : !kyc?.item ? <AdminEmpty>สมาชิกยังไม่มี KYC case</AdminEmpty> : <AdminStack>
            <AdminRow><strong>Status</strong><AdminBadge tone={kycTone(kyc.item.status)}>{kyc.item.status}</AdminBadge></AdminRow>
            <AdminRow><strong>Risk level</strong><span>{kyc.item.riskLevel ?? '-'}</span></AdminRow>
            <AdminRow><strong>Documents</strong><span>{kyc.documents.length}</span></AdminRow>
            <AdminRow><strong>Version</strong><span>{kyc.item.version}</span></AdminRow>
            <AdminRow><strong>Submitted</strong><span>{kyc.item.submittedAt ? new Date(kyc.item.submittedAt).toLocaleString('th-TH') : '-'}</span></AdminRow>
            <AdminRow><strong>Reviewed</strong><span>{kyc.item.reviewedAt ? new Date(kyc.item.reviewedAt).toLocaleString('th-TH') : '-'}</span></AdminRow>
            {kyc.item.reviewNote && <AdminNotice>{kyc.item.reviewNote}</AdminNotice>}
          </AdminStack>}
        </AdminCard>
        <AdminCard title="VIP" description="สถานะ backend owner">
          {data.dataSources?.vip ? <AdminRow><strong>Source</strong><span>{data.dataSources.vip}</span></AdminRow> : <AdminNotice tone="warning">{data.dataSources?.vipReason ?? 'ยังไม่มี persistent VIP owner ใน Admin data model ห้ามสร้างระดับ VIP จากค่า UI fallback'}</AdminNotice>}
        </AdminCard>
      </AdminGrid>

      <AdminCard title="Status actions" description="API บังคับ users.suspend จริง UI นี้เพียงสะท้อน effective permission เพื่อไม่โชว์คำสั่งที่กดแล้วโดน 403">
        {!canManageStatus && <AdminNotice tone="warning">บัญชีนี้เป็น read-only สำหรับ Member status</AdminNotice>}
        <div style={actionStyle}>
          <AdminButton tone="success" disabled={!canManageStatus || data.user.status === 'ACTIVE'} onClick={() => updateStatus('ACTIVE')}>Active</AdminButton>
          <AdminButton tone="danger" disabled={!canManageStatus || data.user.status === 'SUSPENDED'} onClick={() => updateStatus('SUSPENDED')}>Suspend</AdminButton>
          <AdminButton tone="danger" disabled={!canManageStatus || data.user.status === 'LOCKED'} onClick={() => updateStatus('LOCKED')}>Lock</AdminButton>
        </div>
      </AdminCard>

      <AdminCard title="Bank accounts" description="เลขบัญชีถูก mask ใน read model ของ Member Detail">
        <AdminStack>{data.bankAccounts.map((item) => <AdminRow key={item.id}><div><strong>{item.bankName}</strong><p>{item.accountName} · {item.accountNumberMasked ?? '-'}</p></div><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'warning'}>{item.status}</AdminBadge></AdminRow>)}{data.bankAccounts.length === 0 && <AdminEmpty>ยังไม่มีบัญชีธนาคาร</AdminEmpty>}</AdminStack>
      </AdminCard>

      {canViewRisk && <AdminCard title="Risk alerts" description="Risk history โหลดผ่าน /admin/risk-alerts และยังคงบังคับ risk.view" action={<AdminLinkButton href={`/risk-alerts?memberId=${encodeURIComponent(data.user.id)}`}>Risk queue</AdminLinkButton>}>
        <AdminStack>{riskAlerts.map((item) => <AdminRow key={item.id}><div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminBadge tone={riskTone(item.severity)}>{item.severity}</AdminBadge><AdminBadge>{item.status}</AdminBadge><AdminBadge>{item.type}</AdminBadge></div><strong>{item.title}</strong><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><AdminLinkButton href={`/risk-alerts/${item.id}`}>Detail</AdminLinkButton></AdminRow>)}{riskAlerts.length === 0 && <AdminEmpty>ไม่มี Risk alert ของสมาชิกนี้</AdminEmpty>}</AdminStack>
      </AdminCard>}

      <AdminGrid>
        <MoneyCard title="Top-ups" items={data.topUps} />
        <MoneyCard title="Withdrawals" items={data.withdrawals} />
      </AdminGrid>

      <AdminCard title="Latest ledgers" description="รายการ ledger ล่าสุดของสมาชิก">
        <AdminStack>{data.ledgers.slice(0, 20).map((item) => <AdminRow key={item.id}><div><strong>{item.type} / {item.direction}</strong><p>{item.referenceType ?? '-'} / {item.referenceId?.slice(0, 8) ?? '-'}</p><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><strong>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</strong><p>{formatMoney(item.balanceBefore)} → {formatMoney(item.balanceAfter)}</p><p>Admin: {item.createdByAdmin?.username ?? '-'}</p></div></AdminRow>)}{data.ledgers.length === 0 && <AdminEmpty>ยังไม่มี ledger</AdminEmpty>}</AdminStack>
      </AdminCard>

      <AdminGrid>
        <AdminCard title="Member sessions" description="20 sessions ล่าสุด รวม revoked/expired state">
          <AdminStack>{data.sessions.map((item) => <AdminRow key={item.id}><div><strong>{item.revokedAt ? 'REVOKED' : new Date(item.expiresAt).getTime() <= Date.now() ? 'EXPIRED' : 'ACTIVE'}</strong><p>{item.ipAddress ?? '-'} · {item.deviceId ?? '-'}</p><p>{compactUserAgent(item.userAgent)}</p></div><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>)}{data.sessions.length === 0 && <AdminEmpty>ยังไม่มี session</AdminEmpty>}</AdminStack>
        </AdminCard>
        <AdminCard title="Login history" description="30 login attempts ล่าสุด">
          <AdminStack>{data.loginHistory.map((item) => <AdminRow key={item.id}><div><strong>{item.success ? 'SUCCESS' : 'FAILED'}</strong><p>{item.ipAddress ?? '-'} · {item.reason ?? '-'}</p><p>{compactUserAgent(item.userAgent)}</p></div><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>)}{data.loginHistory.length === 0 && <AdminEmpty>ยังไม่มี login history</AdminEmpty>}</AdminStack>
        </AdminCard>
      </AdminGrid>

      <AdminCard title="Admin activity" description="Audit log ที่อ้างถึงสมาชิกนี้">
        <AdminStack>{data.activity.map((item) => <AdminRow key={item.id}><div><strong>{item.action}</strong><p>{item.module} · {item.adminUser?.username ?? '-'}</p></div><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>)}{data.activity.length === 0 && <AdminEmpty>ยังไม่มี activity</AdminEmpty>}</AdminStack>
      </AdminCard>
    </>}
  </AdminPage>;
}

function MoneyCard({ title, items }: { title: string; items: MoneyItem[] }) {
  return <AdminCard title={title} description={`${items.length} latest`}><AdminStack>{items.map((item) => <AdminRow key={item.id}><div><strong>{item.status}</strong><p>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.accountNumberMasked ? <p>{item.accountNumberMasked}</p> : null}</div><span>{formatMoney(item.amount)} {item.currency}</span></AdminRow>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack></AdminCard>;
}

function compactUserAgent(value?: string | null) {
  const text = String(value ?? '').trim();
  if (!text) return '-';
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
}

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'SUSPENDED' || status === 'LOCKED') return 'danger';
  return 'neutral';
}

function riskTone(severity: RiskAlert['severity']) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'neutral';
}

function kycTone(status: string) {
  if (status === 'APPROVED') return 'success';
  if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
  if (status === 'SUBMITTED' || status === 'REVIEWING') return 'warning';
  return 'neutral';
}

const actionStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };