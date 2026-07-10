'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { adminApiFetch } from '../../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, formatMoney } from '../../_components/admin-ui';

type MemberDetail = {
  user: { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; createdAt: string; updatedAt: string; lastLoginAt?: string | null; profile?: { displayName?: string | null } | null };
  wallet: { id: string; currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string } | null;
  topUps: MoneyItem[];
  withdrawals: MoneyItem[];
  ledgers: LedgerItem[];
  activity: ActivityItem[];
  generatedAt: string;
};

type MoneyItem = { id: string; amount: string; currency: string; status: string; method?: string | null; createdAt: string; reviewedAt?: string | null };
type LedgerItem = { id: string; type: string; direction: string; amount: string; balanceBefore: string; balanceAfter: string; referenceType?: string | null; referenceId?: string | null; createdAt: string; createdByAdmin?: { username?: string | null } | null };
type ActivityItem = { id: string; action: string; module: string; targetId?: string | null; createdAt: string; adminUser?: { username?: string | null } | null };
type RiskAlert = { id: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; status: string; title: string; createdAt: string };

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<MemberDetail | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    setLoading(true);
    const [memberRes, riskRes] = await Promise.all([
      adminApiFetch(`/admin/members/${id}`),
      adminApiFetch('/admin/risk-alerts?status=OPEN'),
    ]);
    const payload = await memberRes.json().catch(() => null);
    const riskPayload = await riskRes.json().catch(() => null);
    if (memberRes.ok) {
      setData(payload);
      setMessage('');
    } else {
      setMessage(payload?.message ?? 'โหลดข้อมูลสมาชิกไม่สำเร็จ');
    }
    if (riskRes.ok) setRiskAlerts((riskPayload.items ?? []).filter((item: any) => item.memberId === id));
    setLoading(false);
  }

  async function updateStatus(nextStatus: string) {
    const res = await adminApiFetch(`/admin/members/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, reason: 'quick action from member detail page' }) });
    const payload = await res.json().catch(() => null);
    if (!res.ok) setMessage(payload?.message ?? 'อัปเดตสถานะไม่สำเร็จ');
    else setMessage('อัปเดตสถานะแล้ว');
    await load();
  }

  return <AdminPage eyebrow="Members" title="Member Detail" description="ข้อมูลสมาชิก wallet รายการเงิน และ audit activity" actions={<><AdminLinkButton href="/members">Back</AdminLinkButton><AdminButton tone="secondary" onClick={load}>Reload</AdminButton></>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {loading && !data && <AdminEmpty>กำลังโหลดข้อมูลสมาชิก...</AdminEmpty>}
    {data && <>
      <AdminMetricGrid>
        <AdminMetric title="Status" value={data.user.status} helper={data.user.shortId} />
        <AdminMetric title="Available" value={formatMoney(data.wallet?.availableBalance ?? '0')} helper={data.wallet?.currency ?? 'THB'} />
        <AdminMetric title="Locked" value={formatMoney(data.wallet?.lockedBalance ?? '0')} helper={data.wallet?.status ?? 'No wallet'} />
        <AdminMetric title="Risk alerts" value={String(riskAlerts.length)} helper="OPEN alerts" />
      </AdminMetricGrid>

      <AdminGrid>
        <AdminCard title={data.user.username} description={`${data.user.profile?.displayName ?? 'No display name'} · ${data.user.shortId}`}>
          <AdminStack>
            <AdminRow><strong>Status</strong><AdminBadge tone={statusTone(data.user.status)}>{data.user.status}</AdminBadge></AdminRow>
            <AdminRow><strong>Phone</strong><span>{data.user.phone ?? '-'}</span></AdminRow>
            <AdminRow><strong>Email</strong><span>{data.user.email ?? '-'}</span></AdminRow>
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

      <AdminCard title="Status actions" description="ใช้เท่าที่จำเป็น เพราะปุ่มพวกนี้แตะชีวิต account จริง ไม่ใช่ของเล่น">
        <div style={actionStyle}>
          <AdminButton tone="success" disabled={data.user.status === 'ACTIVE'} onClick={() => updateStatus('ACTIVE')}>Active</AdminButton>
          <AdminButton tone="danger" disabled={data.user.status === 'SUSPENDED'} onClick={() => updateStatus('SUSPENDED')}>Suspend</AdminButton>
          <AdminButton tone="danger" disabled={data.user.status === 'LOCKED'} onClick={() => updateStatus('LOCKED')}>Lock</AdminButton>
        </div>
      </AdminCard>

      <AdminCard title="Risk alerts" description="OPEN alerts ที่เกี่ยวกับสมาชิกนี้" action={<AdminLinkButton href="/risk-alerts">Risk queue</AdminLinkButton>}>
        <AdminStack>{riskAlerts.map((item) => <AdminRow key={item.id}><div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminBadge tone={riskTone(item.severity)}>{item.severity}</AdminBadge><AdminBadge>{item.type}</AdminBadge></div><strong>{item.title}</strong><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><AdminLinkButton href={`/risk-alerts/${item.id}`}>Detail</AdminLinkButton></AdminRow>)}{riskAlerts.length === 0 && <AdminEmpty>ไม่มี OPEN risk alert ของสมาชิกนี้</AdminEmpty>}</AdminStack>
      </AdminCard>

      <AdminGrid>
        <MoneyCard title="Top-ups" items={data.topUps} />
        <MoneyCard title="Withdrawals" items={data.withdrawals} />
      </AdminGrid>

      <AdminCard title="Latest ledgers" description="รายการ ledger ล่าสุดของสมาชิก">
        <AdminStack>{data.ledgers.slice(0, 20).map((item) => <AdminRow key={item.id}><div><strong>{item.type} / {item.direction}</strong><p>{item.referenceType ?? '-'} / {item.referenceId?.slice(0, 8) ?? '-'}</p><p>{new Date(item.createdAt).toLocaleString('th-TH')}</p></div><div style={{ textAlign: 'right' }}><strong>{item.direction === 'CREDIT' ? '+' : '-'} {formatMoney(item.amount)}</strong><p>{formatMoney(item.balanceBefore)} → {formatMoney(item.balanceAfter)}</p><p>Admin: {item.createdByAdmin?.username ?? '-'}</p></div></AdminRow>)}{data.ledgers.length === 0 && <AdminEmpty>ยังไม่มี ledger</AdminEmpty>}</AdminStack>
      </AdminCard>

      <AdminCard title="Admin activity" description="Audit log ที่อ้างถึงสมาชิกนี้">
        <AdminStack>{data.activity.map((item) => <AdminRow key={item.id}><div><strong>{item.action}</strong><p>{item.module} · {item.adminUser?.username ?? '-'}</p></div><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></AdminRow>)}{data.activity.length === 0 && <AdminEmpty>ยังไม่มี activity</AdminEmpty>}</AdminStack>
      </AdminCard>
    </>}
  </AdminPage>;
}

function MoneyCard({ title, items }: { title: string; items: MoneyItem[] }) {
  return <AdminCard title={title} description={`${items.length} latest`}><AdminStack>{items.map((item) => <AdminRow key={item.id}><div><strong>{item.status}</strong><p>{item.method ?? '-'} · {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><span>{formatMoney(item.amount)} {item.currency}</span></AdminRow>)}{items.length === 0 && <AdminEmpty>ยังไม่มีรายการ</AdminEmpty>}</AdminStack></AdminCard>;
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

const actionStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
