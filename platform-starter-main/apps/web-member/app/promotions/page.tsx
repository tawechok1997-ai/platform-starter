'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { loadPublicSiteSettings, promotionCampaignsSetting, PromotionCampaign, defaultSettings } from '../site-settings';
import { memberApiFetch } from '../member-api';

type Claim = { id: string; campaignId: string; topupId?: string | null; linkedTopup?: Topup | null; depositAmount?: number; status: string; rawStatus: string; adminNote?: string; createdAt: string };
type Topup = { id: string; amount: string | number; currency: string; status: string; method?: string | null; referenceCode?: string | null; createdAt: string; reviewedAt?: string | null };

export default function MemberPromotionsPage() {
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [selectedTopups, setSelectedTopups] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('กำลังโหลดโปรโมชัน...');
  const [busyId, setBusyId] = useState('');

  useEffect(() => { load(); }, []);

  const claimMap = useMemo(() => new Map(claims.map((item) => [item.campaignId, item])), [claims]);
  const approvedTopups = useMemo(() => topups.filter((item) => item.status === 'APPROVED'), [topups]);

  async function load() {
    try {
      const settings = await loadPublicSiteSettings();
      const active = promotionCampaignsSetting(settings).filter((item) => item.enabled && isInWindow(item)).sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0));
      setCampaigns(active);
      const [claimRes, topupRes] = await Promise.all([memberApiFetch('/member/promotion-claims'), memberApiFetch('/member/topups')]);
      const claimData = await claimRes.json().catch(() => null);
      const topupData = await topupRes.json().catch(() => null);
      if (claimRes.ok) setClaims(claimData.items ?? []);
      if (topupRes.ok) setTopups(topupData.items ?? []);
      setMessage('');
    } catch {
      setCampaigns(promotionCampaignsSetting(defaultSettings).filter((item) => item.enabled));
      setMessage('โหลดโปรโมชันไม่สำเร็จ');
    }
  }

  async function claimPromotion(item: PromotionCampaign) {
    const topupId = selectedTopups[item.id] ?? eligibleTopups(item, approvedTopups, claims)[0]?.id;
    if (!topupId) { setMessage('กรุณาเลือกรายการฝากที่อนุมัติแล้วและมียอดถึงขั้นต่ำก่อนรับโปร'); return; }
    setBusyId(item.id);
    const topup = approvedTopups.find((entry) => entry.id === topupId);
    const res = await memberApiFetch('/member/promotion-claims', { method: 'POST', body: JSON.stringify({ campaignId: item.id, topupId, depositAmount: Number(topup?.amount ?? 0), note: `ขอรับโปร ${item.title}` }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอรับโปรไม่สำเร็จ'); return; }
    setClaims((current) => [data.item, ...current.filter((claim) => claim.campaignId !== item.id)]);
    setMessage('ส่งคำขอรับโปรแล้ว รอแอดมินตรวจสอบ');
  }

  return <main className="member-promotions-page">
    <section className="member-promotions-hero"><span>Promotion</span><h1>โปรโมชัน</h1><p>เลือกฝากที่อนุมัติแล้วเพื่อรับโปร ระบบจะคำนวณโบนัสจากยอดฝากจริง</p><div><strong>{campaigns.length}</strong><small>โปรที่เปิดใช้งาน</small><strong>{approvedTopups.length}</strong><small>รายการฝากที่ใช้ได้</small></div></section>
    {message && <div className="member-promotions-notice" role="status">{message}</div>}
    <section className="member-promotions-list">{campaigns.map((item) => { const claim = claimMap.get(item.id); const options = eligibleTopups(item, approvedTopups, claims); return <PromotionCard key={item.id} item={item} claim={claim} options={options} selectedTopupId={selectedTopups[item.id] ?? options[0]?.id ?? ''} busy={busyId === item.id} onSelect={(topupId) => setSelectedTopups((current) => ({ ...current, [item.id]: topupId }))} onClaim={() => claimPromotion(item)} />; })}{campaigns.length === 0 && <div className="member-promotions-empty">ยังไม่มีโปรโมชันที่เปิดใช้งาน</div>}</section>
    <MemberBottomNav />
  </main>;
}

function PromotionCard({ item, claim, options, selectedTopupId, busy, onSelect, onClaim }: { item: PromotionCampaign; claim?: Claim; options: Topup[]; selectedTopupId: string; busy: boolean; onSelect: (value: string) => void; onClaim: () => void }) {
  const accent = item.accentColor || '#f5c542';
  const hasImage = Boolean(item.imageUrl && isValidUrl(item.imageUrl));
  const hasIcon = Boolean(item.iconUrl && isValidUrl(item.iconUrl));
  const style = { '--promotion-accent': accent } as React.CSSProperties;
  return <article className="member-promotion-card" style={style}>
    <div className="member-promotion-media">{hasImage ? <img src={item.imageUrl} alt={`ภาพโปรโมชัน ${item.title}`} loading="lazy" /> : <div className="member-promotion-fallback">{hasIcon ? <img src={item.iconUrl} alt="" /> : '★'}</div>}<span>{item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue))}</span></div>
    <div className="member-promotion-content"><div className="member-promotion-topline">{hasIcon && <img src={item.iconUrl} alt="" />}<span>{item.claimMode === 'manual_review' ? 'แอดมินตรวจ' : 'รอตรวจอัตโนมัติ'}</span></div><h2>{item.title}</h2><p>{item.description}</p><div className="member-promotion-condition-grid"><Condition label="ฝากขั้นต่ำ" value={money(item.minDeposit)} /><Condition label="โบนัสสูงสุด" value={money(item.maxBonus)} /><Condition label="เทิร์น" value={`x${item.turnoverMultiplier}`} /></div>{claim ? <div className={`member-promotion-claim is-${claim.status.toLowerCase()}`}><strong>สถานะ: {claimStatusLabel(claim.status)}</strong><span>{new Date(claim.createdAt).toLocaleString('th-TH')}</span>{claim.linkedTopup && <span>ฝากที่ใช้: {money(Number(claim.linkedTopup.amount))}</span>}{claim.adminNote && <span>{claim.adminNote}</span>}</div> : <><label className="member-promotion-field"><span>เลือกรายการฝาก</span><select value={selectedTopupId} onChange={(event) => onSelect(event.target.value)}><option value="">เลือกรายการฝากที่อนุมัติแล้ว</option>{options.map((topup) => <option key={topup.id} value={topup.id}>{money(Number(topup.amount))} · {new Date(topup.createdAt).toLocaleString('th-TH')}</option>)}</select></label><button type="button" disabled={busy || options.length === 0} onClick={onClaim} className="member-promotion-primary">{busy ? 'กำลังส่ง...' : options.length === 0 ? 'ยังไม่มีรายการฝากที่ใช้ได้' : 'รับโปรนี้'}</button></>}<a href="/deposit" className="member-promotion-secondary">ฝากเงิน</a><small>หนึ่งรายการฝากใช้รับโปรได้ครั้งเดียว และต้องผ่านการตรวจสอบก่อนสร้าง bonus ledger</small></div>
  </article>;
}

function Condition({ label, value }: { label: string; value: string }) { return <div className="member-promotion-condition"><span>{label}</span><strong>{value}</strong></div>; }
function eligibleTopups(campaign: PromotionCampaign, topups: Topup[], claims: Claim[]) { const usedTopupIds = new Set(claims.map((claim) => claim.topupId).filter(Boolean)); return topups.filter((topup) => !usedTopupIds.has(topup.id) && Number(topup.amount) >= campaign.minDeposit); }
function isInWindow(item: PromotionCampaign) { const now = Date.now(); const start = item.startsAt ? Date.parse(item.startsAt) : NaN; const end = item.endsAt ? Date.parse(item.endsAt) : NaN; if (Number.isFinite(start) && now < start) return false; if (Number.isFinite(end) && now > end) return false; return true; }
function isValidUrl(value?: string) { if (!value) return false; try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function claimStatusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ' }; return map[status] ?? status; }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
