'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MEMBER_WALLET_REFRESH_EVENT } from '../../../src/features/wallet/member-wallet';
import { memberApiFetch } from '../../member-api';
import styles from './mobile-member-activity-detail-page.module.css';

type ActivityKind = 'daily-mission' | 'turnover-reward' | 'lottery-prediction';
type RewardType = 'CREDIT' | 'POINT' | 'TICKET';

type DailyReward = {
  day: number;
  code: string;
  rewardType: RewardType;
  amount: number;
  imageUrl: string;
  claimed: boolean;
  available: boolean;
};

type DailyPayload = {
  cycleDays: number;
  currentDay: number;
  claimedCount: number;
  canClaim: boolean;
  rewards: DailyReward[];
};

type MissionItem = {
  code: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  progressPercent: number;
  rewardType: RewardType;
  rewardAmount: number;
  completed: boolean;
  claimed: boolean;
  claimable: boolean;
  expiresAt?: string;
};

type MissionPayload = {
  balances: Record<RewardType, number>;
  items: MissionItem[];
};

type TurnoverTier = {
  code: string;
  order: number;
  turnover: number;
  bonus: number;
  reached: boolean;
  claimed: boolean;
  claimable: boolean;
};

type TurnoverPayload = {
  category: 'slot' | 'casino';
  currentTurnover: number;
  nextTarget: number;
  progressPercent: number;
  claimedReward: number;
  totalReward: number;
  tiers: TurnoverTier[];
};

type LotteryRound = {
  code: string;
  title: string;
  bannerUrl: string;
  topDigits: number;
  bottomDigits: number;
  topReward: number;
  bottomReward: number;
  bothReward: number;
  conditions: string[];
};

type LotteryPayload = {
  round: LotteryRound;
  state: { code: 'OPEN' | 'UPCOMING' | 'CLOSED'; label: string };
  entry: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  canSubmit: boolean;
};

type StatusMessage = { tone: 'success' | 'error'; text: string } | null;

export default function MobileMemberActivityDetailPage({ activity }: { activity: string }) {
  const router = useRouter();
  const kind = isActivityKind(activity) ? activity : null;

  return (
    <main className={styles.page} data-mobile-member-page="activity-detail">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.push('/mobile/member/activity')}>
          <BackIcon />
        </button>
        <h1>{kind ? activityTitle(kind) : 'กิจกรรม'}</h1>
      </header>
      {!kind ? <div className={styles.errorState}>ไม่พบกิจกรรม</div> : null}
      {kind === 'daily-mission' ? <DailyMissionPage /> : null}
      {kind === 'turnover-reward' ? <TurnoverRewardPage /> : null}
      {kind === 'lottery-prediction' ? <LotteryPredictionPage /> : null}
    </main>
  );
}

function DailyMissionPage() {
  const [daily, setDaily] = useState<DailyPayload | null>(null);
  const [missions, setMissions] = useState<MissionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<StatusMessage>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dailyPayload, missionPayload] = await Promise.all([
        apiJson<DailyPayload>('/member/activities/daily-login'),
        apiJson<MissionPayload>('/member/activities/missions'),
      ]);
      setDaily(dailyPayload);
      setMissions(missionPayload);
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const claimDaily = async () => {
    setBusy('daily');
    setMessage(null);
    try {
      await apiJson('/member/activities/daily-login/claim', { method: 'POST' });
      setMessage({ tone: 'success', text: 'รับรางวัลของวันนี้แล้ว' });
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setBusy('');
    }
  };

  const claimMission = async (missionCode: string) => {
    setBusy(missionCode);
    setMessage(null);
    try {
      await apiJson(`/member/activities/missions/${encodeURIComponent(missionCode)}/claim`, { method: 'POST' });
      setMessage({ tone: 'success', text: 'รับรางวัลภารกิจแล้ว' });
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={styles.scrollBody} aria-busy={loading}>
      {message ? <StatusNotice message={message} /> : null}
      <section className={`${styles.sourcePanel} ${styles.dailyPanel}`}>
        <PanelTitle>ล็อคอินประจำวัน</PanelTitle>
        <div className={styles.dailySummary}>
          <img src="/images/event/daily/calendar.webp" alt="ปฏิทินล็อคอินประจำวัน" />
          <div className={styles.dailyCopy}>
            <strong>สิทธิที่คุณรับแล้วประจำรอบนี้</strong>
            <span>ดูรางวัลทั้งเดือน</span>
          </div>
          <div className={styles.dailyCount}><b>{daily?.claimedCount ?? 0}</b><span>/{daily?.cycleDays ?? 28}</span></div>
        </div>
        <div className={styles.rewardRail}>
          {(daily?.rewards ?? skeletonRewards()).map((reward) => (
            <div
              key={reward.code}
              className={`${styles.rewardDay} ${reward.available ? styles.rewardAvailable : ''} ${reward.claimed ? styles.rewardClaimed : ''}`}
            >
              <span>วันที่ {reward.day}</span>
              <div><img src={reward.imageUrl} alt="" /><b>x{formatNumber(reward.amount)}</b></div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={styles.primaryClaim}
          disabled={!daily?.canClaim || busy === 'daily'}
          onClick={claimDaily}
        >
          {busy === 'daily' ? 'กำลังรับรางวัล...' : daily?.canClaim ? 'รับรางวัลของวันนี้' : 'รับรางวัลของวันนี้แล้ว'}
        </button>
      </section>

      <section className={`${styles.sourcePanel} ${styles.missionPanel}`}>
        <PanelTitle>ภารกิจ</PanelTitle>
        <div className={styles.missionWheel}>
          <img src="/images/mini_game/spinner/wheel.webp" alt="วงล้อภารกิจ" />
          <span>สปิน</span>
        </div>
        <div className={styles.missionTabs}><b>ภารกิจ</b><span>ภารกิจต่อเนื่อง</span></div>
        <div className={styles.balanceChips}>
          <BalanceChip label="คะแนน" value={missions?.balances?.POINT ?? 0} />
          <BalanceChip label="เครดิต" value={missions?.balances?.CREDIT ?? 0} />
          <BalanceChip label="ตั๋ว" value={missions?.balances?.TICKET ?? 0} />
        </div>
        <h2 className={styles.listTitle}>รายการภารกิจ</h2>
        <div className={styles.missionList}>
          {(missions?.items ?? []).map((mission) => (
            <article className={styles.missionCard} key={mission.code}>
              <div className={styles.missionMain}>
                <strong>{mission.title}</strong>
                <p>{mission.description}</p>
                <span className={styles.conditionPill}>ⓘ เงื่อนไข</span>
              </div>
              <div className={styles.missionAction}>
                <small>{mission.expiresAt ? remainingTime(mission.expiresAt) : 'รอบปัจจุบัน'}</small>
                <button
                  type="button"
                  disabled={!mission.claimable || busy === mission.code}
                  onClick={() => claimMission(mission.code)}
                >
                  {mission.claimed ? 'รับแล้ว' : mission.claimable ? `รับ ${rewardLabel(mission.rewardType, mission.rewardAmount)}` : 'สถานะ'}
                </button>
                <div className={styles.progressRow}>
                  <div><i style={{ width: `${mission.progressPercent}%` }} /></div>
                  <span>{Math.round(mission.progressPercent)}%</span>
                </div>
              </div>
            </article>
          ))}
          {!loading && (missions?.items.length ?? 0) === 0 ? <div className={styles.emptyCard}>ยังไม่มีภารกิจในรอบนี้</div> : null}
        </div>
      </section>
    </div>
  );
}

function TurnoverRewardPage() {
  const [category, setCategory] = useState<'slot' | 'casino'>('slot');
  const [payload, setPayload] = useState<TurnoverPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState<StatusMessage>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayload(await apiJson<TurnoverPayload>(`/member/activities/turnover?category=${category}`));
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  const claim = async (tier: TurnoverTier) => {
    setBusy(tier.code);
    setMessage(null);
    try {
      await apiJson(`/member/activities/turnover/${category}/${encodeURIComponent(tier.code)}/claim`, { method: 'POST' });
      setMessage({ tone: 'success', text: `รับโบนัส ${formatNumber(tier.bonus)} เครดิตแล้ว` });
      window.dispatchEvent(new Event(MEMBER_WALLET_REFRESH_EVENT));
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={styles.turnBody} aria-busy={loading}>
      {message ? <StatusNotice message={message} /> : null}
      <div className={styles.turnTabs}>
        <button type="button" className={category === 'slot' ? styles.activeTurnTab : ''} onClick={() => setCategory('slot')}>สล็อต</button>
        <button type="button" className={category === 'casino' ? styles.activeTurnTab : ''} onClick={() => setCategory('casino')}>คาสิโน</button>
      </div>
      <section className={styles.turnHero}>
        <PanelTitle>ยอดเทิร์นของคุณ</PanelTitle>
        <div className={styles.turnWaves} aria-hidden="true"><i /><i /></div>
        <div className={styles.turnProgress}>
          <div><i style={{ width: `${payload?.progressPercent ?? 0}%` }} /></div>
          <section><span>ยอดเทิร์นปัจจุบัน<b>{formatNumber(payload?.currentTurnover ?? 0)} เครดิต</b></span><span>เป้าหมายลำดับถัดไป<b>{formatNumber(payload?.nextTarget ?? 0)} เครดิต</b></span></section>
        </div>
      </section>
      <div className={styles.turnRewardSummary}>
        <span>🏆 ยอดรางวัลรวม</span>
        <b>{formatNumber(payload?.claimedReward ?? 0)} / {formatNumber(payload?.totalReward ?? 39000)}</b>
      </div>
      <div className={styles.turnTable}>
        <div className={styles.turnHead}><span>ลำดับ</span><span>เทิร์น</span><span>โบนัส</span><span>รับรางวัล</span></div>
        {(payload?.tiers ?? []).map((tier) => (
          <div className={styles.turnRow} key={tier.code}>
            <b>{tier.order}</b>
            <strong>{formatNumber(tier.turnover)}</strong>
            <em>{formatNumber(tier.bonus)}</em>
            <button type="button" disabled={!tier.claimable || busy === tier.code} onClick={() => claim(tier)}>
              {tier.claimed ? 'รับแล้ว' : tier.claimable ? 'รับรางวัล' : 'ไม่ถึงเงื่อนไข'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LotteryPredictionPage() {
  const [payload, setPayload] = useState<LotteryPayload | null>(null);
  const [topNumber, setTopNumber] = useState('');
  const [bottomNumber, setBottomNumber] = useState('');
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<StatusMessage>(null);

  const load = useCallback(async () => {
    try {
      setPayload(await apiJson<LotteryPayload>('/member/activities/lottery'));
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const round = payload?.round;
  const valid = useMemo(() => Boolean(
    round
    && new RegExp(`^\\d{${round.topDigits}}$`).test(topNumber)
    && new RegExp(`^\\d{${round.bottomDigits}}$`).test(bottomNumber)
  ), [bottomNumber, round, topNumber]);

  const submit = async () => {
    if (!round || !valid || !payload?.canSubmit) return;
    setBusy(true);
    setMessage(null);
    try {
      await apiJson(`/member/activities/lottery/${encodeURIComponent(round.code)}/entries`, {
        method: 'POST',
        body: JSON.stringify({ topNumber, bottomNumber }),
      });
      setMessage({ tone: 'success', text: 'ส่งคำทายเรียบร้อยแล้ว' });
      await load();
    } catch (error) {
      setMessage({ tone: 'error', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.lotteryBody}>
      {message ? <StatusNotice message={message} /> : null}
      {round ? <img className={styles.lotteryBanner} src={round.bannerUrl} alt={round.title} /> : <div className={styles.bannerSkeleton} />}
      <div className={styles.lotteryTitleRow}>
        <strong>{round?.title ?? 'กิจกรรมทายผลหวย'}</strong>
        <span className={payload?.state.code === 'OPEN' ? styles.openBadge : styles.closedBadge}>{payload?.state.label ?? 'กำลังโหลด'}</span>
      </div>
      <p className={styles.lotteryHint}>กรุณาทายผลให้ครบทั้ง {round?.topDigits ?? 3} ตัวบน และ {round?.bottomDigits ?? 2} ตัวล่าง</p>
      <div className={styles.lotteryInputs}>
        <label><b>ระบุตัวเลขท้าย {round?.topDigits ?? 3} ตัวบน</b><input inputMode="numeric" maxLength={round?.topDigits ?? 3} value={topNumber} disabled={!payload?.canSubmit} onChange={(event) => setTopNumber(digitsOnly(event.target.value, round?.topDigits ?? 3))} /></label>
        <label><b>ระบุตัวเลขท้าย {round?.bottomDigits ?? 2} ตัวล่าง</b><input inputMode="numeric" maxLength={round?.bottomDigits ?? 2} value={bottomNumber} disabled={!payload?.canSubmit} onChange={(event) => setBottomNumber(digitsOnly(event.target.value, round?.bottomDigits ?? 2))} /></label>
      </div>
      {payload?.entry ? <div className={styles.submittedBox}>คุณส่งคำทายรอบนี้แล้ว</div> : null}
      <button className={styles.lotterySubmit} type="button" disabled={!payload?.canSubmit || !valid || busy} onClick={submit}>{busy ? 'กำลังส่ง...' : 'ยืนยันคำทาย'}</button>
      <div className={styles.conditions}>
        <button type="button" aria-expanded={conditionsOpen} onClick={() => setConditionsOpen((value) => !value)}><span>เงื่อนไขเข้าร่วมกิจกรรม</span><b>{conditionsOpen ? '⌃' : '⌄'}</b></button>
        {conditionsOpen ? <ul>{(round?.conditions ?? []).map((condition) => <li key={condition}>{condition}</li>)}</ul> : null}
      </div>
    </div>
  );
}

function PanelTitle({ children }: { children: string }) {
  return <div className={styles.panelTitle}><span>{children}</span></div>;
}

function BalanceChip({ label, value }: { label: string; value: number }) {
  return <div><i aria-hidden="true">●</i><b>{formatNumber(value)}</b><span>{label}</span></div>;
}

function StatusNotice({ message }: { message: Exclude<StatusMessage, null> }) {
  return <div className={message.tone === 'success' ? styles.successNotice : styles.errorNotice}>{message.text}</div>;
}

async function apiJson<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<T> {
  const response = await memberApiFetch(path, {
    cache: 'no-store',
    headers: { accept: 'application/json', 'content-type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const payload = await response.json().catch(() => null) as T | { message?: unknown } | null;
  if (!response.ok) {
    const message = payload && typeof (payload as { message?: unknown }).message === 'string'
      ? String((payload as { message: string }).message)
      : `ทำรายการไม่สำเร็จ (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

function skeletonRewards(): DailyReward[] {
  return Array.from({ length: 7 }, (_, index) => ({ day: index + 1, code: `loading-${index}`, rewardType: 'CREDIT', amount: index + 1, imageUrl: '/images/wallet.webp', claimed: false, available: false }));
}

function isActivityKind(value: string): value is ActivityKind {
  return value === 'daily-mission' || value === 'turnover-reward' || value === 'lottery-prediction';
}

function activityTitle(kind: ActivityKind) {
  if (kind === 'daily-mission') return 'ล็อคอินประจำวัน / ภารกิจ';
  if (kind === 'turnover-reward') return 'ทำยอด Turn รับรางวัลจุใจ';
  return 'ทายผลหวย';
}

function rewardLabel(type: RewardType, amount: number) {
  if (type === 'TICKET') return `${formatNumber(amount)} ตั๋ว`;
  if (type === 'POINT') return `${formatNumber(amount)} คะแนน`;
  return `${formatNumber(amount)} เครดิต`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function remainingTime(value: string) {
  const delta = Date.parse(value) - Date.now();
  if (!Number.isFinite(delta) || delta <= 0) return 'สิ้นสุดแล้ว';
  const days = Math.floor(delta / 86_400_000);
  const hours = Math.floor((delta % 86_400_000) / 3_600_000);
  return `${days}d ${hours}h`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลกิจกรรมได้';
}

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" /></svg>;
}
