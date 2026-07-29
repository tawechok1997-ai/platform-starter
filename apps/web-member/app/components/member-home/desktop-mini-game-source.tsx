'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './desktop-mini-game-source.module.css';

const IMAGE_ROOT = '/assets/asset-pc/images';

const MINI_GAME_ACTIONS = [
  {
    key: 'wheel',
    label: 'วงล้อ',
    image: `${IMAGE_ROOT}/mini_game/icon-luckywheel-dt.webp`,
    href: '/mini-game/spinner',
  },
  {
    key: 'mission',
    label: 'ทำภารกิจ',
    image: `${IMAGE_ROOT}/mini_game/icon-dailymission-dt.webp`,
  },
] as const;

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
    time: '1d 20:46:43',
  },
  {
    title: 'ภารกิจรายเดือน : ฝากและเล่น รับโชค',
    description: 'ฝากและเล่น 500 บาท จำนวน 20 ครั้ง รับทันที 3 Ticket',
    reward: 'x3',
    rewardIcon: REWARD_ICONS.ticket,
    time: '1d 20:46:43',
  },
  {
    title: 'ภารกิจรายเดือน : BetTurn ทุกค่ายเกม',
    description: 'เดิมพันขั้นต่ำ 1,000 บาท จำนวน 20 ครั้ง รับทันที 2 Ticket',
    reward: 'x2',
    rewardIcon: REWARD_ICONS.ticket,
    time: '1d 20:46:43',
  },
  {
    title: 'ภารกิจรายเดือน : เล่นชนะ คาสิโน สล็อต หวย',
    description: 'เล่นชนะครบประเภทละ 2,000 บาท รับทันที 1 Ticket',
    reward: 'x1',
    rewardIcon: REWARD_ICONS.ticket,
    time: '1d 20:46:43',
  },
] as const;

type MissionTab = 'mission' | 'continuous';

export default function DesktopMiniGameSource() {
  const [mounted, setMounted] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!missionOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMissionOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [missionOpen]);

  return (
    <>
      <section
        id="desktop-mini-game-source"
        className={`reference-side-card reference-mini-games source-mini-game ${styles.miniGame}`}
        aria-label="Mini Game"
      >
        <div className="source-mini-game__header">
          <div className="source-mini-game__header-gradient" aria-hidden="true" />
          <div className="source-mini-game__header-line" aria-hidden="true" />
          <div className="source-mini-game__header-content">
            <div className="source-mini-game__title">
              <img
                loading="lazy"
                className="source-mini-game__title-icon"
                src={`${IMAGE_ROOT}/home/mini-game.webp`}
                alt=""
                aria-hidden="true"
              />
              <div className="source-mini-game__title-text">Mini Game</div>
            </div>
            <div className="source-mini-game__header-action" aria-hidden="true" />
          </div>
        </div>

        <div className={styles.actions}>
          {MINI_GAME_ACTIONS.map((action) =>
            action.key === 'mission' ? (
              <button
                key={action.key}
                type="button"
                className={styles.action}
                onClick={() => setMissionOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={missionOpen}
              >
                <img loading="lazy" className={styles.actionIcon} src={action.image} alt="" aria-hidden="true" />
                <span className={styles.actionLabel}>{action.label}</span>
              </button>
            ) : (
              <Link key={action.key} href={action.href} className={styles.action}>
                <img loading="lazy" className={styles.actionIcon} src={action.image} alt="" aria-hidden="true" />
                <span className={styles.actionLabel}>{action.label}</span>
              </Link>
            ),
          )}
        </div>
      </section>

      {mounted && missionOpen
        ? createPortal(<DailyMissionPopup onClose={() => setMissionOpen(false)} />, document.body)
        : null}
    </>
  );
}

function DailyMissionPopup({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<MissionTab>('mission');
  const rewards = activeTab === 'mission' ? DAILY_REWARDS : MONTHLY_REWARDS;

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="daily-mission-title">
        <div className={styles.shine} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.heading}>
            <span className={styles.headingIcon} aria-hidden="true">✦</span>
            <h2 id="daily-mission-title">ภารกิจ</h2>
          </div>

          <div className={styles.balances} aria-label="ยอดรางวัล">
            <div className={styles.balance}>
              <img src={REWARD_ICONS.point} alt="" aria-hidden="true" />
              <span><strong>0</strong><small>คะแนน</small></span>
            </div>
            <div className={styles.balance}>
              <img src={REWARD_ICONS.ticket} alt="" aria-hidden="true" />
              <span><strong>0</strong><small>ตั๋ว</small></span>
            </div>
          </div>

          <button type="button" className={styles.close} onClick={onClose} aria-label="ปิดหน้าต่างภารกิจ">×</button>
        </header>

        <div className={styles.body}>
          <section className={styles.panel} aria-label="ล็อกอินประจำวัน">
            <div className={styles.loginSummary}>
              <span className={styles.calendar} aria-hidden="true">▣</span>
              <div className={styles.loginCopy}>
                <h3>ล็อกอินประจำวัน</h3>
                <strong>รับรางวัลทุกวันที่เข้าใช้งาน</strong>
                <Link href="/?auth=login" onClick={onClose}>เข้าสู่ระบบเพื่อรับรางวัล</Link>
              </div>
              <div className={styles.loginCount}><b>0</b><span>วัน</span></div>
            </div>

            <div className={styles.progress}>
              <div className={styles.progressTrack}><div className={styles.progressFill} /></div>
              <small>0 / {activeTab === 'mission' ? 7 : 28}</small>
            </div>

            <div className={styles.rewards} aria-label="รางวัลล็อกอิน">
              {rewards.map((reward) => (
                <div key={`${activeTab}-${reward.day}`} className={styles.reward}>
                  <div className={styles.rewardDay}>วันที่ {reward.day}</div>
                  <div className={styles.rewardCard}>
                    <img src={reward.image} alt="" aria-hidden="true" />
                    <strong>{reward.amount}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel} aria-label="รายการภารกิจ">
            <h3>ภารกิจของคุณ</h3>
            <div className={styles.tabs} role="tablist" aria-label="ประเภทภารกิจ">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'mission'}
                className={`${styles.tab} ${activeTab === 'mission' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('mission')}
              >
                ภารกิจรายวัน
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'continuous'}
                className={`${styles.tab} ${activeTab === 'continuous' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('continuous')}
              >
                ภารกิจต่อเนื่อง
              </button>
            </div>

            <div className={styles.total}><span>ภารกิจทั้งหมด</span><strong>{MISSIONS.length}</strong></div>

            <div className={styles.missionList} role="tabpanel">
              {MISSIONS.map((mission) => (
                <article key={mission.title} className={styles.missionCard}>
                  <div>
                    <h4>{mission.title}</h4>
                    <p>{mission.description}</p>
                    <div className={styles.missionMeta}>
                      <span>ความคืบหน้า 0 / 1</span>
                      <span>เหลือเวลา {mission.time}</span>
                    </div>
                  </div>
                  <div className={styles.missionSide}>
                    <span className={styles.missionReward}>
                      <img src={mission.rewardIcon} alt="" aria-hidden="true" />
                      {mission.reward}
                    </span>
                    <button type="button" className={styles.claimButton} disabled>ยังไม่สำเร็จ</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
