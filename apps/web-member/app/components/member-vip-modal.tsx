'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MemberLocale } from '../member-locale-provider';

const ASSET_BASE = '/assets/asset-pc/images';

const TIERS = [
  {
    key: 'bronze',
    label: 'Bronze',
    assetId: 'c005cd08-59f6-485f-8ee2-db342d509aa5',
    target: 50_000,
    color: '#ff9499',
  },
  {
    key: 'silver',
    label: 'Silver',
    assetId: '36eb82e4-63aa-49ac-aa07-b075b0e91ca4',
    target: 50_000,
    color: '#a6a6a6',
  },
] as const;

type TierKey = (typeof TIERS)[number]['key'];

type MemberVipModalProps = {
  open: boolean;
  locale: MemberLocale;
  onClose: () => void;
};

const COPY = {
  th: {
    title: 'ระดับสมาชิก VIP',
    close: 'ปิด',
    cumulativeTurnover: 'ยอดแทงสะสม',
    progressPrefix: 'ทำยอดแทงเพิ่มอีก',
    progressSuffix: 'เครดิต เพื่อเป็นระดับ Silver',
    lockedTitle: 'คุณมียอดแทงสะสมยังไม่ถึง Silver',
    lockedDetail: 'ต้องมียอดแทงครบ 50,000 เครดิต ขึ้นไป',
    birthdayBonus: 'โบนัสพิเศษวันเกิด',
    enterBirthday: 'กรอกวันเกิด',
    vipBenefits: 'สิทธิประโยชน์ VIP',
    personalSupport: 'ฝ่ายบริการลูกค้าพิเศษ รายบุคคล',
    dailyWithdrawal: 'ยอดถอนสูงสุดต่อวัน',
    activityAccess: 'สิทธิ์เข้าร่วมกิจกรรมต่างๆ',
    specialBonuses: 'โบนัสพิเศษต่างๆ',
    specialCashback: 'คืนเงินพิเศษ',
    sport: 'กีฬา',
    casino: 'คาสิโน',
    fishing: 'ยิงปลา',
    slot: 'สล็อต',
    lottery: 'หวย',
  },
  en: {
    title: 'VIP membership',
    close: 'Close',
    cumulativeTurnover: 'Cumulative turnover',
    progressPrefix: 'Earn another',
    progressSuffix: 'credits to reach Silver',
    lockedTitle: 'Your turnover has not reached Silver',
    lockedDetail: 'At least 50,000 credits are required',
    birthdayBonus: 'Birthday bonus',
    enterBirthday: 'Add birthday',
    vipBenefits: 'VIP benefits',
    personalSupport: 'Dedicated personal support',
    dailyWithdrawal: 'Maximum daily withdrawal',
    activityAccess: 'Access to special activities',
    specialBonuses: 'Special bonuses',
    specialCashback: 'Special cashback',
    sport: 'Sport',
    casino: 'Casino',
    fishing: 'Fishing',
    slot: 'Slots',
    lottery: 'Lottery',
  },
} as const;

export default function MemberVipModal({ open, locale, onClose }: MemberVipModalProps) {
  const copy = COPY[locale];
  const [selectedTier, setSelectedTier] = useState<TierKey>('bronze');

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  const activeTier = TIERS.find((tier) => tier.key === selectedTier) ?? TIERS[0];
  const isBronze = activeTier.key === 'bronze';

  return createPortal(
    <div
      className="member-vip-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="member-vip-dialog" role="dialog" aria-modal="true" aria-label={copy.title}>
        <span className="member-vip-top-line" aria-hidden="true" />

        <header className="member-vip-header">
          <div className="member-vip-title-group">
            <span className="member-vip-title-icon" aria-hidden="true"><DiamondIcon /></span>
            <h2>{copy.title}</h2>
          </div>
          <button type="button" className="member-vip-close" onClick={onClose} aria-label={copy.close}>
            <CloseIcon />
          </button>
        </header>

        <div className="member-vip-tier-strip" role="tablist" aria-label={copy.title}>
          {TIERS.map((tier, index) => {
            const selected = tier.key === selectedTier;
            const locked = tier.key !== 'bronze';
            return (
              <div className="member-vip-tier-step" key={tier.key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={selected ? 'is-selected' : ''}
                  onClick={() => setSelectedTier(tier.key)}
                >
                  {locked ? (
                    <span className="member-vip-lock"><LockIcon /></span>
                  ) : (
                    <VipTierImage assetId={tier.assetId} alt={tier.label} />
                  )}
                  <span className="member-vip-tier-label" style={selected ? { backgroundColor: tier.color } : undefined}>{tier.label}</span>
                </button>
                {index < TIERS.length - 1 ? <span className="member-vip-tier-connector" aria-hidden="true" /> : null}
              </div>
            );
          })}
        </div>

        <div className="member-vip-main">
          <section className="member-vip-card-column">
            <div className={isBronze ? 'member-vip-level-card' : 'member-vip-level-card is-locked'}>
              <VipTierImage assetId={activeTier.assetId} alt={activeTier.label} />
              <strong className="member-vip-level-name">{activeTier.label}</strong>
              {isBronze ? (
                <div className="member-vip-progress-copy">
                  <div className="member-vip-progress-track"><span style={{ width: '0%' }} /></div>
                  <span>{copy.cumulativeTurnover}</span>
                  <strong>0 / {activeTier.target.toLocaleString('en-US')}</strong>
                  <p>{copy.progressPrefix} {activeTier.target.toLocaleString('en-US')} {copy.progressSuffix}</p>
                </div>
              ) : (
                <div className="member-vip-locked-copy">
                  <LockIcon />
                  <strong>{copy.lockedTitle}</strong>
                  <span>{copy.lockedDetail}</span>
                </div>
              )}
            </div>
          </section>

          <section className="member-vip-benefits-column">
            <div className="member-vip-birthday-card">
              <span className="member-vip-benefit-square"><img src={`${ASSET_BASE}/โบนัสพิเศษ.png`} alt="" /></span>
              <strong>{copy.birthdayBonus}</strong>
              <Link href="/profile/edit" onClick={onClose}>{copy.enterBirthday}</Link>
            </div>

            <VipBenefitSection title={copy.vipBenefits}>
              <VipBenefit icon="เเนะนำการใช้งาน.png" label={copy.personalSupport} />
              <VipBenefit icon="รายได่คอมมิชชั่น.png" label={copy.dailyWithdrawal} />
              <VipBenefit icon="กิจกรรม.png" label={copy.activityAccess} />
            </VipBenefitSection>

            <VipBenefitSection title={copy.specialBonuses}>
              <VipBenefit icon="โบนัสพิเศษ.png" label={copy.birthdayBonus} />
            </VipBenefitSection>

            <VipBenefitSection title={copy.specialCashback} wide>
              <CashbackRow icon="ถ่ายถอดสด.png" label={copy.sport} />
              <CashbackRow icon="ระดับสมาชิก.png" label={copy.casino} />
              <CashbackRow icon="เเนะนำเพื่อน.png" label={copy.fishing} />
              <CashbackRow icon="โปรโมชั้น.png" label={copy.slot} />
              <CashbackRow icon="คูปอง.png" label={copy.lottery} />
            </VipBenefitSection>
          </section>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function VipBenefitSection({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className="member-vip-benefit-section">
      <h3>{title}</h3>
      <div className={wide ? 'member-vip-benefit-grid is-wide' : 'member-vip-benefit-grid'}>{children}</div>
    </section>
  );
}

function VipBenefit({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="member-vip-benefit-item">
      <span><img src={`${ASSET_BASE}/${icon}`} alt="" /></span>
      <p>{label}</p>
    </div>
  );
}

function CashbackRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="member-vip-cashback-row">
      <span><img src={`${ASSET_BASE}/${icon}`} alt="" /></span>
      <strong>{label}</strong>
      <b>0%</b>
    </div>
  );
}

function VipTierImage({ assetId, alt }: { assetId: string; alt: string }) {
  const candidates = [
    `${ASSET_BASE}/grouptypes/${assetId}.png`,
    `${ASSET_BASE}/${assetId}.png`,
    `https://cdn.zabbet.com/FEZX/grouptypes/${assetId}.png`,
  ];
  const [candidateIndex, setCandidateIndex] = useState(0);

  return (
    <img
      className="member-vip-tier-image"
      src={candidates[candidateIndex]}
      alt={alt}
      onError={() => setCandidateIndex((current) => Math.min(current + 1, candidates.length - 1))}
    />
  );
}

function DiamondIcon() {
  return <svg viewBox="0 0 31 31" aria-hidden="true"><path d="m27.7 11.4-3.2-5.7a1.8 1.8 0 0 0-1.6-.9H7.4c-.6 0-1.2.4-1.6.9l-3.2 5.7c-.4.7-.3 1.6.3 2.2L14.3 25a1.2 1.2 0 0 0 1.7 0l11.4-11.4c.6-.6.7-1.5.3-2.2ZM12 4.8l-1.8 7c-.1.5-.1 1 .1 1.5l4.8 12h.1m3.1-20.5 1.8 7c.1.5.1 1-.1 1.5l-4.8 12M2.6 12.6h25.1" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12v10H6z" /></svg>;
}
