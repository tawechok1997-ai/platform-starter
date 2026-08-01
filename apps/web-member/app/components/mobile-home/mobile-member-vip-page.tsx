'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import { useMemberRuntime } from '../../member-runtime-provider';
import styles from './mobile-member-vip-page.module.css';

type UnknownRecord = Record<string, unknown>;
type TierKey = 'bronze' | 'silver';

type MobileMemberVipPageProps = {
  payload: unknown;
  loading: boolean;
  error: string;
  onBack: () => void;
};

type Tier = {
  key: TierKey;
  label: string;
  threshold: number;
  source: string;
  badgeColor: string;
};

type CashbackItemConfig = {
  label: string;
  icon: string;
  keys: readonly string[];
};

const TIERS = [
  {
    key: 'bronze',
    label: 'Bronze',
    threshold: 0,
    source: 'https://cdn.zabbet.com/FEZX/grouptypes/c005cd08-59f6-485f-8ee2-db342d509aa5.png',
    badgeColor: '#ff9499',
  },
  {
    key: 'silver',
    label: 'Silver',
    threshold: 50_000,
    source: 'https://cdn.zabbet.com/FEZX/grouptypes/78fd025e-0742-410c-ad98-c38f5acdeff1.png',
    badgeColor: '#8f8f96',
  },
] as const satisfies readonly [Tier, Tier];

const BENEFITS = [
  { label: 'ฝ่ายบริการลูกค้าพิเศษ รายบุคคล', icon: '/assets/asset-pc/images/เเนะนำการใช้งาน.png' },
  { label: 'ยอดถอนสูงสุดต่อวัน', icon: '/assets/asset-pc/images/รายได่คอมมิชชั่น.png' },
  { label: 'สิทธิ์เข้าร่วมกิจกรรมต่างๆ', icon: '/assets/asset-pc/images/กิจกรรม.png' },
] as const;

const SPECIAL_BONUSES = [
  { label: 'โบนัสพิเศษวันเกิด', icon: '/assets/asset-pc/images/โบนัสพิเศษ.png' },
] as const;

const CASHBACK = [
  { label: 'กีฬา', icon: '/assets/asset-pc/images/ถ่ายถอดสด.png', keys: ['sportsCashback', 'sportCashback', 'sports'] },
  { label: 'คาสิโน', icon: '/assets/asset-pc/images/ระดับสมาชิก.png', keys: ['casinoCashback', 'liveCasinoCashback', 'casino'] },
  { label: 'ยิงปลา', icon: '/assets/asset-pc/images/เเนะนำเพื่อน.png', keys: ['fishingCashback', 'fishCashback', 'fishing'] },
  { label: 'สล็อต', icon: '/assets/asset-pc/images/โปรโมชั้น.png', keys: ['slotCashback', 'slotsCashback', 'slot'] },
  { label: 'หวย', icon: '/assets/asset-pc/images/คูปอง.png', keys: ['lotteryCashback', 'lottoCashback', 'lottery'] },
] as const satisfies readonly CashbackItemConfig[];

export default function MobileMemberVipPage({
  payload,
  loading,
  error,
  onBack,
}: MobileMemberVipPageProps) {
  const { summary } = useMemberRuntime();
  const profile = useMemo(() => unwrapProfile(payload), [payload]);
  const turnover = useMemo(() => resolveTurnover(profile), [profile]);
  const currentTier = useMemo(
    () => resolveCurrentTier(profile, summary.vipLevel, turnover),
    [profile, summary.vipLevel, turnover],
  );
  const currentTierIndex = tierIndex(currentTier);
  const birthday = useMemo(() => resolveBirthday(profile), [profile]);
  const periodEnd = useMemo(() => resolvePeriodEnd(profile), [profile]);
  const [selectedTier, setSelectedTier] = useState<TierKey>(currentTier);
  const cardRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedTier(currentTier);
  }, [currentTier]);

  useEffect(() => {
    const card = cardRowRef.current?.querySelector<HTMLElement>(`[data-vip-tier-card="${selectedTier}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedTier]);

  const bronzeUnlocked = currentTierIndex >= 0;
  const silverUnlocked = currentTierIndex >= 1 || turnover >= TIERS[1].threshold;

  return (
    <main className={styles.page} data-mobile-member-page="vip" data-mobile-vip-authenticated={summary.isLoggedIn ? 'true' : 'false'}>
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>ระดับสมาชิก VIP</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.scroller}>
        <section className={styles.tierTimeline} aria-label="ระดับสมาชิก VIP">
          {TIERS.map((tier, index) => {
            const selected = selectedTier === tier.key;
            const unlocked = currentTierIndex >= index || turnover >= tier.threshold;
            const current = currentTier === tier.key;
            return (
              <div className={styles.timelineStep} key={tier.key}>
                <button
                  type="button"
                  className={`${styles.timelineButton} ${selected ? styles.timelineButtonActive : ''}`}
                  data-current={current ? 'true' : 'false'}
                  aria-pressed={selected}
                  onClick={() => setSelectedTier(tier.key)}
                >
                  {unlocked ? (
                    <span className={styles.timelineTierArt}>
                      <img
                        src={resolveTierSource(tier.source)}
                        alt=""
                        aria-hidden="true"
                        onError={(event) => { event.currentTarget.src = tier.source; }}
                      />
                      <span style={{ '--vip-badge-color': tier.badgeColor } as React.CSSProperties}>{tier.label}</span>
                    </span>
                  ) : (
                    <>
                      <span className={styles.timelineLock}><LockIcon /></span>
                      <strong>{tier.label}</strong>
                    </>
                  )}
                </button>
                {index < TIERS.length - 1 ? <span className={styles.timelineConnector} aria-hidden="true" /> : null}
              </div>
            );
          })}
        </section>

        <section className={styles.tierCards} ref={cardRowRef} aria-label="รายละเอียดระดับสมาชิก">
          {TIERS.map((tier, index) => (
            <TierCard
              key={tier.key}
              tier={tier}
              tierIndex={index}
              currentTierIndex={currentTierIndex}
              turnover={turnover}
              periodEnd={periodEnd}
              selected={selectedTier === tier.key}
              onSelect={() => setSelectedTier(tier.key)}
            />
          ))}
        </section>

        {loading ? <div className={styles.status}>กำลังโหลดข้อมูลสมาชิก...</div> : null}
        {!loading && error ? <div className={styles.error}>{error}</div> : null}

        {summary.isLoggedIn ? <BirthdayPrompt birthday={birthday} /> : null}

        <div className={styles.sectionStack}>
          <VipSection title="สิทธิประโยชน์ VIP">
            <div className={styles.benefitGrid}>
              {BENEFITS.map((item) => (
                <BenefitItem key={item.label} {...item} locked={!bronzeUnlocked} />
              ))}
            </div>
          </VipSection>

          <VipSection title="โบนัสพิเศษต่างๆ">
            <div className={styles.bonusGrid}>
              {SPECIAL_BONUSES.map((item) => (
                <BenefitItem key={item.label} {...item} locked={!bronzeUnlocked} />
              ))}
            </div>
          </VipSection>

          <VipSection title="คืนเงินพิเศษ" locked={!silverUnlocked}>
            <div className={styles.cashbackGrid}>
              {CASHBACK.map((item) => (
                <CashbackItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  rate={resolveCashbackRate(profile, item.keys)}
                  locked={!silverUnlocked}
                />
              ))}
            </div>
          </VipSection>
        </div>
      </div>
    </main>
  );
}

function TierCard({
  tier,
  tierIndex: cardTierIndex,
  currentTierIndex,
  turnover,
  periodEnd,
  selected,
  onSelect,
}: {
  tier: Tier;
  tierIndex: number;
  currentTierIndex: number;
  turnover: number;
  periodEnd: Date;
  selected: boolean;
  onSelect: () => void;
}) {
  const unlocked = currentTierIndex >= cardTierIndex || turnover >= tier.threshold;
  const current = currentTierIndex === cardTierIndex;
  const nextTier = TIERS[cardTierIndex + 1];
  const progressTarget = current && nextTier ? nextTier.threshold : tier.threshold;
  const progress = progressTarget > 0 ? Math.min(100, (turnover / progressTarget) * 100) : 100;
  const remaining = Math.max(0, progressTarget - turnover);

  return (
    <button
      type="button"
      className={`${styles.tierCard} ${selected ? styles.tierCardSelected : ''}`}
      data-vip-tier-card={tier.key}
      data-current={current ? 'true' : 'false'}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={styles.tierEmblemWrap}>
        <img
          className={styles.tierEmblem}
          src={resolveTierSource(tier.source)}
          alt={tier.label}
          loading="eager"
          onError={(event) => { event.currentTarget.src = tier.source; }}
        />
      </span>
      <strong className={styles.tierName}>{tier.label}</strong>
      <span className={styles.tierCardPanel}>
        {current && nextTier ? (
          <span className={styles.currentProgressCopy}>
            <span className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></span>
            <small>ยอดแทงสะสม</small>
            <span className={styles.progressAmount}>
              <strong>{formatCredits(turnover)}</strong>
              <i>/</i>
              <b>{formatCredits(nextTier.threshold)}</b>
            </span>
            <span className={styles.nextTierMessage}>
              <span>ทำยอดแทงเพิ่มอีก {formatCredits(remaining)} เครดิต</span>
              <span>เพื่อเป็นระดับ {nextTier.label} ภายใน {formatPeriodEnd(periodEnd)}</span>
            </span>
          </span>
        ) : unlocked ? (
          <span className={styles.progressCopy}>
            <CheckIcon />
            <strong>คุณได้รับสิทธิ์ระดับ {tier.label}</strong>
            <small>ยอดแทงสะสม {formatCredits(turnover)} เครดิต</small>
          </span>
        ) : (
          <span className={styles.lockedCopy}>
            <LockIcon />
            <strong>คุณมียอดแทงสะสมยังไม่ถึง {tier.label}</strong>
            <span>ต้องมียอดแทงครบ {formatCredits(tier.threshold)} เครดิต ขึ้นไป</span>
          </span>
        )}
      </span>
    </button>
  );
}

function BirthdayPrompt({ birthday }: { birthday: string }) {
  const icon = resolveLocalAssetOrSource(SPECIAL_BONUSES[0].icon, 'mobile');
  return (
    <section className={styles.birthdayPrompt} aria-label="โบนัสพิเศษวันเกิด">
      <span className={styles.birthdayIcon}><img src={icon} alt="" aria-hidden="true" /></span>
      <span className={styles.birthdayCopy}>
        <strong>โบนัสพิเศษวันเกิด</strong>
        {birthday ? <small>{formatBirthday(birthday)}</small> : null}
      </span>
      <button type="button" onClick={() => window.location.assign('/profile')}>
        {birthday ? 'แก้ไขวันเกิด' : 'กรอกวันเกิด'}
      </button>
    </section>
  );
}

function VipSection({
  title,
  locked = false,
  children,
}: {
  title: string;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.vipSection}>
      <SectionPlate title={title} />
      {locked ? <span className={styles.sectionLock} aria-label="ยังไม่ปลดล็อก"><LockIcon /></span> : null}
      {children}
    </section>
  );
}

function SectionPlate({ title }: { title: string }) {
  const gradientId = `vip-section-${title.replace(/\s+/g, '-')}`;
  return (
    <div className={styles.sectionPlate}>
      <svg viewBox="0 0 194 38" fill="none" aria-hidden="true">
        <path
          d="M3 1H1.69l.346 1.264 4.651 17 .013.049.018.047c.032.083.832 2.148 2.35 4.745 1.505 2.576 3.771 5.735 6.883 7.783 3.45 2.27 7.534 3.299 10.622 3.786 1.557.245 2.882.326 3.824.346.47.01.845.004 1.106-.004l.301-.012.08-.004.022-.001h.006H53.375 96.25 139.125h21.438.006l.022.001.08.004.301.012c.261.008.636.014 1.106.004.942-.02 2.267-.101 3.824-.346 3.088-.487 7.172-1.516 10.622-3.786 3.112-2.048 5.378-5.207 6.883-7.783 1.518-2.597 2.318-4.662 2.35-4.745l.018-.047.013-.049 4.651-17L192.31 1H191 3Z"
          fill={`url(#${gradientId}-fill)`}
          stroke={`url(#${gradientId}-stroke)`}
          strokeOpacity=".22"
          strokeWidth="2"
        />
        <defs>
          <linearGradient id={`${gradientId}-fill`} x1="96" y1="38" x2="96" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#505050" />
            <stop offset=".32" stopColor="#474747" />
            <stop offset=".79" stopColor="#313131" />
          </linearGradient>
          <linearGradient id={`${gradientId}-stroke`} x1="142.5" y1="48.75" x2="142" y2="6.72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f2f2f2" />
            <stop offset="1" stopColor="#f2f2f2" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <strong>{title}</strong>
    </div>
  );
}

function BenefitItem({ icon, label, locked }: { icon: string; label: string; locked: boolean }) {
  const localIcon = resolveLocalAssetOrSource(icon, 'mobile');
  return (
    <div className={styles.benefitItem} data-locked={locked ? 'true' : 'false'}>
      <span className={styles.benefitIcon}>
        <img src={localIcon} alt="" aria-hidden="true" />
        {locked ? <i aria-hidden="true"><LockIcon /></i> : null}
      </span>
      <p>{label}</p>
    </div>
  );
}

function CashbackItem({
  icon,
  label,
  rate,
  locked,
}: {
  icon: string;
  label: string;
  rate: number;
  locked: boolean;
}) {
  const localIcon = resolveLocalAssetOrSource(icon, 'mobile');
  return (
    <div className={styles.cashbackItem} data-locked={locked ? 'true' : 'false'}>
      <span><img src={localIcon} alt="" aria-hidden="true" /></span>
      <strong>{label}</strong>
      <b>{formatPercent(rate)}</b>
    </div>
  );
}

function unwrapProfile(payload: unknown): UnknownRecord {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data);
  return asRecord(data?.profile) ?? asRecord(root.profile) ?? data ?? root;
}

function resolveTurnover(profile: UnknownRecord) {
  const wallet = asRecord(profile.wallet) ?? {};
  const stats = asRecord(profile.stats) ?? {};
  const vip = asRecord(profile.vip) ?? {};
  return firstFiniteNumber(
    profile.cumulativeTurnover,
    profile.turnover,
    profile.totalTurnover,
    profile.vipTurnover,
    vip.turnover,
    vip.progress,
    vip.currentTurnover,
    stats.turnover,
    stats.cumulativeTurnover,
    wallet.turnover,
  );
}

function resolveCurrentTier(profile: UnknownRecord, runtimeTier: string, turnover: number): TierKey {
  const value = firstString(
    profile.vipLevel,
    profile.groupName,
    profile.memberGroup,
    asRecord(profile.vip)?.level,
    runtimeTier,
  ).toLowerCase();
  if (value.includes('silver') || turnover >= TIERS[1].threshold) return 'silver';
  return 'bronze';
}

function resolveBirthday(profile: UnknownRecord) {
  const personal = asRecord(profile.personal) ?? {};
  return firstString(profile.birthDate, profile.birthday, profile.dateOfBirth, personal.birthDate, personal.birthday);
}

function resolvePeriodEnd(profile: UnknownRecord) {
  const vip = asRecord(profile.vip) ?? {};
  const value = firstString(
    profile.vipPeriodEndsAt,
    profile.vipCycleEndsAt,
    profile.periodEndsAt,
    vip.periodEndsAt,
    vip.cycleEndsAt,
    vip.expiresAt,
  );
  const parsed = value ? new Date(value) : null;
  if (parsed && Number.isFinite(parsed.getTime())) return parsed;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 4, 30, 0, 0);
}

function resolveCashbackRate(profile: UnknownRecord, keys: readonly string[]) {
  const vip = asRecord(profile.vip) ?? {};
  const cashback = asRecord(vip.cashback) ?? asRecord(profile.cashback) ?? {};
  const benefits = asRecord(vip.benefits) ?? asRecord(profile.vipBenefits) ?? {};
  return firstFiniteNumber(
    ...keys.flatMap((key) => [profile[key], vip[key], cashback[key], benefits[key]]),
  );
}

function tierIndex(key: TierKey) {
  return TIERS.findIndex((tier) => tier.key === key);
}

function resolveTierSource(source: string) {
  return resolveLocalAssetOrSource(source, 'mobile');
}

function firstFiniteNumber(...values: unknown[]) {
  for (const value of values) {
    const normalized = typeof value === 'string' ? value.replace(/[,%\s]/g, '') : value;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function formatCredits(value: number) {
  return Math.max(0, value).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatPercent(value: number) {
  const safe = Math.max(0, value);
  return `${safe.toLocaleString('en-US', { maximumFractionDigits: 2 })}%`;
}

function formatPeriodEnd(value: Date) {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `วันที่ ${value.getDate()} เดือน ${value.getMonth() + 1} เวลา ${hours}:${minutes}`;
}

function formatBirthday(value: string) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" /></svg>;
}

function LockIcon() {
  return <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 11c-.275 0-.51-.098-.706-.294A.96.96 0 0 1 2 10V5c0-.275.098-.51.294-.706A.96.96 0 0 1 3 4h.5V3c0-.692.244-1.281.732-1.769A2.405 2.405 0 0 1 6 .5c.692 0 1.281.244 1.769.732C8.257 1.719 8.5 2.308 8.5 3v1H9c.275 0 .51.098.707.294.196.196.294.431.293.706v5c0 .275-.098.51-.294.707A.96.96 0 0 1 9 11H3Zm3-2.5c.275 0 .51-.098.707-.294A.96.96 0 0 0 7 7.5c0-.275-.098-.51-.294-.706A.96.96 0 0 0 6 6.5c-.275 0-.51.098-.706.294A.96.96 0 0 0 5 7.5c0 .275.098.51.294.707A.96.96 0 0 0 6 8.5ZM4.5 4h3V3c0-.417-.146-.77-.438-1.063A1.446 1.446 0 0 0 6 1.5c-.417 0-.77.146-1.063.438A1.446 1.446 0 0 0 4.5 3v1Z" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.1 6.2 2.2 2.2 5.6-5.6" /></svg>;
}
