'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './desktop-daily-mission-popup.module.css';

const IMAGE_ROOT = '/assets/asset-pc/images';

const REWARD_ICONS = {
  point: 'https://cdn.zabbet.com/FEZX/mini-game/icon/1719042231858-158da2b9-0540-49dd-96e2-8b73028d6b50.png',
  credit: 'https://cdn.zabbet.com/FEZX/mini-game/icon/1719042231869-7a2de4e7-298f-453d-bf2d-3cd1a875f67f.png',
  ticket: 'https://cdn.zabbet.com/FEZX/mini-game/icon/1719042231880-e048869d-9c95-468c-a526-6bf365e82e77.png',
} as const;

const DAILY_REWARDS = [
  { day: 1, amount: 'x5', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041921061-0895cbb8-7950-4410-aec8-ac091190235d.png' },
  { day: 2, amount: 'x1', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041616090-bc9abbd0-743b-4efe-b3ea-abc91d132851.png' },
  { day: 3, amount: 'x2', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041939816-7876795b-0d3b-4d4f-9931-84cebd90cdd5.png' },
  { day: 4, amount: 'x2', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041939816-7876795b-0d3b-4d4f-9931-84cebd90cdd5.png' },
  { day: 5, amount: 'x2', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041939816-7876795b-0d3b-4d4f-9931-84cebd90cdd5.png' },
  { day: 6, amount: 'x2', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041939816-7876795b-0d3b-4d4f-9931-84cebd90cdd5.png' },
  { day: 7, amount: 'x50', image: 'https://cdn.zabbet.com/FEZX/rewards/1732459420575-c65b717e-361b-4ce5-9936-c8cdf14d3346.webp' },
] as const;

const MONTHLY_REWARDS = Array.from({ length: 28 }, (_, index) => {
  const reward = DAILY_REWARDS[index % DAILY_REWARDS.length]!;
  return { ...reward, day: index + 1 };
});

const MISSIONS = [
  {
    title: 'ภารกิจรายเดือน : ฝากและเล่นสะสมครบ รับ 300 บาท',
    description: 'ฝากและเล่นสะสมครบ 100,000 บาท รับทันที 300 CREDIT',
    reward: 'x300',
    rewardIcon: REWARD_ICONS.credit,
  },
  {
    title: 'ภารกิจรายเดือน : ฝากและเล่น รับโชค',
    description: 'ฝากและเล่น 500 บาท จำนวน 20 ครั้ง รับทันที 3 Ticket',
    reward: 'x3',
    rewardIcon: REWARD_ICONS.ticket,
  },
  {
    title: 'ภารกิจรายเดือน : BetTurn ทุกค่ายเกม',
    description: 'เดิมพันขั้นต่ำ 1,000 บาท จำนวน 20 ครั้ง รับทันที 2 Ticket',
    reward: 'x2',
    rewardIcon: REWARD_ICONS.ticket,
  },
  {
    title: 'ภารกิจรายเดือน : เล่นชนะ คาสิโน สล็อต หวย',
    description: 'เล่นชนะครบประเภทละ 2,000 บาท รับทันที 1 Ticket',
    reward: 'x1',
    rewardIcon: REWARD_ICONS.ticket,
  },
] as const;

type DesktopDailyMissionPopupProps = {
  open: boolean;
  onClose: () => void;
};

type MissionTab = 'mission' | 'continuous';

export function DesktopDailyMissionPopup({ open, onClose }: DesktopDailyMissionPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<MissionTab>('mission');
  const [showAllRewards, setShowAllRewards] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, open]);

  if (!mounted || !open) return null;

  const rewards = showAllRewards ? MONTHLY_REWARDS : DAILY_REWARDS;

  return createPortal(
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="daily-mission-title">
        <div className={styles.shine} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.headingIcon} aria-hidden="true">
              <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
                <path d="M27.88 16.445A11.938 11.938 0 1 1 15.153 3.588" stroke="#C8C8C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21.103 17.5a5.51 5.51 0 1 1-7.145-7.127M15.982 15.497l4.592-4.592M24.244 11.825l-3.673-.918-.919-3.674 3.674-3.673.918 3.673 3.674.918-3.674 3.674Z" stroke="#C8C8C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 id="daily-mission-title">ล็อคอินรายวัน และภารกิจ</h2>
          </div>

          <div className={styles.balances} aria-label="ยอดรางวัล">
            <BalanceChip image={REWARD_ICONS.point} label="คะแนน" />
            <BalanceChip image={REWARD_ICONS.credit} label="เครดิต" />
            <BalanceChip image={REWARD_ICONS.ticket} label="ตั๋ว" />
          </div>

          <button type="button" className={styles.close} onClick={onClose} aria-label="ปิดหน้าต่างภารกิจ">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 3l12 12M15 3 3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          <section className={`${styles.panel} ${styles.login}`} aria-label="รางวัลล็อคอินรายวัน">
            <div className={styles.summary}>
              <div className={styles.calendar} aria-hidden="true">▣</div>
              <div>
                <strong>สิทธิ์ของคุณในเดือนนี้</strong>
                <button type="button" onClick={() => setShowAllRewards((current) => !current)}>
                  {showAllRewards ? 'ดูรางวัล 7 วัน' : 'ดูรางวัลทั้งเดือน'}
                </button>
              </div>
              <div className={styles.count}><b>0</b><span>/ 28</span></div>
            </div>

            <div className={styles.prize}>
              <div className={styles.prizeContent}>
                <img src={`${IMAGE_ROOT}/mini_game/icon-dailymission-dt.webp`} alt="รางวัลภารกิจรายวัน" />
                <button type="button" className={styles.prizeButton} disabled>รับรางวัลแล้ว</button>
              </div>
            </div>

            <ProgressBar value={0} label="0%" />

            <div className={styles.rewards}>
              {rewards.map((reward) => (
                <article className={styles.reward} key={reward.day}>
                  <div className={styles.rewardDay}>วันที่ {reward.day}</div>
                  <div className={styles.rewardCard}>
                    <img src={reward.image} alt="" aria-hidden="true" loading="lazy" />
                    <strong>{reward.amount}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.panel} ${styles.tasks}`} aria-label="รายการภารกิจ">
            <h3>รายการภารกิจ</h3>

            <div className={styles.tabs} role="tablist" aria-label="ประเภทภารกิจ">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'mission'}
                className={`${styles.tab} ${tab === 'mission' ? styles.tabActive : ''}`}
                onClick={() => setTab('mission')}
              >
                ภารกิจ
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'continuous'}
                className={`${styles.tab} ${tab === 'continuous' ? styles.tabActive : ''}`}
                onClick={() => setTab('continuous')}
              >
                ภารกิจต่อเนื่อง
              </button>
            </div>

            <div className={styles.total}>
              <span>ภารกิจทั้งหมด</span>
              <ProgressBar value={0} label="0/10" />
            </div>

            <div className={styles.list}>
              {MISSIONS.map((mission) => (
                <article className={styles.card} key={mission.title}>
                  <div className={styles.cardCopy}>
                    <h4>{mission.title}</h4>
                    <p>{mission.description}</p>
                    <ProgressBar value={0} label="0%" />
                    <div className={styles.cardLinks}>
                      <button type="button">ⓘ อ่านเงื่อนไข</button>
                      <button type="button">⌕ สถานะ</button>
                    </div>
                  </div>

                  <div className={styles.cardSide}>
                    <span className={styles.time}>◷ 1d 20:46:43</span>
                    <div className={styles.status}>
                      <span>สถานะ</span>
                      <div className={styles.cardReward}>
                        <img src={mission.rewardIcon} alt="" aria-hidden="true" loading="lazy" />
                        <small>{mission.reward}</small>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function BalanceChip({ image, label }: { image: string; label: string }) {
  return (
    <div className={styles.balance}>
      <img src={image} alt="" aria-hidden="true" loading="lazy" />
      <span className={styles.balanceCopy}><strong>0</strong><small>{label}</small></span>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={styles.progress}>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${safeValue}%` }} />
      </div>
      <small>{label}</small>
    </div>
  );
}
