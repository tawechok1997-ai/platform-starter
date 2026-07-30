'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MEMBER_PROMOTION_FALLBACKS,
  loadMemberPromotionCampaigns,
  memberPromotionDetails,
  memberPromotionImage,
  type MemberPromotionCampaign,
} from '../member-promotion-runtime';
import { memberApiFetch } from '../member-api';
import './member-promotions-contract.css';

type Claim = {
  id: string;
  campaignId: string;
  topupId?: string | null;
  linkedTopup?: Topup | null;
  depositAmount?: number;
  status: string;
  rawStatus: string;
  adminNote?: string;
  createdAt: string;
};
type Topup = {
  id: string;
  amount: string | number;
  currency: string;
  status: string;
  method?: string | null;
  referenceCode?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

export default function MemberPromotionsPage() {
  const [campaigns, setCampaigns] = useState<MemberPromotionCampaign[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [selectedTopups, setSelectedTopups] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('กำลังโหลดโปรโมชั่น...');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, []);

  const claimMap = useMemo(() => new Map(claims.map((item) => [item.campaignId, item])), [claims]);
  const approvedTopups = useMemo(() => topups.filter((item) => item.status === 'APPROVED'), [topups]);

  async function load(signal?: AbortSignal) {
    try {
      const [active, claimRes, topupRes] = await Promise.all([
        loadMemberPromotionCampaigns(signal),
        memberApiFetch('/member/promotion-claims', { signal, suppressSessionExpiryRedirect: true }),
        memberApiFetch('/member/topups', { signal, suppressSessionExpiryRedirect: true }),
      ]);
      const [claimData, topupData] = await Promise.all([
        claimRes.json().catch(() => null),
        topupRes.json().catch(() => null),
      ]);
      setCampaigns(active);
      if (claimRes.ok) setClaims(Array.isArray(claimData?.items) ? claimData.items : []);
      if (topupRes.ok) setTopups(Array.isArray(topupData?.items) ? topupData.items : []);
      setMessage('');
    } catch {
      if (signal?.aborted) return;
      setCampaigns(MEMBER_PROMOTION_FALLBACKS);
      setMessage('เชื่อมต่อระบบโปรโมชั่นไม่สำเร็จ กำลังแสดงข้อมูลสำรอง');
    }
  }

  async function claimPromotion(item: MemberPromotionCampaign) {
    const availableTopups = eligibleTopups(item, approvedTopups, claims);
    const topupId = selectedTopups[item.id] ?? availableTopups[0]?.id;
    if (item.requiresApprovedDeposit && !topupId) {
      setMessage('กรุณาเลือกรายการฝากที่อนุมัติแล้วและเข้าเงื่อนไขก่อนรับโปรโมชั่น');
      return;
    }

    setBusyId(item.id);
    const topup = approvedTopups.find((entry) => entry.id === topupId);
    const body: Record<string, unknown> = {
      campaignId: item.id,
      depositAmount: Number(topup?.amount ?? item.minDeposit ?? 0),
      note: `ขอรับโปรโมชั่น ${item.title}`,
    };
    if (topupId) body.topupId = topupId;

    try {
      const res = await memberApiFetch('/member/promotion-claims', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.message ?? 'ส่งคำขอรับโปรโมชั่นไม่สำเร็จ');
        return;
      }
      setClaims((current) => [data.item, ...current.filter((claim) => claim.campaignId !== item.id)]);
      setMessage(item.claimSuccessMessage || 'ส่งคำขอรับโปรโมชั่นแล้ว รอเจ้าหน้าที่ตรวจสอบ');
    } catch {
      setMessage('เชื่อมต่อระบบรับโปรโมชั่นไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setBusyId('');
    }
  }

  return (
    <main className="member-promotions-page">
      <section className="member-promotions-hero">
        <span>Promotion</span>
        <h1>โปรโมชั่น</h1>
        <p>รูป รายละเอียด เงื่อนไข และสิทธิ์ทั้งหมดอัปเดตจาก Promotion Center</p>
        <div>
          <strong>{campaigns.length}</strong>
          <small>โปรโมชั่นที่เปิดใช้งาน</small>
          <strong>{approvedTopups.length}</strong>
          <small>รายการฝากที่ใช้ได้</small>
        </div>
      </section>
      {message && <div className="member-promotions-notice" role="status">{message}</div>}
      <section className="member-promotions-list">
        {campaigns.map((item) => {
          const claim = claimMap.get(item.id);
          const options = eligibleTopups(item, approvedTopups, claims);
          return (
            <PromotionCard
              key={item.id}
              item={item}
              claim={claim}
              options={options}
              selectedTopupId={selectedTopups[item.id] ?? options[0]?.id ?? ''}
              busy={busyId === item.id}
              onSelect={(topupId) => setSelectedTopups((current) => ({ ...current, [item.id]: topupId }))}
              onClaim={() => claimPromotion(item)}
            />
          );
        })}
        {campaigns.length === 0 && <div className="member-promotions-empty">ยังไม่มีโปรโมชั่นที่เผยแพร่</div>}
      </section>
    </main>
  );
}

function PromotionCard({
  item,
  claim,
  options,
  selectedTopupId,
  busy,
  onSelect,
  onClaim,
}: {
  item: MemberPromotionCampaign;
  claim?: Claim | undefined;
  options: Topup[];
  selectedTopupId: string;
  busy: boolean;
  onSelect: (value: string) => void;
  onClaim: () => void | Promise<void>;
}) {
  const accent = item.accentColor || '#f5c542';
  const image = memberPromotionImage(item);
  const hasImage = isImageSource(image);
  const hasIcon = Boolean(item.iconUrl && isImageSource(item.iconUrl));
  const details = memberPromotionDetails(item);
  const style = { '--promotion-accent': accent } as React.CSSProperties;
  const requiresTopup = item.requiresApprovedDeposit;
  const claimDisabled = busy || (requiresTopup && options.length === 0);

  return (
    <article className="member-promotion-card" style={style}>
      <div className="member-promotion-media">
        {hasImage ? (
          <img src={image} alt={`ภาพโปรโมชั่น ${item.title}`} loading="lazy" decoding="async" />
        ) : (
          <div className="member-promotion-fallback">{hasIcon ? <img src={item.iconUrl} alt="" /> : 'โปรโมชั่น'}</div>
        )}
        <span>{item.badgeText || (item.bonusType === 'percent' ? `${item.bonusValue}%` : money(item.bonusValue))}</span>
      </div>
      <div className="member-promotion-content">
        <div className="member-promotion-topline">
          {hasIcon && <img src={item.iconUrl} alt="" />}
          <span>{item.claimMode === 'manual_review' ? 'เจ้าหน้าที่ตรวจสอบ' : 'สร้างคำขออัตโนมัติ'}</span>
        </div>
        <h2>{item.title}</h2>
        <p>{details.summary}</p>
        <div className="member-promotion-condition-grid">
          <Condition label="ฝากขั้นต่ำ" value={item.minDeposit > 0 ? money(item.minDeposit) : 'ไม่กำหนด'} />
          <Condition label="โบนัสสูงสุด" value={item.maxBonus > 0 ? money(item.maxBonus) : 'ตามเงื่อนไข'} />
          <Condition label="เทิร์น" value={item.turnoverMultiplier > 0 ? `x${item.turnoverMultiplier}` : 'ไม่มี'} />
        </div>
        {item.endsAt && <p className="member-promotion-expiry">สิ้นสุด {new Date(item.endsAt).toLocaleDateString('th-TH')}</p>}

        <details className="member-promotion-details">
          <summary>รายละเอียดและเงื่อนไข</summary>
          {details.detail ? <p>{details.detail}</p> : null}
          {details.terms ? <p>{details.terms}</p> : null}
          {details.allowedGames ? <p><strong>เกมที่ร่วมรายการ:</strong> {details.allowedGames}</p> : null}
          {details.excludedGames ? <p><strong>เกมที่ไม่ร่วมรายการ:</strong> {details.excludedGames}</p> : null}
          <p><strong>จำนวนสิทธิ์:</strong> {claimLimitLabel(item)}</p>
          {item.maxWithdrawal > 0 ? <p><strong>ถอนสูงสุด:</strong> {money(item.maxWithdrawal)}</p> : null}
        </details>

        {claim ? (
          <div className={`member-promotion-claim is-${claim.status.toLowerCase()}`}>
            <strong>สถานะ: {claimStatusLabel(claim.status)}</strong>
            <span>{new Date(claim.createdAt).toLocaleString('th-TH')}</span>
            {claim.linkedTopup && <span>ฝากที่ใช้: {money(Number(claim.linkedTopup.amount))}</span>}
            {claim.adminNote && <span>{claim.adminNote}</span>}
          </div>
        ) : (
          <>
            {requiresTopup ? (
              <label className="member-promotion-field">
                <span>เลือกรายการฝาก</span>
                <select aria-label={`เลือกรายการฝากสำหรับ ${item.title}`} value={selectedTopupId} onChange={(event) => onSelect(event.target.value)}>
                  <option value="">รายการฝากที่อนุมัติแล้ว</option>
                  {options.map((topup) => (
                    <option key={topup.id} value={topup.id}>{money(Number(topup.amount))} · {new Date(topup.createdAt).toLocaleString('th-TH')}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <button type="button" disabled={claimDisabled} onClick={() => { void onClaim(); }} className="member-promotion-primary">
              {busy ? 'กำลังส่ง...' : requiresTopup && options.length === 0 ? 'ยังไม่มีรายการฝากที่ใช้ได้' : item.claimButtonLabel || 'รับโปรโมชั่น'}
            </button>
          </>
        )}
        {requiresTopup ? <a href="/deposit" className="member-promotion-secondary">ฝากเงิน</a> : null}
        <small>ระบบตรวจสิทธิ์จากเงื่อนไขเดียวกับที่แสดงในหน้านี้</small>
      </div>
    </article>
  );
}

function Condition({ label, value }: { label: string; value: string }) {
  return <div className="member-promotion-condition"><span>{label}</span><strong>{value}</strong></div>;
}
function eligibleTopups(campaign: MemberPromotionCampaign, topups: Topup[], claims: Claim[]) {
  const usedTopupIds = new Set(claims.map((claim) => claim.topupId).filter(Boolean));
  return topups.filter((topup) => !usedTopupIds.has(topup.id) && Number(topup.amount) >= campaign.minDeposit);
}
function isImageSource(value?: string) {
  if (!value) return false;
  return value.startsWith('/') || /^https?:\/\//i.test(value);
}
function claimLimitLabel(item: MemberPromotionCampaign) {
  if (item.maxClaimsPerMember <= 0) return 'ไม่จำกัด';
  const period = item.claimLimitPeriod === 'day' ? 'ต่อวัน'
    : item.claimLimitPeriod === 'week' ? 'ต่อสัปดาห์'
      : item.claimLimitPeriod === 'month' ? 'ต่อเดือน'
        : item.claimLimitPeriod === 'year' ? 'ต่อปี'
          : 'ต่อบัญชี';
  return `${item.maxClaimsPerMember} ครั้ง${period}`;
}
function claimStatusLabel(status: string) {
  const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ' };
  return map[status] ?? status;
}
function money(value: number) {
  return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}
