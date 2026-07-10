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
  async function load() { try { const settings = await loadPublicSiteSettings(); const active = promotionCampaignsSetting(settings).filter((item) => item.enabled && isInWindow(item)).sort((a, b) => Number(b.priority ?? 0) - Number(a.priority ?? 0)); setCampaigns(active); const [claimRes, topupRes] = await Promise.all([memberApiFetch('/member/promotion-claims'), memberApiFetch('/member/topups')]); const claimData = await claimRes.json().catch(() => null); const topupData = await topupRes.json().catch(() => null); if (claimRes.ok) setClaims(claimData.items ?? []); if (topupRes.ok) setTopups(topupData.items ?? []); setMessage(''); } catch { setCampaigns(promotionCampaignsSetting(defaultSettings).filter((item) => item.enabled)); setMessage('โหลดโปรโมชันไม่สำเร็จ'); } }
  async function claimPromotion(item: PromotionCampaign) { const topupId = selectedTopups[item.id] ?? eligibleTopups(item, approvedTopups, claims)[0]?.id; if (!topupId) { setMessage('กรุณาเลือกรายการฝากที่อนุมัติแล้วและมียอดถึงขั้นต่ำก่อนรับโปร'); return; } setBusyId(item.id); const topup = approvedTopups.find((entry) => entry.id === topupId); const res = await memberApiFetch('/member/promotion-claims', { method: 'POST', body: JSON.stringify({ campaignId: item.id, topupId, depositAmount: Number(topup?.amount ?? 0), note: `ขอรับโปร ${item.title}` }) }); const data = await res.json().catch(() => null); setBusyId(''); if (!res.ok) { setMessage(data?.message ?? 'ส่งคำขอรับโปรไม่สำเร็จ'); return; } setClaims((current) => [data.item, ...current.filter((claim) => claim.campaignId !== item.id)]); setMessage('ส่งคำขอรับโปรแล้ว รอแอดมินตรวจสอบ'); }
  return <main style={pageStyle}><section style={heroStyle}><span style={eyebrowStyle}>Promotion</span><h1 style={titleStyle}>โปรโมชัน</h1><p style={mutedStyle}>เลือกฝากที่อนุมัติแล้วเพื่อรับโปร ระบบจะคำนวณโบนัสจากยอดฝากจริง</p></section>{message && <div style={noticeStyle}>{message}</div>}<section style={listStyle}>{campaigns.map((item) => { const claim = claimMap.get(item.id); const options = eligibleTopups(item, approvedTopups, claims); return <PromotionCard key={item.id} item={item} claim={claim} options={options} selectedTopupId={selectedTopups[item.id] ?? options[0]?.id ?? ''} busy={busyId === item.id} onSelect={(topupId) => setSelectedTopups((current) => ({ ...current, [item.id]: topupId }))} onClaim={() => claimPromotion(item)} />; })}{campaigns.length === 0 && <div style={emptyStyle}>ยังไม่มีโปรโมชันที่เปิดใช้งาน</div>}</section><MemberBottomNav /></main>;
}
function PromotionCard({ item, claim, options, selectedTopupId, busy, onSelect, onClaim }: { item: PromotionCampaign; claim?: Claim; options: Topup[]; selectedTopupId: string; busy: boolean; onSelect: (value: string) => void; onClaim: () => void }) { const accent = item.accentColor || '#f5c542'; const hasImage = Boolean(item.imageUrl && isValidUrl(item.imageUrl)); const hasIcon = Boolean(item.iconUrl && isValidUrl(item.iconUrl)); return <article style={{ ...cardStyle, borderColor: `${accent}55`, background: `linear-gradient(180deg, ${accent}18, rgba(15,23,42,.86))` }}><div style={mediaStyle}>{hasImage ? <img src={item.imageUrl} alt="" style={imageStyle} /> : <div style={{ ...fallbackMediaStyle, color: accent }}>{hasIcon ? <img src={item.iconUrl} alt="" style={fallbackIconStyle} /> : '★'}</div>}<span style={{ ...floatingBadgeStyle, background: accent, color: '#111827' }}>{item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue))}</span></div><div style={contentStyle}><div style={rowStyle}>{hasIcon && <img src={item.iconUrl} alt="" style={iconStyle} />}<span style={badgeStyle}>{item.claimMode === 'manual_review' ? 'แอดมินตรวจ' : 'รอตรวจอัตโนมัติ'}</span></div><h2 style={cardTitleStyle}>{item.title}</h2><p style={mutedStyle}>{item.description}</p><div style={conditionGridStyle}><Condition label="ฝากขั้นต่ำ" value={money(item.minDeposit)} /><Condition label="โบนัสสูงสุด" value={money(item.maxBonus)} /><Condition label="เทิร์น" value={`x${item.turnoverMultiplier}`} /></div>{claim ? <div style={claimBoxStyle}><strong>สถานะ: {claimStatusLabel(claim.status)}</strong><span>{new Date(claim.createdAt).toLocaleString('th-TH')}</span>{claim.linkedTopup && <span>ฝากที่ใช้: {money(Number(claim.linkedTopup.amount))}</span>}{claim.adminNote && <span>{claim.adminNote}</span>}</div> : <><label style={fieldStyle}><span>เลือกรายการฝาก</span><select value={selectedTopupId} onChange={(event) => onSelect(event.target.value)} style={selectStyle}><option value="">เลือกรายการฝากที่อนุมัติแล้ว</option>{options.map((topup) => <option key={topup.id} value={topup.id}>{money(Number(topup.amount))} · {new Date(topup.createdAt).toLocaleString('th-TH')}</option>)}</select></label><button type="button" disabled={busy || options.length === 0} onClick={onClaim} style={{ ...buttonStyle, background: accent }}>{busy ? 'กำลังส่ง...' : 'รับโปรนี้'}</button></>}<a href="/deposit" style={secondaryButtonStyle}>ฝาก</a><small style={mutedStyle}>หนึ่งรายการฝากใช้รับโปรได้ครั้งเดียว และต้องผ่านการตรวจสอบก่อนสร้าง bonus ledger</small></div></article>; }
function Condition({ label, value }: { label: string; value: string }) { return <div style={conditionStyle}><span>{label}</span><strong>{value}</strong></div>; }
function eligibleTopups(campaign: PromotionCampaign, topups: Topup[], claims: Claim[]) { const usedTopupIds = new Set(claims.map((claim) => claim.topupId).filter(Boolean)); return topups.filter((topup) => !usedTopupIds.has(topup.id) && Number(topup.amount) >= campaign.minDeposit); }
function isInWindow(item: PromotionCampaign) { const now = Date.now(); const start = item.startsAt ? Date.parse(item.startsAt) : NaN; const end = item.endsAt ? Date.parse(item.endsAt) : NaN; if (Number.isFinite(start) && now < start) return false; if (Number.isFinite(end) && now > end) return false; return true; }
function isValidUrl(value?: string) { if (!value) return false; try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
function claimStatusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ' }; return map[status] ?? status; }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const pageStyle = { minHeight: '100dvh', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff', padding: '88px 16px 104px', display: 'grid', gap: 16 } as const;
const heroStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 26, padding: 18, background: 'radial-gradient(circle at top left, rgba(245,197,66,.22), transparent 34%), rgba(245,197,66,.08)', display: 'grid', gap: 8 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const noticeStyle = { padding: 14, borderRadius: 18, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)' } as const;
const listStyle = { display: 'grid', gap: 14 } as const;
const cardStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 26, overflow: 'hidden' as const, display: 'grid', minWidth: 0, boxShadow: '0 18px 60px rgba(0,0,0,.28)' } as const;
const mediaStyle = { minHeight: 160, position: 'relative' as const, background: 'rgba(255,255,255,.04)', overflow: 'hidden' as const };
const imageStyle = { width: '100%', height: 180, objectFit: 'cover' as const, display: 'block' };
const fallbackMediaStyle = { height: 170, display: 'grid', placeItems: 'center', fontSize: 48, fontWeight: 950, background: 'radial-gradient(circle at center, rgba(245,197,66,.18), rgba(15,23,42,.72))' } as const;
const fallbackIconStyle = { width: 74, height: 74, objectFit: 'cover' as const, borderRadius: 22 };
const floatingBadgeStyle = { position: 'absolute' as const, left: 12, top: 12, borderRadius: 999, padding: '8px 12px', fontWeight: 950, fontSize: 13, boxShadow: '0 12px 28px rgba(0,0,0,.26)' };
const contentStyle = { padding: 16, display: 'grid', gap: 12 } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const };
const iconStyle = { width: 40, height: 40, borderRadius: 13, objectFit: 'cover' as const, border: '1px solid rgba(255,255,255,.14)' };
const badgeStyle = { borderRadius: 999, padding: '7px 11px', background: 'rgba(245,197,66,.16)', color: '#fde68a', fontWeight: 950, fontSize: 13 } as const;
const cardTitleStyle = { margin: 0, fontSize: 26, lineHeight: 1.05 } as const;
const conditionGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 } as const;
const conditionStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 4, minWidth: 0 } as const;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const selectStyle = { minHeight: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: '#0b1220', color: '#fff', padding: '0 12px', minWidth: 0 } as const;
const buttonStyle = { minHeight: 44, borderRadius: 14, padding: '0 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontWeight: 950, textDecoration: 'none', border: 0 } as const;
const secondaryButtonStyle = { ...buttonStyle, background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)' } as const;
const claimBoxStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 14, padding: 12, background: 'rgba(245,197,66,.08)', display: 'grid', gap: 4 } as const;
const emptyStyle = { padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', color: '#94a3b8', textAlign: 'center' as const };
