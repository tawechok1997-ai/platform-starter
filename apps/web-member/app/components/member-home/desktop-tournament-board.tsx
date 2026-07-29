'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

type TournamentPlayer = {
  rank: number;
  name: string;
  score: number;
  stats: readonly [number, number, number, number, number, number];
};

type Tournament = {
  title: string;
  status: string;
  players: readonly TournamentPlayer[];
};

type DragState = {
  pointerId: number;
  startX: number;
  deltaX: number;
};

const TOURNAMENTS: readonly Tournament[] = [
  {
    title: 'No1. Tournament Football Royale ครั้งที่ 2',
    status: 'สิ้นสุดแล้ว',
    players: [
      { rank: 1, name: 'ZAXXXU709740', score: 20, stats: [17, 0, 0, 0, 7, 0] },
      { rank: 2, name: 'ZAXXXM664100', score: 17, stats: [13, 3, 0, 4, 4, 0] },
      { rank: 3, name: 'ZAXXXR440174', score: 13, stats: [13, 2, 0, 3, 5, 1] },
      { rank: 4, name: 'ZAXXXU410005', score: 11, stats: [13, 2, 0, 1, 7, 1] },
      { rank: 5, name: 'ZAXXXO539314', score: 9, stats: [11, 3, 0, 4, 3, 3] },
      { rank: 6, name: 'ZAXXXU746289', score: 8, stats: [14, 0, 0, 0, 10, 0] },
      { rank: 7, name: 'ZAXXXY111105', score: 6, stats: [10, 4, 0, 2, 6, 2] },
      { rank: 8, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 9, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 10, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    title: 'No1. Tournament Football Classic ครั้งที่ 2',
    status: 'สิ้นสุดแล้ว',
    players: [
      { rank: 1, name: 'ZAXXXU164013', score: 12, stats: [14, 1, 0, 1, 7, 1] },
      { rank: 2, name: 'ZAXXXX399733', score: 10, stats: [9, 6, 0, 4, 5, 0] },
      { rank: 3, name: 'ZAXXXW621805', score: 9, stats: [11, 4, 0, 1, 4, 4] },
      { rank: 4, name: 'ZAXXXO227775', score: 8, stats: [13, 0, 0, 4, 6, 1] },
      { rank: 5, name: 'ZAXXXR646987', score: 6, stats: [11, 3, 0, 1, 9, 0] },
      { rank: 6, name: 'ZAXXXO342818', score: 4, stats: [11, 1, 0, 5, 7, 0] },
      { rank: 7, name: 'ZAXXX923400', score: 3, stats: [10, 3, 0, 2, 9, 0] },
      { rank: 8, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 9, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 10, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    title: 'No1. Tournament Football Royale ครั้งที่ 1',
    status: 'สิ้นสุดแล้ว',
    players: [
      { rank: 1, name: 'ZAXXXM651112', score: 13, stats: [15, 2, 0, 1, 8, 1] },
      { rank: 2, name: 'ZAXXX1360752', score: 12, stats: [13, 3, 2, 1, 6, 2] },
      { rank: 3, name: 'ZAXXX0319280', score: 10, stats: [14, 1, 2, 1, 7, 2] },
      { rank: 4, name: 'ZAXXX1452618', score: 9, stats: [15, 0, 0, 3, 8, 1] },
      { rank: 5, name: 'ZAXXXV511163', score: 6, stats: [14, 0, 1, 0, 11, 0] },
      { rank: 6, name: 'ZAXXXI96827', score: 5, stats: [10, 4, 1, 1, 9, 0] },
      { rank: 7, name: 'ZAXXXO519159', score: 3, stats: [10, 4, 0, 1, 8, 2] },
      { rank: 8, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 9, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 10, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
    ],
  },
  {
    title: 'No1. Tournament Football Classic ครั้งที่ 1',
    status: 'สิ้นสุดแล้ว',
    players: [
      { rank: 1, name: 'ZAXXXX231972', score: 20, stats: [16, 1, 0, 3, 3, 2] },
      { rank: 2, name: 'ZAXXXO536010', score: 15, stats: [13, 4, 0, 1, 6, 1] },
      { rank: 3, name: 'ZAXXXR648845', score: 11, stats: [13, 3, 0, 0, 6, 3] },
      { rank: 4, name: 'ZAXXXR440174', score: 9, stats: [12, 3, 1, 0, 7, 2] },
      { rank: 5, name: 'ZAXXXO585554', score: 5, stats: [10, 4, 0, 3, 7, 1] },
      { rank: 6, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 7, name: 'ZAXXXO610618', score: 1, stats: [9, 5, 0, 0, 7, 4] },
      { rank: 8, name: 'ZAXXX0190846', score: 0, stats: [10, 3, 0, 1, 3, 8] },
      { rank: 9, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
      { rank: 10, name: '-', score: 0, stats: [0, 0, 0, 0, 0, 0] },
    ],
  },
] as const;

const SWIPE_THRESHOLD_PX = 56;
const SLIDE_GAP_PX = 16;

export function DesktopTournamentBoard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const moveTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(TOURNAMENTS.length - 1, index)));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('a, button, [data-drag-scroll]')) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, deltaX: 0 };
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.deltaX = event.clientX - drag.startX;
    setDragOffset(Math.max(-160, Math.min(160, drag.deltaX)));
    event.preventDefault();
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setDragging(false);
    setDragOffset(0);
    if (drag.deltaX <= -SWIPE_THRESHOLD_PX) moveTo(activeIndex + 1);
    if (drag.deltaX >= SWIPE_THRESHOLD_PX) moveTo(activeIndex - 1);
  };

  const trackOffset = `calc(${-activeIndex * 100}% - ${activeIndex * SLIDE_GAP_PX}px + ${dragOffset}px)`;

  return (
    <section
      className="source-tournament"
      data-section-kind="tournament"
      data-tournament-owner="desktop-home"
      aria-label="ตารางทัวร์นาเมนต์"
    >
      <header className="source-tournament__section-heading">
        <img src="/assets/asset-pc/images/home/tournament.svg" alt="" aria-hidden="true" />
        <strong>ทัวร์นาเมนต์</strong>
      </header>

      <div
        className="source-tournament__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <div
          className={`source-tournament__track${dragging ? ' is-dragging' : ''}`}
          style={{ transform: `translate3d(${trackOffset}, 0, 0)` }}
        >
          {TOURNAMENTS.map((tournament, index) => (
            <article
              key={tournament.title}
              className="source-tournament__slide"
              style={{ marginRight: index === TOURNAMENTS.length - 1 ? 0 : SLIDE_GAP_PX }}
            >
              <div className="source-tournament__panel">
                <div className="source-tournament__title-row">
                  <strong>{tournament.title}</strong>
                  <a href="/browse/tournaments" className="source-tournament__all-button">
                    <span>ดูทั้งหมด</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
                  </a>
                </div>

                <div className="source-tournament__status-row">
                  <span>{tournament.status}</span>
                  <button type="button" aria-label="ข้อมูลทัวร์นาเมนต์" title="ข้อมูลทัวร์นาเมนต์">
                    <svg viewBox="0 0 1024 1024" aria-hidden="true">
                      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" />
                      <path d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z" />
                    </svg>
                  </button>
                </div>

                <div className="source-tournament__rank-rail" data-drag-scroll="true" aria-label={`อันดับ ${tournament.title}`}>
                  {tournament.players.map((player) => (
                    <TournamentRankCard key={`${tournament.title}-${player.rank}`} player={player} />
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="source-tournament__pagination" aria-label="เลือกทัวร์นาเมนต์">
        {TOURNAMENTS.map((tournament, index) => (
          <button
            key={tournament.title}
            type="button"
            className={index === activeIndex ? 'is-active' : ''}
            onClick={() => moveTo(index)}
            aria-label={`ทัวร์นาเมนต์ ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

function TournamentRankCard({ player }: { player: TournamentPlayer }) {
  const topThree = player.rank <= 3;
  return (
    <article className="source-rank-card">
      <div className={`source-rank-card__badge${topThree ? ' is-top-three' : ''}`}>
        <img
          src={topThree
            ? '/assets/asset-pc/images/predict/mobile/rankBadgeTop3.svg'
            : '/assets/asset-pc/images/predict/mobile/rankBadgeOther.svg'}
          alt=""
          aria-hidden="true"
        />
        <strong>{player.rank}</strong>
      </div>
      <div className="source-rank-card__body">
        <span className="source-rank-card__name">{player.name}</span>
        <strong className={`source-rank-card__score${topThree ? ' is-top-three' : ''}`}>{player.score}</strong>
        <div className="source-rank-card__stats" aria-label="สถิติการแข่งขัน">
          {player.stats.map((value, index) => (
            <span key={index} className="source-rank-stat">
              <i className={`source-rank-stat__dot source-rank-stat__dot--${index + 1}`} aria-hidden="true" />
              <small>{value}</small>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
