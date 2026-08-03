'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMemberSession } from '../member-session-provider';
import { openMemberAuth } from '../lib/member-auth-events';
import {
  groupLiveMatches,
  loadCentralLiveMatches,
  type LiveMatch,
} from '../components/mobile-home/live-match-data';
import styles from './desktop-live-schedule-page.module.css';

type SortMode = 'league' | 'time';

const TIMEZONE = 'Asia/Bangkok';
const LIVE_BACKGROUND = '/assets/asset-pc/images/game/live/bg_live.webp';
const LIVE_BACKGROUND_FRONT = '/assets/asset-pc/images/live/bg_live.webp';
const LIVE_LOGO = '/assets/asset-pc/images/live/logo_live.webp';

export default function DesktopLiveSchedulePage() {
  const { ready, isLoggedIn } = useMemberSession();
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('league');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    void loadCentralLiveMatches(TIMEZONE, controller.signal)
      .then((result) => setMatches(result.items))
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setMatches([]);
        setError(reason instanceof Error ? reason.message : 'โหลดรายการถ่ายทอดสดไม่สำเร็จ');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [refreshKey]);

  const orderedMatches = useMemo(() => {
    const next = [...matches];
    if (sortMode === 'time') {
      next.sort((left, right) => matchTimestamp(left) - matchTimestamp(right));
      return next;
    }

    next.sort((left, right) => (
      left.league.localeCompare(right.league, 'th')
      || matchTimestamp(left) - matchTimestamp(right)
    ));
    return next;
  }, [matches, sortMode]);

  const groups = useMemo(() => groupLiveMatches(orderedMatches), [orderedMatches]);

  const watch = (match: LiveMatch) => {
    if (!ready) return;
    if (!isLoggedIn) {
      openMemberAuth('login', '/live');
      return;
    }
    if (match.streamUrl) window.location.assign(match.streamUrl);
  };

  return (
    <main className={styles.page} data-desktop-live-page="true">
      <img className={styles.backgroundBase} src={LIVE_BACKGROUND} alt="" aria-hidden="true" />
      <div className={styles.backgroundPurple} aria-hidden="true" />
      <div className={styles.backgroundFade} aria-hidden="true" />
      <img className={styles.backgroundFront} src={LIVE_BACKGROUND_FRONT} alt="" aria-hidden="true" />
      <div className={styles.backgroundFrontFade} aria-hidden="true" />

      <div className={styles.canvas}>
        <section className={styles.hero} aria-labelledby="desktop-live-title">
          <img className={styles.heroLogo} src={LIVE_LOGO} alt="LIVE" />
          <h1 id="desktop-live-title">ถ่ายทอดสด</h1>
        </section>

        <section className={styles.sportPanel} aria-label="ประเภทกีฬา">
          <button type="button" className={styles.sportActive} aria-current="page">ฟุตบอล</button>
        </section>

        <section className={styles.sortPanel} aria-label="เรียงรายการถ่ายทอดสด">
          <div className={styles.sortControl}>
            <button
              type="button"
              className={sortMode === 'time' ? styles.sortActive : ''}
              onClick={() => setSortMode('time')}
            >
              เรียงเวลา
            </button>
            <button
              type="button"
              className={sortMode === 'league' ? styles.sortActive : ''}
              onClick={() => setSortMode('league')}
            >
              เรียงลีก
            </button>
          </div>
        </section>

        <section className={styles.schedule} aria-live="polite">
          {loading ? <DesktopLiveSkeleton /> : null}

          {!loading && error ? (
            <div className={styles.state} role="alert">
              <strong>โหลดรายการถ่ายทอดสดไม่สำเร็จ</strong>
              <span>{error}</span>
              <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>ลองใหม่</button>
            </div>
          ) : null}

          {!loading && !error && groups.length === 0 ? (
            <div className={styles.state}>
              <strong>ยังไม่พบรายการถ่ายทอดสด</strong>
              <span>ตารางจะแสดงที่หน้านี้ทันทีเมื่อ API ส่งรายการแข่งขันเข้ามา</span>
              <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>โหลดใหม่</button>
            </div>
          ) : null}

          {!loading && !error ? groups.map((group) => (
            <section className={styles.league} key={`${group.league}-${group.date}`}>
              <header className={styles.leagueHeader}>
                <strong>{group.league}</strong>
                <time>{group.date}</time>
              </header>
              <div>
                {group.matches.map((match) => (
                  <article className={styles.match} key={match.id}>
                    <div className={styles.fixture}>
                      <DesktopTeam name={match.home} logo={match.homeLogo} side="home" />
                      <div className={styles.kickoff}>
                        <time>{match.time || '--:--'}</time>
                        {match.isLive ? <b>LIVE</b> : null}
                      </div>
                      <DesktopTeam name={match.away} logo={match.awayLogo} side="away" />
                    </div>
                    <button
                      type="button"
                      className={styles.watchButton}
                      disabled={!ready || (isLoggedIn && !match.streamUrl)}
                      data-requires-auth={isLoggedIn ? 'false' : 'true'}
                      onClick={() => watch(match)}
                    >
                      <span>ดูถ่ายทอดสด</span>
                      <ChevronIcon />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )) : null}
        </section>
      </div>
    </main>
  );
}

function DesktopTeam({
  name,
  logo,
  side,
}: {
  name: string;
  logo: string;
  side: 'home' | 'away';
}) {
  return (
    <div className={`${styles.team} ${side === 'home' ? styles.teamHome : styles.teamAway}`}>
      {side === 'home' ? <span title={name}>{name}</span> : null}
      <span className={styles.teamLogo}>
        {logo ? (
          <img
            src={logo}
            alt=""
            aria-hidden="true"
            onError={(event) => { event.currentTarget.hidden = true; }}
          />
        ) : <ShieldIcon />}
      </span>
      {side === 'away' ? <span title={name}>{name}</span> : null}
    </div>
  );
}

function DesktopLiveSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="กำลังโหลดรายการถ่ายทอดสด">
      {[0, 1, 2].map((item) => (
        <section key={item}>
          <header />
          <div />
        </section>
      ))}
    </div>
  );
}

function matchTimestamp(match: LiveMatch) {
  const parsed = Date.parse(match.startAt);
  if (Number.isFinite(parsed)) return parsed;
  const [hour = '99', minute = '99'] = match.time.split(':');
  return Number(hour) * 60 + Number(minute);
}

function ChevronIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9.43 18 5.98-6-5.98-6L8.03 7.4 12.62 12l-4.59 4.6L9.43 18Z" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 5 9 11v10c0 10 6.2 17.4 15 22 8.8-4.6 15-12 15-22V11L24 5Z" fill="#514c60" />
      <path d="M24 11 15 14.6V21c0 6.2 3.5 11.2 9 14.5 5.5-3.3 9-8.3 9-14.5v-6.4L24 11Z" fill="#2a2635" />
    </svg>
  );
}
