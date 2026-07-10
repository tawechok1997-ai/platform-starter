'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack } from '../_components/admin-ui';

type Bucket = { items?: any[]; total?: number };
type DashboardData = { promotionClaims: Bucket; bonusLedgers: Bucket; affiliates: Bucket; commissions: Bucket; support: Bucket; kyc: Bucket };

export default function GrowthCenterPage() {
  const [data, setData] = useState<DashboardData>({ promotionClaims: {}, bonusLedgers: {}, affiliates: {}, commissions: {}, support: {}, kyc: {} });
  const [message, setMessage] = useState('กำลังโหลด growth ops...');
  useEffect(() => { load(); }, []);
  const metrics = useMemo(() => ({
    promotionPending: countBy(data.promotionClaims.items, 'status', 'PENDING'),
    bonusActive: countBy(data.bonusLedgers.items, 'status', 'ACTIVE'),
    affiliatePending: countBy(data.affiliates.items, 'status', 'PENDING'),
    commissionPending: countBy(data.commissions.items, 'status', 'PENDING'),
    supportOpen: countBy(data.support.items, 'status', 'OPEN'),
    kycPending: Number((data.kyc as any)?.pending ?? 0),
  }), [data]);
  async function load() {
    setMessage('กำลังโหลด growth ops...');
    const [promotionClaims, bonusLedgers, affiliates, commissions, support, kyc] = await Promise.all([safeFetch('/admin/promotion-claims'), safeFetch('/admin/bonus-ledgers'), safeFetch('/admin/affiliates'), safeFetch('/admin/commission-ledgers'), safeFetch('/admin/support-tickets'), safeFetch('/admin/member-bank-accounts/kyc-summary')]);
    setData({ promotionClaims, bonusLedgers, affiliates, commissions, support, kyc });
    setMessage('');
  }
  return <AdminPage eyebrow="Product" title="ศูนย์ฟีเจอร์สินค้า" description="Growth Ops Dashboard รวม Promotion, Bonus, Affiliate, Commission, KYC และ Support แบบ read-only เพื่อดูคิวงานรวมอย่างมีสติ" actions={<button onClick={load} style={buttonStyle}>รีเฟรช</button>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone={metrics.promotionPending > 0 ? 'warning' : 'success'} title="Promotion claims" value={String(metrics.promotionPending)} helper="รอตรวจ" /><AdminMetric tone={metrics.bonusActive > 0 ? 'warning' : 'success'} title="Bonus active" value={String(metrics.bonusActive)} helper="ยังติดเทิร์น" /><AdminMetric tone={metrics.affiliatePending > 0 ? 'warning' : 'success'} title="Agents pending" value={String(metrics.affiliatePending)} /><AdminMetric tone={metrics.commissionPending > 0 ? 'warning' : 'success'} title="Commission pending" value={String(metrics.commissionPending)} /></AdminMetricGrid>
    <AdminMetricGrid><AdminMetric tone={metrics.supportOpen > 0 ? 'danger' : 'success'} title="Support open" value={String(metrics.supportOpen)} /><AdminMetric tone={metrics.kycPending > 0 ? 'warning' : 'success'} title="KYC pending" value={String(metrics.kycPending)} /><AdminMetric title="Payout" value="Off" helper="ยังไม่ auto payout" tone="danger" /><AdminMetric title="Wallet credit" value="Guarded" helper="โบนัสยัง block wallet credit" tone="warning" /></AdminMetricGrid>
    <AdminGrid><OpsCard title="Promotion" href="/promotion-claims" tone="warning" rows={[['คำขอรอตรวจ', metrics.promotionPending], ['ทั้งหมด', data.promotionClaims.items?.length ?? 0]]} /><OpsCard title="Bonus Ledger" href="/bonus-ledgers" tone="warning" rows={[['โบนัส active', metrics.bonusActive], ['ทั้งหมด', data.bonusLedgers.items?.length ?? 0]]} /><OpsCard title="Affiliate" href="/affiliate-center" tone="warning" rows={[['ตัวแทนรอตรวจ', metrics.affiliatePending], ['ทั้งหมด', data.affiliates.items?.length ?? 0]]} /><OpsCard title="Commission" href="/commission-ledgers" tone="danger" rows={[['commission รอตรวจ', metrics.commissionPending], ['ทั้งหมด', data.commissions.items?.length ?? 0]]} /><OpsCard title="Support" href="/support-center" tone="danger" rows={[['เปิดอยู่', metrics.supportOpen], ['ทั้งหมด', data.support.items?.length ?? 0]]} /><OpsCard title="KYC" href="/kyc-center" tone="warning" rows={[['รอตรวจบัญชี', metrics.kycPending], ['เลขบัญชีซ้ำ', Number((data.kyc as any)?.duplicateGroups ?? 0)]]} /></AdminGrid>
    <AdminNotice>Dashboard นี้ไม่อนุมัติ ไม่จ่ายเงิน และไม่แตะ wallet โดยตรง ดีมาก ระบบการเงินไม่ควรมีปุ่ม “ทำทุกอย่างให้ฉัน” เหมือนของเล่นเด็ก</AdminNotice>
  </AdminPage>;
}
function OpsCard({ title, href, tone, rows }: { title: string; href: string; tone: 'warning' | 'success' | 'danger' | 'neutral'; rows: Array<[string, number]> }) { return <AdminCard title={title} tone={tone}><AdminStack>{rows.map(([label, value]) => <AdminRow key={label}><strong>{label}</strong><AdminBadge tone={value > 0 ? tone : 'success'}>{String(value)}</AdminBadge></AdminRow>)}<AdminLinkButton href={href} tone="primary">เปิด</AdminLinkButton></AdminStack></AdminCard>; }
async function safeFetch(path: string): Promise<any> { try { const res = await adminApiFetch(path); const data = await res.json().catch(() => ({})); return res.ok ? data : {}; } catch { return {}; } }
function countBy(items: any[] | undefined, key: string, value: string) { return (items ?? []).filter((item) => item?.[key] === value).length; }
const buttonStyle = { minHeight: 40, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: 'rgba(255,255,255,.08)', color: '#f8fafc', padding: '0 12px', fontWeight: 850, cursor: 'pointer' } as const;
