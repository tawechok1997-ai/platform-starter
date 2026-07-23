'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminGrid, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSkeleton, AdminStack } from '../_components/admin-ui';

type QueueItem = { status?: string };
type Bucket = { items: QueueItem[]; total: number; error?: string };
type KycBucket = Bucket & { pending: number; duplicateGroups: number };
type DashboardData = { promotionClaims: Bucket; bonusLedgers: Bucket; affiliates: Bucket; commissions: Bucket; support: Bucket; kyc: KycBucket };

const emptyBucket = (): Bucket => ({ items: [], total: 0 });
const emptyKycBucket = (): KycBucket => ({ items: [], total: 0, pending: 0, duplicateGroups: 0 });

export default function GrowthCenterPage() {
  const [data, setData] = useState<DashboardData>({ promotionClaims: emptyBucket(), bonusLedgers: emptyBucket(), affiliates: emptyBucket(), commissions: emptyBucket(), support: emptyBucket(), kyc: emptyKycBucket() });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('กำลังโหลดศูนย์ Growth...');

  useEffect(() => { void load(); }, []);

  const metrics = useMemo(() => ({
    promotionPending: countBy(data.promotionClaims.items, 'PENDING', 'PENDING_REVIEW', 'REVIEWING'),
    bonusActive: countBy(data.bonusLedgers.items, 'ACTIVE', 'REVIEWING', 'TURNOVER_COMPLETED', 'RELEASE_READY'),
    affiliatePending: countBy(data.affiliates.items, 'PENDING', 'REVIEWING'),
    commissionPending: countBy(data.commissions.items, 'PENDING', 'REVIEWING'),
    supportOpen: countBy(data.support.items, 'OPEN', 'PENDING'),
    kycPending: data.kyc.pending,
  }), [data]);

  const failedSources = useMemo(() => Object.entries(data).filter(([, bucket]) => bucket.error).map(([name]) => sourceLabel(name)), [data]);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลดศูนย์ Growth...');
    const [promotionClaims, bonusLedgers, affiliates, commissions, support, kyc] = await Promise.all([
      safeFetch('/admin/promotion-claims'),
      safeFetch('/admin/bonus-ledgers'),
      safeFetch('/admin/affiliates'),
      safeFetch('/admin/commission-ledgers'),
      safeFetch('/admin/support-tickets'),
      safeFetchKyc('/admin/member-bank-accounts/kyc-summary'),
    ]);
    const next = { promotionClaims, bonusLedgers, affiliates, commissions, support, kyc };
    setData(next);
    const failed = Object.entries(next).filter(([, bucket]) => bucket.error).map(([name]) => sourceLabel(name));
    setMessage(failed.length ? `โหลดข้อมูลบางส่วนไม่สำเร็จ: ${failed.join(', ')}` : '');
    setLoading(false);
  }

  return <AdminPage eyebrow="Growth" title="ศูนย์งาน Growth" description="รวมคิว Promotion, Bonus, Affiliate, Commission, KYC และ Support แบบอ่านอย่างเดียว" actions={<AdminButton onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={failedSources.length ? 'warning' : 'neutral'}>{message}</AdminNotice>}
    {loading && totalLoaded(data) === 0 ? <AdminSkeleton lines={6} /> : <>
      <AdminMetricGrid><AdminMetric tone={metrics.promotionPending > 0 ? 'warning' : 'success'} title="คำขอโปรโมชัน" value={String(metrics.promotionPending)} helper="รอตรวจ" /><AdminMetric tone={metrics.bonusActive > 0 ? 'warning' : 'success'} title="โบนัสใช้งานอยู่" value={String(metrics.bonusActive)} helper="ยังไม่ปิดวงจร" /><AdminMetric tone={metrics.affiliatePending > 0 ? 'warning' : 'success'} title="ตัวแทนรอตรวจ" value={String(metrics.affiliatePending)} /><AdminMetric tone={metrics.commissionPending > 0 ? 'warning' : 'success'} title="คอมมิชชันรอตรวจ" value={String(metrics.commissionPending)} /></AdminMetricGrid>
      <AdminMetricGrid><AdminMetric tone={metrics.supportOpen > 0 ? 'danger' : 'success'} title="Support เปิดอยู่" value={String(metrics.supportOpen)} /><AdminMetric tone={metrics.kycPending > 0 ? 'warning' : 'success'} title="KYC รอตรวจ" value={String(metrics.kycPending)} /><AdminMetric title="จ่ายอัตโนมัติ" value="ปิด" helper="ไม่อนุมัติหรือจ่ายจากหน้านี้" tone="danger" /><AdminMetric title="Wallet credit" value="มี Guard" helper="โบนัสต้องผ่านเงื่อนไขก่อน" tone="warning" /></AdminMetricGrid>
      <AdminGrid><OpsCard title="Promotion" href="/promotion-claims" tone="warning" rows={[["คำขอรอตรวจ", metrics.promotionPending], ["ทั้งหมด", data.promotionClaims.total]]} error={data.promotionClaims.error} /><OpsCard title="Bonus Ledger" href="/bonus-ledgers" tone="warning" rows={[["โบนัสใช้งานอยู่", metrics.bonusActive], ["ทั้งหมด", data.bonusLedgers.total]]} error={data.bonusLedgers.error} /><OpsCard title="Affiliate" href="/affiliate-center" tone="warning" rows={[["ตัวแทนรอตรวจ", metrics.affiliatePending], ["ทั้งหมด", data.affiliates.total]]} error={data.affiliates.error} /><OpsCard title="Commission" href="/commission-ledgers" tone="danger" rows={[["คอมมิชชันรอตรวจ", metrics.commissionPending], ["ทั้งหมด", data.commissions.total]]} error={data.commissions.error} /><OpsCard title="Support" href="/support-center" tone="danger" rows={[["เปิดอยู่", metrics.supportOpen], ["ทั้งหมด", data.support.total]]} error={data.support.error} /><OpsCard title="KYC" href="/kyc-center" tone="warning" rows={[["รอตรวจบัญชี", metrics.kycPending], ["เลขบัญชีซ้ำ", data.kyc.duplicateGroups]]} error={data.kyc.error} /></AdminGrid>
    </>}
    <AdminNotice>หน้านี้เป็น read-only ไม่อนุมัติ ไม่จ่ายเงิน และไม่แก้กระเป๋าสมาชิกโดยตรง</AdminNotice>
  </AdminPage>;
}

function OpsCard({ title, href, tone, rows, error }: { title: string; href: string; tone: 'warning' | 'success' | 'danger' | 'neutral'; rows: Array<[string, number]>; error?: string | undefined }) { return <AdminCard title={title} tone={error ? 'danger' : tone}><AdminStack>{error && <AdminNotice tone="danger">โหลดข้อมูลไม่สำเร็จ</AdminNotice>}{rows.map(([label, value]) => <AdminRow key={label}><strong>{label}</strong><AdminBadge tone={value > 0 ? tone : 'success'}>{String(value)}</AdminBadge></AdminRow>)}<AdminLinkButton href={href} tone="primary">เปิดคิว</AdminLinkButton></AdminStack></AdminCard>; }
async function safeFetch(path: string): Promise<Bucket> { try { const res = await adminApiFetch(path); const data = await res.json().catch(() => null); if (!res.ok) return { ...emptyBucket(), error: safeError(data?.message) }; const items = Array.isArray(data?.items) ? data.items : []; return { items, total: Number(data?.total ?? items.length) }; } catch { return { ...emptyBucket(), error: 'เชื่อมต่อไม่สำเร็จ' }; } }
async function safeFetchKyc(path: string): Promise<KycBucket> { try { const res = await adminApiFetch(path); const data = await res.json().catch(() => null); if (!res.ok) return { ...emptyKycBucket(), error: safeError(data?.message) }; return { items: [], total: Number(data?.total ?? 0), pending: Number(data?.pending ?? 0), duplicateGroups: Number(data?.duplicateGroups ?? 0) }; } catch { return { ...emptyKycBucket(), error: 'เชื่อมต่อไม่สำเร็จ' }; } }
function countBy(items: QueueItem[], ...statuses: string[]) { const allowed = new Set(statuses); return items.filter((item) => allowed.has(String(item.status ?? '').toUpperCase())).length; }
function sourceLabel(name: string) { const labels: Record<string, string> = { promotionClaims: 'Promotion', bonusLedgers: 'Bonus', affiliates: 'Affiliate', commissions: 'Commission', support: 'Support', kyc: 'KYC' }; return labels[name] ?? name; }
function safeError(value: unknown) { const text = String(value ?? '').trim(); return text && text.length <= 160 ? text : 'โหลดข้อมูลไม่สำเร็จ'; }
function totalLoaded(data: DashboardData) { return data.promotionClaims.total + data.bonusLedgers.total + data.affiliates.total + data.commissions.total + data.support.total + data.kyc.total; }
