'use client';

import { formatLastPlayed, type RecentGameRecord } from './recent-game-storage';

type Props = {
  records: RecentGameRecord[];
  launchingGameId?: string;
  onLaunch: (record: RecentGameRecord) => void;
};

export default function RecentGamesRail({ records, launchingGameId, onLaunch }: Props) {
  if (!records.length) return null;
  return <section className="recent-games-rail" aria-label="เล่นต่อ">
    <header><div><span>CONTINUE PLAYING</span><h2>เล่นต่อจากครั้งล่าสุด</h2></div><small>{records.length} เกม</small></header>
    <div className="recent-games-track">
      {records.map((record) => <article key={record.id} className="recent-game-card">
        <div className="recent-game-cover">{record.imageUrl ? <img src={record.imageUrl} alt="" loading="lazy" decoding="async" /> : <span>{record.name.slice(0, 2).toUpperCase()}</span>}</div>
        <div className="recent-game-copy"><strong>{record.name}</strong><span>{record.providerName} · {record.platform}</span><small>{formatLastPlayed(record.lastPlayedAt)}</small></div>
        <button type="button" disabled={launchingGameId === record.id} onClick={() => onLaunch(record)}>{launchingGameId === record.id ? 'กำลังเปิด...' : 'เล่นต่อ'}</button>
      </article>)}
    </div>
  </section>;
}
