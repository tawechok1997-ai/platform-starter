'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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
    href: '/?auth=login',
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
        className="reference-side-card reference-mini-games source-mini-game"
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

        <div className="source-mini-game__actions">
          {MINI_GAME_ACTIONS.map((action) =>
            action.key === 'mission' ? (
              <button
                key={action.key}
                type="button"
                className={`mini-game-final-action mini-game-final-action--${action.key}`}
                onClick={() => setMissionOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={missionOpen}
              >
                <img loading="lazy" className="mini-game-final-icon" src={action.image} alt="" aria-hidden="true" />
                <span className="mini-game-final-label">{action.label}</span>
              </button>
            ) : (
              <a
                key={action.key}
                href={action.href}
                className={`mini-game-final-action mini-game-final-action--${action.key}`}
              >
                <img loading="lazy" className="mini-game-final-icon" src={action.image} alt="" aria-hidden="true" />
                <span className="mini-game-final-label">{action.label}</span>
              </a>
            ),
          )}
        </div>

        <style jsx>{`
          #desktop-mini-game-source .mini-game-final-action {
            position: relative !important;
            display: block !important;
            box-sizing: border-box !important;
            width: 100% !important;
            min-width: 0 !important;
            height: 44px !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            border: 2px solid rgb(255 227 111) !important;
            border-radius: 999px !important;
            outline: 0 !important;
            background: linear-gradient(135deg, rgb(136 0 200) 10%, rgb(110 0 141) 100%) !important;
            box-shadow: none !important;
            color: #fff !important;
            font: inherit !important;
            text-decoration: none !important;
            transform: none !important;
            cursor: pointer !important;
          }

          #desktop-mini-game-source .mini-game-final-action::before,
          #desktop-mini-game-source .mini-game-final-action::after {
            content: none !important;
            display: none !important;
          }

          #desktop-mini-game-source .mini-game-final-icon {
            position: absolute !important;
            top: 50% !important;
            left: -15px !important;
            z-index: 2 !important;
            display: block !important;
            width: 90px !important;
            min-width: 90px !important;
            max-width: 90px !important;
            height: 90px !important;
            min-height: 90px !important;
            max-height: 90px !important;
            margin: 0 !important;
            padding: 0 !important;
            object-fit: contain !important;
            transform: translateY(-50%) !important;
            pointer-events: none !important;
          }

          #desktop-mini-game-source .mini-game-final-label {
            position: absolute !important;
            inset: 0 4px 0 52px !important;
            z-index: 3 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            color: #fff !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            line-height: 24px !important;
            text-align: center !important;
            white-space: nowrap !important;
            pointer-events: none !important;
          }
        `}</style>
      </section>

      {mounted && missionOpen
        ? createPortal(<DailyMissionPopup onClose={() => setMissionOpen(false)} />, document.body)
        : null}

      <style jsx global>{`
        .daily-mission-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          padding: 16px;
          overflow: auto;
          background: rgba(0, 0, 0, 0.8);
        }

        .daily-mission-dialog {
          position: relative;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          width: min(1370px, 100%);
          max-height: min(780px, calc(100vh - 32px));
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          background: radial-gradient(49.1% 56.8% at 50% 0%, rgba(63, 59, 75, 0.96) 0%, rgba(63, 59, 75, 0.9) 30.08%, rgba(27, 24, 36, 0.98) 100%);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.58);
          color: #fff;
        }

        .daily-mission-dialog__shine {
          position: absolute;
          inset: 0 0 auto;
          z-index: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0) 26.03%, #fff 48.56%, rgba(255, 255, 255, 0) 72.48%);
          pointer-events: none;
        }

        .daily-mission-header {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          padding: 20px;
          gap: 28px;
        }

        .daily-mission-heading {
          display: flex;
          align-items: center;
          min-width: max-content;
          gap: 16px;
        }

        .daily-mission-heading__icon {
          display: grid;
          flex: 0 0 55px;
          place-items: center;
          width: 55px;
          height: 55px;
          border-radius: 10px;
          background: linear-gradient(360deg, rgba(21, 23, 29, 0.75) -5.86%, rgba(58, 60, 64, 0.75) 104.05%);
        }

        .daily-mission-heading h2 {
          margin: 0;
          color: #fff;
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
        }

        .daily-mission-balances {
          display: flex;
          align-items: center;
          margin-left: auto;
          gap: 8px;
        }

        .daily-mission-balance {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          min-width: 108px;
          height: 34px;
          padding: 2px 10px 2px 4px;
          gap: 10px;
          border: 2px solid rgba(242, 242, 242, 0.2);
          border-radius: 30px;
          background: linear-gradient(0deg, #505050 0%, #474747 32%, #313131 79%);
          opacity: 0.88;
        }

        .daily-mission-balance img {
          width: 27px;
          height: 27px;
          object-fit: contain;
        }

        .daily-mission-balance__copy {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          min-width: 0;
          margin-left: auto;
          gap: 4px;
        }

        .daily-mission-balance strong {
          font-size: 16px;
          line-height: 20px;
        }

        .daily-mission-balance small {
          color: rgba(255, 255, 255, 0.84);
          font-size: 12px;
          font-weight: 300;
          white-space: nowrap;
        }

        .daily-mission-close {
          display: grid;
          flex: 0 0 36px;
          place-items: center;
          width: 36px;
          height: 36px;
          margin-left: 4px;
          padding: 0;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #fff;
          cursor: pointer;
        }

        .daily-mission-close:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .daily-mission-body {
          display: grid;
          grid-template-columns: minmax(390px, 0.88fr) minmax(560px, 1.12fr);
          min-height: 0;
          padding: 0 20px 20px;
          gap: 14px;
          overflow: hidden;
        }

        .daily-mission-panel {
          box-sizing: border-box;
          min-height: 0;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 10px;
          background: rgba(14, 12, 20, 0.38);
        }

        .daily-mission-login {
          display: flex;
          flex-direction: column;
          padding: 18px;
          overflow-y: auto;
        }

        .daily-mission-login__summary {
          display: grid;
          grid-template-columns: 77px minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
        }

        .daily-mission-login__calendar {
          display: grid;
          place-items: center;
          width: 77px;
          height: 76px;
          border-radius: 18px;
          background: linear-gradient(145deg, #8a0bc6, #3b0d62);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
          color: #fff;
          font-size: 30px;
        }

        .daily-mission-login__summary h3,
        .daily-mission-tasks h3 {
          margin: 0;
          color: #fff;
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
        }

        .daily-mission-login__summary strong {
          display: block;
          color: rgb(202, 128, 238);
          font-size: 18px;
          line-height: 24px;
        }

        .daily-mission-login__summary button {
          margin: 4px 0 0;
          padding: 0;
          border: 0;
          background: transparent;
          color: #fff;
          font-size: 14px;
          font-weight: 300;
          text-decoration: underline;
          cursor: pointer;
        }

        .daily-mission-login__count {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          gap: 6px;
          white-space: nowrap;
        }

        .daily-mission-login__count b {
          font-size: 40px;
          font-weight: 900;
          line-height: 1;
        }

        .daily-mission-login__count span {
          font-size: 18px;
          font-weight: 600;
        }

        .daily-mission-prize {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 280px;
          margin: 6px auto 0;
        }

        .daily-mission-prize::before {
          content: '';
          position: absolute;
          width: 290px;
          height: 290px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(151, 27, 215, 0.34) 0%, rgba(151, 27, 215, 0.08) 48%, transparent 72%);
        }

        .daily-mission-prize__content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          flex-direction: column;
        }

        .daily-mission-prize__content img {
          width: 190px;
          height: 190px;
          object-fit: contain;
          animation: dailyMissionFloat 2.8s ease-in-out infinite;
        }

        .daily-mission-prize__button {
          display: grid;
          place-items: center;
          width: 165px;
          height: 55px;
          margin-top: -18px;
          border: 0;
          border-radius: 6px;
          background: #2c2c2c;
          box-shadow: 0 0 48px rgba(255, 220, 0, 0.2);
          color: #cecece;
          font-size: 21px;
          font-weight: 600;
        }

        .daily-mission-progress {
          display: flex;
          align-items: center;
          width: 100%;
          gap: 6px;
        }

        .daily-mission-progress__track {
          flex: 1;
          height: 8px;
          overflow: hidden;
          border-radius: 8px;
          background: rgba(109, 112, 119, 0.12);
        }

        .daily-mission-progress__fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(93deg, #35b5e5 -11.62%, #43aae6 52.41%);
        }

        .daily-mission-progress small {
          flex: 0 0 auto;
          color: #fff;
          font-size: 10px;
          font-weight: 500;
        }

        .daily-mission-rewards {
          display: grid;
          grid-template-columns: repeat(7, minmax(72px, 1fr));
          margin-top: 24px;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .daily-mission-rewards--month {
          grid-template-columns: repeat(7, minmax(72px, 1fr));
        }

        .daily-mission-reward {
          min-width: 72px;
          color: #fff;
          text-align: center;
        }

        .daily-mission-reward__day {
          margin-bottom: 8px;
          color: rgba(255, 255, 255, 0.42);
          font-size: 14px;
          font-weight: 300;
        }

        .daily-mission-reward__card {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          width: 72px;
          height: 84px;
          margin-inline: auto;
          border: 1px solid rgba(202, 128, 238, 0.14);
          border-radius: 10px;
          background: #2e0039;
          opacity: 0.72;
        }

        .daily-mission-reward__card img {
          width: 49px;
          height: 49px;
          object-fit: contain;
          opacity: 0.62;
        }

        .daily-mission-reward__card strong {
          margin-top: 2px;
          color: #b4d6e1;
          font-size: 12px;
        }

        .daily-mission-tasks {
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 18px;
        }

        .daily-mission-tabs {
          display: flex;
          align-items: center;
          margin-top: 8px;
          gap: 10px;
          overflow-x: auto;
        }

        .daily-mission-tab {
          padding: 5px 17px;
          border: 0;
          border-radius: 20px;
          background: #15131a;
          color: #7a7a7a;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          white-space: nowrap;
          cursor: pointer;
        }

        .daily-mission-tab--active {
          background: #7100bd;
          color: #fff;
          font-weight: 600;
        }

        .daily-mission-total {
          display: flex;
          align-items: center;
          margin-top: 20px;
          gap: 12px;
          color: #fff;
          font-size: 14px;
        }

        .daily-mission-list {
          display: flex;
          flex-direction: column;
          min-height: 0;
          margin-top: 24px;
          padding-right: 4px;
          gap: 8px;
          overflow-y: auto;
        }

        .daily-mission-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 170px;
          box-sizing: border-box;
          width: 100%;
          padding: 16px;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.045);
          border-radius: 7px;
          background: #15131a;
        }

        .daily-mission-card__copy {
          min-width: 0;
        }

        .daily-mission-card__copy h4 {
          margin: 0;
          color: #ca80ee;
          font-size: 16px;
          font-weight: 700;
          line-height: 24px;
        }

        .daily-mission-card__copy p {
          margin: 2px 0 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 400;
          line-height: 18px;
        }

        .daily-mission-card__links {
          display: flex;
          align-items: center;
          margin-top: 8px;
          gap: 18px;
        }

        .daily-mission-card__links button {
          padding: 0;
          border: 0;
          background: transparent;
          color: #fff;
          font-size: 12px;
          font-weight: 300;
          cursor: pointer;
        }

        .daily-mission-card__side {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-direction: column;
          gap: 8px;
        }

        .daily-mission-card__time {
          color: #a8a8a8;
          font-size: 11px;
          white-space: nowrap;
        }

        .daily-mission-card__status {
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          width: 164px;
          height: 48px;
          padding: 0 12px;
          gap: 8px;
          border: 1px solid #4c4858;
          border-radius: 6px;
          background: #15131a;
          color: #fff;
        }

        .daily-mission-card__status span {
          font-size: 16px;
          font-weight: 700;
        }

        .daily-mission-card__reward {
          display: flex;
          align-items: center;
          flex-direction: column;
        }

        .daily-mission-card__reward img {
          width: 28px;
          height: 28px;
          object-fit: contain;
        }

        .daily-mission-card__reward small {
          margin-top: -3px;
          font-size: 10px;
          font-weight: 500;
        }

        @keyframes dailyMissionFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @media (max-width: 1100px) {
          .daily-mission-dialog {
            max-height: calc(100vh - 24px);
          }

          .daily-mission-body {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }

          .daily-mission-panel {
            overflow: visible;
          }

          .daily-mission-list {
            max-height: 520px;
          }
        }

        @media (max-width: 760px) {
          .daily-mission-backdrop {
            align-items: flex-start;
            padding: 8px;
          }

          .daily-mission-dialog {
            width: 100%;
            max-height: none;
            min-height: calc(100vh - 16px);
          }

          .daily-mission-header {
            flex-wrap: wrap;
            padding: 16px;
            gap: 14px;
          }

          .daily-mission-heading {
            min-width: 0;
          }

          .daily-mission-heading__icon {
            flex-basis: 46px;
            width: 46px;
            height: 46px;
          }

          .daily-mission-heading h2 {
            font-size: 19px;
            line-height: 26px;
          }

          .daily-mission-balances {
            order: 3;
            width: 100%;
            margin-left: 0;
            overflow-x: auto;
          }

          .daily-mission-close {
            margin-left: auto;
          }

          .daily-mission-body {
            padding: 0 10px 10px;
          }

          .daily-mission-login__summary {
            grid-template-columns: 58px minmax(0, 1fr);
          }

          .daily-mission-login__calendar {
            width: 58px;
            height: 58px;
            font-size: 24px;
          }

          .daily-mission-login__count {
            grid-column: 1 / -1;
            justify-content: flex-end;
          }

          .daily-mission-rewards,
          .daily-mission-rewards--month {
            grid-template-columns: repeat(7, 72px);
          }

          .daily-mission-card {
            grid-template-columns: 1fr;
          }

          .daily-mission-card__side {
            align-items: center;
            justify-content: space-between;
            flex-direction: row;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .daily-mission-prize__content img {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

function DailyMissionPopup({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<MissionTab>('mission');
  const [showAllRewards, setShowAllRewards] = useState(false);
  const rewards = showAllRewards ? MONTHLY_REWARDS : DAILY_REWARDS;

  return (
    <div
      className="daily-mission-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="daily-mission-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-mission-title"
      >
        <div className="daily-mission-dialog__shine" aria-hidden="true" />

        <header className="daily-mission-header">
          <div className="daily-mission-heading">
            <span className="daily-mission-heading__icon" aria-hidden="true">
              <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
                <path d="M27.88 16.445A11.938 11.938 0 1 1 15.153 3.588" stroke="#C8C8C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21.103 17.5a5.51 5.51 0 1 1-7.145-7.127M15.982 15.497l4.592-4.592M24.244 11.825l-3.673-.918-.919-3.674 3.674-3.673.918 3.673 3.674.918-3.674 3.674Z" stroke="#C8C8C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 id="daily-mission-title">ล็อคอินรายวัน และภารกิจ</h2>
          </div>

          <div className="daily-mission-balances" aria-label="ยอดรางวัล">
            <BalanceChip image={REWARD_ICONS.point} label="คะแนน" />
            <BalanceChip image={REWARD_ICONS.credit} label="เครดิต" />
            <BalanceChip image={REWARD_ICONS.ticket} label="ตั๋ว" />
          </div>

          <button type="button" className="daily-mission-close" onClick={onClose} aria-label="ปิดหน้าต่างภารกิจ">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 3l12 12M15 3 3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="daily-mission-body">
          <section className="daily-mission-panel daily-mission-login" aria-label="รางวัลล็อคอินรายวัน">
            <div className="daily-mission-login__summary">
              <div className="daily-mission-login__calendar" aria-hidden="true">▣</div>
              <div>
                <strong>สิทธิ์ของคุณในเดือนนี้</strong>
                <button type="button" onClick={() => setShowAllRewards((current) => !current)}>
                  {showAllRewards ? 'ดูรางวัล 7 วัน' : 'ดูรางวัลทั้งเดือน'}
                </button>
              </div>
              <div className="daily-mission-login__count"><b>0</b><span>/ 28</span></div>
            </div>

            <div className="daily-mission-prize">
              <div className="daily-mission-prize__content">
                <img src={`${IMAGE_ROOT}/mini_game/icon-dailymission-dt.webp`} alt="รางวัลภารกิจรายวัน" />
                <button type="button" className="daily-mission-prize__button" disabled>รับรางวัลแล้ว</button>
              </div>
            </div>

            <ProgressBar value={0} label="0%" />

            <div className={`daily-mission-rewards${showAllRewards ? ' daily-mission-rewards--month' : ''}`}>
              {rewards.map((reward) => (
                <article className="daily-mission-reward" key={reward.day}>
                  <div className="daily-mission-reward__day">วันที่ {reward.day}</div>
                  <div className="daily-mission-reward__card">
                    <img src={reward.image} alt="" aria-hidden="true" loading="lazy" />
                    <strong>{reward.amount}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="daily-mission-panel daily-mission-tasks" aria-label="รายการภารกิจ">
            <h3>รายการภารกิจ</h3>

            <div className="daily-mission-tabs" role="tablist" aria-label="ประเภทภารกิจ">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'mission'}
                className={`daily-mission-tab${tab === 'mission' ? ' daily-mission-tab--active' : ''}`}
                onClick={() => setTab('mission')}
              >
                ภารกิจ
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'continuous'}
                className={`daily-mission-tab${tab === 'continuous' ? ' daily-mission-tab--active' : ''}`}
                onClick={() => setTab('continuous')}
              >
                ภารกิจต่อเนื่อง
              </button>
            </div>

            <div className="daily-mission-total">
              <span>ภารกิจทั้งหมด</span>
              <ProgressBar value={0} label="0/10" />
            </div>

            <div className="daily-mission-list">
              {MISSIONS.map((mission) => (
                <article className="daily-mission-card" key={mission.title}>
                  <div className="daily-mission-card__copy">
                    <h4>{mission.title}</h4>
                    <p>{mission.description}</p>
                    <ProgressBar value={0} label="0%" />
                    <div className="daily-mission-card__links">
                      <button type="button">ⓘ อ่านเงื่อนไข</button>
                      <button type="button">⌕ สถานะ</button>
                    </div>
                  </div>

                  <div className="daily-mission-card__side">
                    <span className="daily-mission-card__time">◷ {mission.time}</span>
                    <div className="daily-mission-card__status">
                      <span>สถานะ</span>
                      <div className="daily-mission-card__reward">
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
    </div>
  );
}

function BalanceChip({ image, label }: { image: string; label: string }) {
  return (
    <div className="daily-mission-balance">
      <img src={image} alt="" aria-hidden="true" loading="lazy" />
      <span className="daily-mission-balance__copy"><strong>0</strong><small>{label}</small></span>
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="daily-mission-progress">
      <div className="daily-mission-progress__track">
        <div className="daily-mission-progress__fill" style={{ width: `${safeValue}%` }} />
      </div>
      <small>{label}</small>
    </div>
  );
}
