'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './daily-mission-modal.module.css';

type DailyMissionModalProps = {
  open: boolean;
  onClose: () => void;
};

type Mission = {
  title: string;
  description: string;
  rewardType: 'credit' | 'ticket';
  rewardAmount: number;
};

type RewardDay = {
  day: number;
  amount: string;
  image: string;
};

const POINT_ICON = 'https://cdn.zabbet.com/FEZX/mini-game/icon/1719042231858-158da2b9-0540-49dd-96e2-8b73028d6b50.png';
const CREDIT_ICON = 'https://cdn.zabbet.com/FEZX/mini-game/icon/1719042231869-7a2de4e7-298f-453d-bf2d-3cd1a875f67f.png';
const TICKET_ICON = 'https://cdn.zabbet.com/FEZX/mini-game/icon/1719042231880-e048869d-9c95-468c-a526-6bf365e82e77.png';

const DAILY_REWARDS: readonly RewardDay[] = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1;
  if (day === 1) return { day, amount: 'x5', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041921061-0895cbb8-7950-4410-aec8-ac091190235d.png' };
  if ([2, 8, 15, 22].includes(day)) return { day, amount: 'x1', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041616090-bc9abbd0-743b-4efe-b3ea-abc91d132851.png' };
  if (day === 7) return { day, amount: 'x50', image: 'https://cdn.zabbet.com/FEZX/rewards/1732459420575-c65b717e-361b-4ce5-9936-c8cdf14d3346.webp' };
  if (day === 14) return { day, amount: 'x100', image: 'https://cdn.zabbet.com/FEZX/rewards/1742925501545-045a2366-4fec-4591-9d47-f7263551347c.webp' };
  if (day === 21) return { day, amount: 'x200', image: 'https://cdn.zabbet.com/FEZX/rewards/1732459480462-d6ac468d-4853-4a2d-8242-66455120b154.webp' };
  if (day === 28) return { day, amount: 'x300', image: 'https://cdn.zabbet.com/FEZX/rewards/1742925509284-a5e2dba6-ac4c-4fd0-9705-5a7422dffc5e.webp' };
  return { day, amount: 'x2', image: 'https://cdn.zabbet.com/FEZX/rewards/1719041939816-7876795b-0d3b-4d4f-9931-84cebd90cdd5.png' };
});

const MISSIONS: readonly Mission[] = [
  {
    title: 'ภารกิจรายเดือน : ฝากและเล่นสะสมครบ รับ 300 บาท',
    description: 'ฝากและเล่นสะสมครบ 100,000 บาท รับทันที 300 CREDIT',
    rewardType: 'credit',
    rewardAmount: 300,
  },
  {
    title: 'ภารกิจรายเดือน : ฝากและเล่น รับโชค',
    description: 'ฝากและเล่น 500 บาท จำนวน 20 ครั้ง รับทันที 3 Ticket',
    rewardType: 'ticket',
    rewardAmount: 3,
  },
  {
    title: 'ภารกิจรายเดือน : BetTurn ทุกค่ายเกม',
    description: 'เดิมพันขั้นต่ำ 1000 บาท 20 ครั้ง รับทันที 2 Ticket',
    rewardType: 'ticket',
    rewardAmount: 2,
  },
  {
    title: 'ภารกิจรายเดือน : ค่าย RB7 Lotto',
    description: 'เดิมพันหวยค่าย RB7 Lotto สะสมครบ 20,000 บาท รับทันที 1 Ticket',
    rewardType: 'ticket',
    rewardAmount: 1,
  },
  {
    title: 'ภารกิจรายเดือน : เทิร์นสะสมทุกค่ายเกม',
    description: 'เดิมพันสะสมครบ 400,000 บาท รับทันที 4 Ticket',
    rewardType: 'ticket',
    rewardAmount: 4,
  },
  {
    title: 'ภารกิจรายเดือน : เล่นชนะ คาสิโน สล็อต หวย',
    description: 'เล่น ( คาสิโน สล็อต หวย ) ชนะครบประเภทละ 2,000 บาท รับทันที 1 Ticket',
    rewardType: 'ticket',
    rewardAmount: 1,
  },
  {
    title: 'ภารกิจรายเดือน : เล่นแพ้ คาสิโน สล็อต หวย',
    description: 'เล่น ( คาสิโน สล็อต หวย ) แพ้ครบค่ายละ 2,000 บาท รับทันที 1 Ticket',
    rewardType: 'ticket',
    rewardAmount: 1,
  },
  {
    title: 'ภารกิจรายเดือน : ฝากครบ จบที่วงล้อเสี่ยงโชค',
    description: 'ฝาก 100 บาท จำนวน 20 ครั้ง รับทันที 1 Ticket',
    rewardType: 'ticket',
    rewardAmount: 1,
  },
  {
    title: 'ภารกิจรายเดือน : ค่าย PG SOFT',
    description: 'เดิมพันค่าย PG สะสมครบ 50,000 บาท รับทันที 2 Ticket',
    rewardType: 'ticket',
    rewardAmount: 2,
  },
  {
    title: 'ภารกิจรายเดือน : ค่าย SA Gaming',
    description: 'เดิมพันค่าย SA Gaming สะสมครบ 70,000 บาท รับทันที 2 Ticket',
    rewardType: 'ticket',
    rewardAmount: 2,
  },
];

export default function DailyMissionModal({ open, onClose }: DailyMissionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [activeTab, setActiveTab] = useState<'missions' | 'continuous'>('missions');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setShowAllRewards(false);
      setActiveTab('missions');
    }
  }, [open]);

  if (!mounted || !open) return null;

  const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div className={styles.overlay} onMouseDown={closeFromBackdrop} role="presentation">
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="daily-mission-title">
        <span className={styles.topLine} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.headingIcon} aria-hidden="true">
              <svg viewBox="0 0 31 31" fill="none">
                <path stroke="#C8C8C8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M27.88 16.445A11.938 11.938 0 1 1 15.153 3.588" />
                <path stroke="#C8C8C8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21.103 17.5a5.51 5.51 0 1 1-7.145-7.127M15.982 15.497l4.592-4.592M24.244 11.825l-3.673-.918-.919-3.674 3.674-3.673.918 3.673 3.674.918-3.674 3.674Z" />
              </svg>
            </span>
            <h2 id="daily-mission-title">ล็อคอินรายวัน และภารกิจ</h2>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.balances} aria-label="ยอดรางวัล">
              <Balance icon={POINT_ICON} value="0" label="คะแนน" />
              <Balance icon={CREDIT_ICON} value="0" label="เครดิต" />
              <Balance icon={TICKET_ICON} value="0" label="ตั๋ว" />
            </div>
            <button ref={closeButtonRef} type="button" className={styles.close} onClick={onClose} aria-label="ปิดหน้าต่าง">
              <img src="/assets/asset-pc/images/close.svg" alt="" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.dailyPane} aria-label="ล็อคอินรายวัน">
            {showAllRewards ? (
              <div className={styles.fullRewardView}>
                <button type="button" className={styles.backRewards} onClick={() => setShowAllRewards(false)}>← ย้อนกลับ</button>
                <div className={styles.fullRewards}>
                  {DAILY_REWARDS.map((reward) => <RewardCard key={reward.day} reward={reward} />)}
                </div>
              </div>
            ) : (
              <>
                <div className={styles.dailyHeader}>
                  <img className={styles.calendarIcon} src="/assets/asset-pc/images/event/daily/calendar.webp" alt="" aria-hidden="true" />
                  <div className={styles.dailyTitle}>
                    <strong>สิทธิ์ของคุณในเดือนนี้</strong>
                    <button type="button" className={styles.showAll} onClick={() => setShowAllRewards(true)}>ดูรางวัลทั้งเดือน</button>
                  </div>
                  <div className={styles.monthCount}><strong>0</strong><span>/ 28</span></div>
                </div>

                <div className={styles.prizeStage}>
                  <img className={styles.noReward} src="/assets/asset-pc/images/mini_game/no_reward.webp" alt="ไม่มีรางวัลที่รับได้" />
                  <div className={styles.claimed}>รับรางวัลแล้ว</div>
                </div>

                <div className={styles.monthProgress}><span /></div>
                <div className={styles.rewardStrip}>
                  {DAILY_REWARDS.slice(0, 7).map((reward) => <RewardCard key={reward.day} reward={reward} />)}
                </div>
              </>
            )}
          </section>

          <section className={styles.missionPane} aria-label="รายการภารกิจ">
            <h3>รายการภารกิจ</h3>
            <div className={styles.tabs} role="tablist" aria-label="ประเภทภารกิจ">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'missions'}
                className={`${styles.tab}${activeTab === 'missions' ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setActiveTab('missions')}
              >
                ภารกิจ
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'continuous'}
                className={`${styles.tab}${activeTab === 'continuous' ? ` ${styles.tabActive}` : ''}`}
                onClick={() => setActiveTab('continuous')}
              >
                ภารกิจต่อเนื่อง
              </button>
            </div>

            <div className={styles.missionProgress}>
              <span>ภารกิจทั้งหมด</span>
              <div className={styles.progressLine}>
                <div className={styles.progressTrack}><span /></div>
                <small>0/10</small>
              </div>
            </div>

            {activeTab === 'missions' ? (
              <div className={styles.missionList}>
                {MISSIONS.map((mission) => <MissionCard key={mission.title} mission={mission} />)}
              </div>
            ) : (
              <div className={styles.empty}>ยังไม่มีภารกิจต่อเนื่อง</div>
            )}
          </section>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function Balance({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <span className={styles.balance}>
      <img src={icon} alt="" aria-hidden="true" />
      <span className={styles.balanceCopy}><strong>{value}</strong><span>{label}</span></span>
    </span>
  );
}

function RewardCard({ reward }: { reward: RewardDay }) {
  return (
    <div className={styles.rewardCard}>
      <span>วันที่ {reward.day}</span>
      <div className={styles.rewardTile}>
        <img src={reward.image} alt="" aria-hidden="true" loading="lazy" />
        <strong>{reward.amount}</strong>
      </div>
    </div>
  );
}

function MissionCard({ mission }: { mission: Mission }) {
  const rewardIcon = mission.rewardType === 'credit' ? CREDIT_ICON : TICKET_ICON;
  return (
    <article className={styles.missionCard}>
      <div className={styles.missionCopy}>
        <h4>{mission.title}</h4>
        <p>{mission.description}</p>
        <div className={styles.cardProgress}>
          <div className={styles.progressTrack}><span /></div>
          <small>0%</small>
        </div>
        <div className={styles.cardLinks}>
          <button type="button">ⓘ อ่านเงื่อนไข</button>
          <button type="button">⌕ สถานะ</button>
        </div>
      </div>
      <div className={styles.rewardSide}>
        <span className={styles.timer}>◷ 3d 16:33:56</span>
        <div className={styles.rewardStatus}>
          <strong>สถานะ</strong>
          <span className={styles.rewardAmount}>
            <img src={rewardIcon} alt="" aria-hidden="true" loading="lazy" />
            <span>x{mission.rewardAmount}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
