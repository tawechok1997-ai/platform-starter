'use client';

import { useEffect, useMemo, useState } from 'react';
import { groupLiveMatches, loadCentralLiveMatches, type LiveMatch } from './live-match-data';
import styles from './mobile-live-schedule-page.module.css';

type Props = { onBack: () => void };
type SortMode = 'league' | 'time';

const TIMEZONE = 'Asia/Bangkok';

export default function MobileLiveSchedulePage({ onBack }: Props) {
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
      .catch((reason) => {
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
    next.sort((left, right) => left.league.localeCompare(right.league, 'th') || matchTimestamp(left) - matchTimestamp(right));
    return next;
  }, [matches, sortMode]);
  const groups = useMemo(() => groupLiveMatches(orderedMatches), [orderedMatches]);

  return (
    <main className={styles.page} data-mobile-live-page="true">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>ตารางถ่ายทอดสด</h1>
      </header>

      <div className={styles.sportTabs}>
        <span aria-current="page">ฟุตบอล</span>
      </div>

      <section className={styles.content}>
        <div className={styles.toolbar}>
          <h2>ฟุตบอล</h2>
          <div className={styles.sort} aria-label="เรียงรายการถ่ายทอดสด">
            <button type="button" className={sortMode === 'time' ? styles.active : ''} onClick={() => setSortMode('time')}>เรียงเวลา</button>
            <button type="button" className={sortMode === 'league' ? styles.active : ''} onClick={() => setSortMode('league')}>เรียงลีก</button>
          </div>
        </div>

        {loading ? <LiveScheduleSkeleton /> : null}

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
            <span>โซนเวลา: ไทย (GMT+7)</span>
            <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>ส่งใหม่</button>
          </div>
        ) : null}

        {!loading && !error && groups.length > 0 ? (
          <div className={styles.leagueList}>
            {groups.map((group) => (
              <section className={styles.league} key={`${group.league}-${group.date}`}>
                <header>
                  <strong>{group.league}</strong>
                  <time>{group.date}</time>
                </header>
                <div>
                  {group.matches.map((match) => <MatchRow key={match.id} match={match} />)}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function MatchRow({ match }: { match: LiveMatch }) {
  const open = (url: string) => {
    if (!url) return;
    window.location.assign(url);
  };

  return (
    <article className={styles.match}>
      <div className={styles.matchTime}>
        <time>{match.time || '--:--'}</time>
        {match.isLive ? <b>LIVE</b> : null}
      </div>

      <div className={styles.teams}>
        <Team logo={match.homeLogo} name={match.home} />
        <Team logo={match.awayLogo} name={match.away} />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={match.isLive && match.streamUrl ? styles.watchLive : styles.watch}
          disabled={!match.streamUrl}
          onClick={() => open(match.streamUrl)}
        >
          ดูถ่ายทอดสด <ChevronIcon />
        </button>
        {match.betUrl ? <button type="button" className={styles.bet} onClick={() => open(match.betUrl)}>เดิมพันทันที <CoinIcon /></button> : null}
      </div>
    </article>
  );
}

function Team({ logo, name }: { logo: string; name: string }) {
  return (
    <span className={styles.team}>
      <span className={styles.logo}>
        {logo ? <img src={logo} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true; }} /> : <ShieldIcon />}
      </span>
      <span title={name}>{name}</span>
    </span>
  );
}

function LiveScheduleSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="กำลังโหลดรายการถ่ายทอดสด">
      {[0, 1, 2].map((group) => (
        <section key={group}>
          <div />
          <span />
          <span />
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

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" /></svg>;
}

function ChevronIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ShieldIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.9 8.1 7 10 4.1-1.9 7-5.5 7-10V6l-7-3Z" fill="#777985" /></svg>;
}

function CoinIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#ffed57" /><path d="M8 4.2v7.6M10.2 5.5H7.1a1.3 1.3 0 0 0 0 2.6h1.8a1.3 1.3 0 1 1 0 2.6H5.8" stroke="#c48300" strokeWidth="1.1" strokeLinecap="round" /></svg>;
}
