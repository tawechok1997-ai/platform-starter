'use client';

import { useEffect, useRef, useState } from 'react';
import { useMemberSession } from '../../member-session-provider';
import styles from './spinner.module.css';

const CREDIT_PRIZES = [
  { rank: 2, value: '5,000' },
  { rank: 3, value: '4,000' },
  { rank: 4, value: '3,000' },
  { rank: 5, value: '2,500' },
  { rank: 6, value: '2,000' },
  { rank: 7, value: '1,800' },
  { rank: 8, value: '1,500' },
  { rank: 9, value: '1,200' },
] as const;

const WHEEL_LABELS = ['1x', '2x', '3x', '4x', '5x', '6x', '1,200', '1,500', '1,800', '2,000', '2,500', '3,000'] as const;
const WINNERS = [
  { name: 'NOA***176', prize: '6,000 เครดิต' },
  { name: 'MEM***458', prize: '5,000 เครดิต' },
  { name: 'NOA***031', prize: '4,000 เครดิต' },
  { name: 'VIP***892', prize: '3,000 เครดิต' },
] as const;

export default function LuckySpinnerPage() {
  const { ready, isLoggedIn } = useMemberSession();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [activeWinnerTab, setActiveWinnerTab] = useState<'grand' | 'credit'>('grand');
  const [message, setMessage] = useState('');
  const finishTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (finishTimerRef.current !== null) window.clearTimeout(finishTimerRef.current);
  }, []);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign('/');
  };

  const spin = (mode: 'ticket' | 'point') => {
    if (!ready || !isLoggedIn) {
      window.location.assign(`/?auth=login&next=${encodeURIComponent('/mini-game/spinner')}`);
      return;
    }
    if (spinning) return;

    const resultIndex = Math.floor(Math.random() * WHEEL_LABELS.length);
    const nextRotation = rotation + 1440 + (360 - resultIndex * 30) + 15;
    setMessage('กำลังหมุนวงล้อ...');
    setSpinning(true);
    setRotation(nextRotation);

    finishTimerRef.current = window.setTimeout(() => {
      setSpinning(false);
      setMessage(`ผลตัวอย่าง: ${WHEEL_LABELS[resultIndex]} · ระบบรางวัลจริงจะเชื่อมจาก API ภายหลัง`);
      finishTimerRef.current = null;
    }, 4300);
  };

  return (
    <main className={styles.page} data-mini-game="spinner">
      <header className={styles.topbar}>
        <button type="button" className={styles.backButton} onClick={goBack} aria-label="ย้อนกลับ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" />
          </svg>
        </button>
        <h1 className={styles.title}>วงล้อเสี่ยงโชค</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.shell}>
        <div className={styles.layout}>
          <aside className={styles.panel} aria-label="ข้อมูลรางวัล">
            <div className={styles.sectionHeading}>
              <span className={styles.headingIcon} aria-hidden="true">☆</span>
              <h2>รางวัลใหญ่</h2>
            </div>

            <div className={styles.emptyGrandPrize}>
              <div>
                <span className={styles.giftIcon} aria-hidden="true">▣</span>
                <small>ไม่พบข้อมูล</small>
              </div>
            </div>

            <div className={styles.divider} aria-hidden="true" />

            <div className={styles.sectionHeading}>
              <span className={styles.headingIcon} aria-hidden="true">☆</span>
              <h2>รางวัลเครดิต</h2>
            </div>

            <div className={styles.firstPrize}>
              <span className={styles.firstPrizeLabel}>รางวัลที่ 1</span>
              <strong>6,000 เครดิต</strong>
            </div>

            <div className={styles.creditGrid}>
              {CREDIT_PRIZES.map((prize) => (
                <div key={prize.rank} className={styles.creditCard}>
                  <small>รางวัลที่ {prize.rank}</small>
                  <strong>{prize.value}</strong>
                </div>
              ))}
            </div>
          </aside>

          <section className={styles.centerColumn} aria-label="วงล้อและปุ่มหมุน">
            <div className={styles.lightHalo} aria-hidden="true" />
            <div className={styles.wheelStage}>
              <span className={styles.pointer} aria-hidden="true" />
              <div className={styles.wheelFrame} aria-hidden="true" />
              <div className={styles.wheel} style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
                <div className={styles.wheelLabels}>
                  {WHEEL_LABELS.map((label, index) => (
                    <span
                      key={`${label}-${index}`}
                      className={styles.wheelLabel}
                      style={{ transform: `rotate(${index * 30 + 15}deg) translateX(29%)` }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.centerButton} aria-hidden="true">SPIN</div>
            </div>

            <div className={styles.spinActions}>
              <button type="button" className={styles.spinButton} disabled={spinning} onClick={() => spin('ticket')}>
                <strong>{spinning ? 'กำลังหมุน' : 'หมุน'}</strong>
                <span>1 ครั้ง × ตั๋ว 1 ใบ</span>
              </button>
              <button type="button" className={styles.spinButton} disabled={spinning} onClick={() => spin('point')}>
                <strong>{spinning ? 'รอสักครู่' : 'หมุน'}</strong>
                <span>1 ครั้ง × 5 คะแนน</span>
              </button>
            </div>

            <p className={styles.statusMessage} aria-live="polite">{message}</p>

            <div className={styles.balanceRow}>
              <div className={styles.balanceCard}><span>🎟 ตั๋ว</span><strong>0</strong></div>
              <div className={styles.balanceCard}><span>✦ คะแนน</span><strong>0</strong></div>
            </div>
          </section>

          <aside className={`${styles.panel} ${styles.rightPanel}`} aria-label="ผู้ได้รับรางวัล">
            <div className={styles.sectionHeading}>
              <span className={styles.headingIcon} aria-hidden="true">☆</span>
              <h2>ผู้ได้รับรางวัล</h2>
            </div>

            <div className={styles.tabs} role="tablist" aria-label="ประเภทรางวัล">
              <button
                type="button"
                role="tab"
                aria-selected={activeWinnerTab === 'grand'}
                className={`${styles.tab} ${activeWinnerTab === 'grand' ? styles.tabActive : ''}`}
                onClick={() => setActiveWinnerTab('grand')}
              >
                รางวัลใหญ่
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeWinnerTab === 'credit'}
                className={`${styles.tab} ${activeWinnerTab === 'credit' ? styles.tabActive : ''}`}
                onClick={() => setActiveWinnerTab('credit')}
              >
                รางวัลเครดิต
              </button>
            </div>

            <div className={styles.winnersBox}>
              {activeWinnerTab === 'credit' ? WINNERS.map((winner, index) => (
                <div key={winner.name} className={styles.winnerRow}>
                  <span>{index + 1}</span>
                  <strong>{winner.name}</strong>
                  <small>{winner.prize}</small>
                </div>
              )) : (
                <div className={styles.emptyWinners}>
                  <div>
                    <span className={styles.emptyWinnersIcon} aria-hidden="true">☆</span>
                    <small>ไม่พบข้อมูล</small>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className={styles.conditions}>
            <strong>เงื่อนไข :</strong>
            ผู้เล่นสามารถเลือกได้ว่า หมุนหนึ่งครั้งใช้ตั๋ว 1 ใบ หรือหมุนหนึ่งครั้งใช้ 5 คะแนน
          </div>
        </div>
      </div>
    </main>
  );
}
