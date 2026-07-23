'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSkeleton, AdminStack } from '../_components/admin-ui';

type CampaignLifecycle = 'draft' | 'published' | 'archived';
type Campaign = { id: string; title: string; description?: string; enabled: boolean; lifecycle?: CampaignLifecycle; imageUrl?: string; iconUrl?: string; badgeText?: string; startsAt?: string; endsAt?: string; bonusType?: string; bonusValue?: number; turnoverMultiplier?: number; priority?: number };
type Claim = { id: string; status: string; createdAt: string; promotionTitle?: string | null; user?: { username?: string | null } | null };

type CampaignReadiness = {
  lifecycle: CampaignLifecycle;
  visibleToMember: boolean;
  checks: Array<{ label: string; passed: boolean }>;
  readyCount: number;
};

export default function PromotionOperationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { void load(); }, []);

  const campaignRows = useMemo(() => campaigns
    .map((campaign) => ({ campaign, readiness: getCampaignReadiness(campaign) }))
    .sort((a, b) => Number(b.campaign.priority ?? 0) - Number(a.campaign.priority ?? 0)), [campaigns]);

  const prioritizedClaims = useMemo(() => [...claims].sort((a, b) => claimPriority(b) - claimPriority(a)), [claims]);

  const stats = useMemo(() => ({
    published: campaignRows.filter((item) => item.readiness.lifecycle === 'published').length,
    memberVisible: campaignRows.filter((item) => item.readiness.visibleToMember).length,
    ready: campaignRows.filter((item) => item.readiness.readyCount === item.readiness.checks.length).length,
    pendingClaims: claims.filter((item) => ['PENDING', 'PENDING_REVIEW'].includes(String(item.status).toUpperCase())).length,
  }), [campaignRows, claims]);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [settingsRes, claimsRes] = await Promise.all([
        adminApiFetch('/admin/settings/features'),
        adminApiFetch('/admin/promotion-claims?page=1&take=8'),
      ]);
      const [settingsData, claimsData] = await Promise.all([
        settingsRes.json().catch(() => null),
        claimsRes.json().catch(() => null),
      ]);
      if (!settingsRes.ok) throw new Error(settingsData?.message ?? 'โหลดข้อมูลโปรโมชันไม่สำเร็จ');
      const rawCampaigns = settingsData?.settings?.promotion_campaigns;
      setCampaigns(Array.isArray(rawCampaigns) ? rawCampaigns : []);
      setClaims(claimsRes.ok && Array.isArray(claimsData?.items) ? claimsData.items : []);
    } catch (error) {
      setCampaigns([]);
      setClaims([]);
      setMessage(error instanceof Error ? error.message : 'โหลดข้อมูลโปรโมชันไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  return <AdminPage eyebrow="Growth" title="Promotion Operations" description="ตรวจ readiness การแสดงผลบน Member และคิวคำขอจากหน้าจอเดียว" actions={<><AdminLinkButton href="/promotion-center">แก้ไขโปรโมชัน</AdminLinkButton><AdminButton onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton></>}>
    <section className="admin-promotion-operations" aria-busy={loading}>
      {message && <AdminNotice tone="danger">{message}</AdminNotice>}
      <AdminMetricGrid>
        <AdminMetric title="เผยแพร่" value={String(stats.published)} helper={`${campaigns.length} รายการทั้งหมด`} tone={stats.published ? 'success' : 'warning'} />
        <AdminMetric title="Member มองเห็น" value={String(stats.memberVisible)} helper="Published และ Enabled" tone={stats.memberVisible ? 'success' : 'warning'} />
        <AdminMetric title="พร้อมครบ" value={String(stats.ready)} helper="ผ่าน readiness checklist" tone={stats.ready === campaigns.length && campaigns.length ? 'success' : 'warning'} />
        <AdminMetric title="เคลมรอตรวจ" value={String(stats.pendingClaims)} helper="เรียงคิวเร่งด่วนก่อน" tone={stats.pendingClaims ? 'warning' : 'success'} />
      </AdminMetricGrid>

      {loading && campaigns.length === 0 ? <AdminSkeleton lines={6} /> : <div className="admin-promotion-operations__grid">
        <AdminCard title="Campaign readiness" description="เรียงตาม priority และยืนยัน boundary ก่อนแสดงบน Member">
          <AdminStack>{campaignRows.map(({ campaign, readiness }) => <article className="admin-promotion-operations__campaign" key={campaign.id}>
            <div className="admin-promotion-operations__identity">{campaign.imageUrl || campaign.iconUrl ? <img src={campaign.imageUrl || campaign.iconUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span>{campaign.title.slice(0, 2).toUpperCase()}</span>}<div><strong>{campaign.title}</strong><small>{campaign.badgeText || campaign.id} · priority {campaign.priority ?? 0}</small></div></div>
            <div className="admin-promotion-operations__badges"><AdminBadge tone={readiness.lifecycle === 'published' ? 'success' : readiness.lifecycle === 'archived' ? 'neutral' : 'warning'}>{lifecycleLabel(readiness.lifecycle)}</AdminBadge><AdminBadge tone={readiness.visibleToMember ? 'success' : 'neutral'}>{readiness.visibleToMember ? 'Member เห็น' : 'Member ไม่เห็น'}</AdminBadge><AdminBadge tone={readiness.readyCount === readiness.checks.length ? 'success' : 'warning'}>{readiness.readyCount}/{readiness.checks.length} พร้อม</AdminBadge></div>
            <div className="admin-promotion-operations__badges">{readiness.checks.map((check) => <AdminBadge key={check.label} tone={check.passed ? 'success' : 'warning'}>{check.passed ? '✓' : '!'} {check.label}</AdminBadge>)}</div>
          </article>)}{campaigns.length === 0 && <AdminEmpty>ยังไม่มีแคมเปญโปรโมชัน</AdminEmpty>}</AdminStack>
        </AdminCard>

        <AdminCard title="คำขอรับโปรล่าสุด" description="เรียง Pending และรายการค้างนานก่อน">
          <AdminStack>{prioritizedClaims.map((item) => <article className="admin-promotion-operations__claim" key={item.id}><div><strong>{item.promotionTitle ?? 'Promotion claim'}</strong><small>{item.user?.username ?? 'ไม่พบชื่อสมาชิก'} · {new Date(item.createdAt).toLocaleString('th-TH')}</small></div><AdminBadge tone={['APPROVED', 'COMPLETED'].includes(String(item.status).toUpperCase()) ? 'success' : ['REJECTED', 'CANCELLED'].includes(String(item.status).toUpperCase()) ? 'danger' : 'warning'}>{item.status}</AdminBadge></article>)}{claims.length === 0 && <AdminEmpty>ไม่มีคำขอรับโปรล่าสุด</AdminEmpty>}</AdminStack>
          <div className="admin-promotion-operations__actions"><AdminLinkButton href="/promotion-claims">เปิดคิวตรวจเคลม</AdminLinkButton><AdminLinkButton href="/bonus-ledgers">ดูรายการโบนัส</AdminLinkButton></div>
        </AdminCard>
      </div>}
    </section>
  </AdminPage>;
}

function normalizeLifecycle(campaign: Campaign): CampaignLifecycle {
  if (campaign.lifecycle === 'archived') return 'archived';
  if (campaign.lifecycle === 'published' || campaign.enabled === true) return 'published';
  return 'draft';
}

function getCampaignReadiness(campaign: Campaign): CampaignReadiness {
  const lifecycle = normalizeLifecycle(campaign);
  const visibleToMember = lifecycle === 'published' && campaign.enabled !== false;
  const checks = [
    { label: 'ชื่อและรายละเอียด', passed: Boolean(campaign.title.trim() && campaign.description?.trim()) },
    { label: 'โบนัสถูกต้อง', passed: Number(campaign.bonusValue ?? 0) >= 0 },
    { label: 'เทิร์นมากกว่า 0', passed: Number(campaign.turnoverMultiplier ?? 0) > 0 },
    { label: 'สื่อพร้อม', passed: Boolean(campaign.imageUrl || campaign.iconUrl) },
    { label: 'ช่วงเวลาถูกต้อง', passed: !campaign.startsAt || !campaign.endsAt || campaign.startsAt <= campaign.endsAt },
  ];
  return { lifecycle, visibleToMember, checks, readyCount: checks.filter((check) => check.passed).length };
}

function claimPriority(claim: Claim) {
  const status = String(claim.status).toUpperCase();
  const pendingWeight = ['PENDING', 'PENDING_REVIEW'].includes(status) ? 1_000_000_000_000 : 0;
  const age = Math.max(0, Date.now() - new Date(claim.createdAt).getTime());
  return pendingWeight + age;
}

function lifecycleLabel(lifecycle: CampaignLifecycle) {
  return lifecycle === 'published' ? 'เผยแพร่' : lifecycle === 'archived' ? 'เก็บถาวร' : 'ฉบับร่าง';
}
