'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSkeleton, AdminStack } from '../_components/admin-ui';

type Campaign = { id: string; title: string; enabled: boolean; imageUrl?: string; iconUrl?: string; badgeText?: string; startsAt?: string; endsAt?: string; bonusType?: string; bonusValue?: number; turnoverMultiplier?: number; priority?: number };
type Claim = { id: string; status: string; createdAt: string; promotionTitle?: string | null; user?: { username?: string | null } | null };

export default function PromotionOperationsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => ({
    enabled: campaigns.filter((item) => item.enabled).length,
    scheduled: campaigns.filter((item) => item.startsAt || item.endsAt).length,
    mediaReady: campaigns.filter((item) => item.imageUrl || item.iconUrl).length,
    pendingClaims: claims.filter((item) => ['PENDING', 'PENDING_REVIEW'].includes(String(item.status).toUpperCase())).length,
  }), [campaigns, claims]);

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

  return <AdminPage eyebrow="Growth" title="Promotion Operations" description="ตรวจสถานะโปรโมชัน สื่อ โบนัส และคำขอรับสิทธิ์จากหน้าจอเดียว" actions={<><AdminLinkButton href="/promotion-center">แก้ไขโปรโมชัน</AdminLinkButton><AdminButton onClick={() => void load()} disabled={loading}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton></>}>
    <section className="admin-promotion-operations" aria-busy={loading}>
      {message && <AdminNotice tone="danger">{message}</AdminNotice>}
      <AdminMetricGrid>
        <AdminMetric title="โปรที่เปิด" value={String(stats.enabled)} helper={`${campaigns.length} รายการทั้งหมด`} tone={stats.enabled ? 'success' : 'warning'} />
        <AdminMetric title="ตั้งช่วงเวลา" value={String(stats.scheduled)} helper="มีวันเริ่มหรือสิ้นสุด" />
        <AdminMetric title="สื่อพร้อม" value={String(stats.mediaReady)} helper="มีรูปหรือไอคอน" tone={stats.mediaReady === campaigns.length && campaigns.length ? 'success' : 'warning'} />
        <AdminMetric title="เคลมรอตรวจ" value={String(stats.pendingClaims)} helper="จากรายการล่าสุด" tone={stats.pendingClaims ? 'warning' : 'success'} />
      </AdminMetricGrid>

      {loading && campaigns.length === 0 ? <AdminSkeleton lines={6} /> : <div className="admin-promotion-operations__grid">
        <AdminCard title="สถานะแคมเปญ" description="เรียงตาม priority และพร้อมแสดงบนหน้า Member">
          <AdminStack>{[...campaigns].sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0)).map((item) => <article className="admin-promotion-operations__campaign" key={item.id}>
            <div className="admin-promotion-operations__identity">{item.imageUrl || item.iconUrl ? <img src={item.imageUrl || item.iconUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span>{item.title.slice(0, 2).toUpperCase()}</span>}<div><strong>{item.title}</strong><small>{item.badgeText || item.id}</small></div></div>
            <div className="admin-promotion-operations__badges"><AdminBadge tone={item.enabled ? 'success' : 'neutral'}>{item.enabled ? 'เปิด' : 'ปิด'}</AdminBadge><AdminBadge>{item.bonusType === 'percent' ? `${item.bonusValue ?? 0}%` : `฿${Number(item.bonusValue ?? 0).toLocaleString('th-TH')}`}</AdminBadge><AdminBadge>เทิร์น x{item.turnoverMultiplier ?? 0}</AdminBadge></div>
          </article>)}{campaigns.length === 0 && <AdminEmpty>ยังไม่มีแคมเปญโปรโมชัน</AdminEmpty>}</AdminStack>
        </AdminCard>

        <AdminCard title="คำขอรับโปรล่าสุด" description="ดูสถานะล่าสุดก่อนเข้าสู่คิวตรวจ">
          <AdminStack>{claims.map((item) => <article className="admin-promotion-operations__claim" key={item.id}><div><strong>{item.promotionTitle ?? 'Promotion claim'}</strong><small>{item.user?.username ?? 'ไม่พบชื่อสมาชิก'} · {new Date(item.createdAt).toLocaleString('th-TH')}</small></div><AdminBadge tone={['APPROVED', 'COMPLETED'].includes(String(item.status).toUpperCase()) ? 'success' : ['REJECTED', 'CANCELLED'].includes(String(item.status).toUpperCase()) ? 'danger' : 'warning'}>{item.status}</AdminBadge></article>)}{claims.length === 0 && <AdminEmpty>ไม่มีคำขอรับโปรล่าสุด</AdminEmpty>}</AdminStack>
          <div className="admin-promotion-operations__actions"><AdminLinkButton href="/promotion-claims">เปิดคิวตรวจเคลม</AdminLinkButton><AdminLinkButton href="/bonus-ledgers">ดูรายการโบนัส</AdminLinkButton></div>
        </AdminCard>
      </div>}
    </section>
  </AdminPage>;
}
