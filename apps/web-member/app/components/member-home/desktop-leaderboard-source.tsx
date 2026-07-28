'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { V47_ASSETS } from './v47-asset-map';

type LeaderboardItem = {
  name: string;
  user: string;
  wins: string;
  image: string;
  providerBadge?: string;
};

const ITEMS: readonly LeaderboardItem[] = [
  {
    name: 'Wild Bandito',
    user: '098XXXX046',
    wins: '9,240',
    image: 'https://cdn.zabbet.com/games/pgslot/vertical/wild_bandito.jpg',
    providerBadge: 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png',
  },
  {
    name: 'Treasures of Aztec',
    user: '084XXXX898',
    wins: '6,300',
    image: 'https://cdn.zabbet.com/games/pgslot/vertical/treasures_of_aztec.jpg',
    providerBadge: 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png',
  },
  {
    name: 'Saba',
    user: '085XXXX203',
    wins: '4,675',
    image: 'https://cdn.zabbet.com/providers/set/1_1_v/saba.png',
  },
  {
    name: 'Fortune Gems',
    user: '090XXXX955',
    wins: '4,480',
    image: 'https://cdn.zabbet.com/games/1671995554666-2fba59cf-2cb7-48bf-b619-ba56269e90ca.jpg',
    providerBadge: 'https://cdn.zabbet.com/providers/set/1_1_badge/jl.png',
  },
  {
    name: 'Mahjong Ways',
    user: '098XXXX709',
    wins: '864',
    image: 'https://cdn.zabbet.com/games/pgslot/vertical/mahjong_ways.jpg',
    providerBadge: 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png',
  },
] as const;

const RANK_IMAGES = [V47_ASSETS.rank1, V47_ASSETS.rank2, V47_ASSETS.rank3] as const;

export default function DesktopLeaderboardSource() {
  const pathname = usePathname();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(null);

    const resolveHost = () => {
      const nextHost = document.querySelector<HTMLElement>('.desktop-reference-home .reference-leaderboard');
      if (nextHost) setHost(nextHost);
      return Boolean(nextHost);
    };

    if (resolveHost()) return undefined;

    const observer = new MutationObserver(() => {
      if (resolveHost()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  if (!host) return null;

  return createPortal(
    <div className="source-leaderboard-root">
      <div className="source-leaderboard__header">
        <span className="source-leaderboard__title">
          <img src={V47_ASSETS.leaderboard} alt="" aria-hidden="true" />
          <strong>Leaderboard</strong>
        </span>
        <button type="button" className="source-leaderboard__info" aria-label="ข้อมูล Leaderboard">
          <InfoIcon />
        </button>
      </div>

      <div className="source-leaderboard__table-wrap">
        <table className="source-leaderboard__table">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>Game/Jackpot</th>
              <th aria-label="ผู้ให้บริการ" />
              <th aria-label="เข้าเล่น" />
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((item, index) => (
              <tr key={`${item.name}-${item.user}`}>
                <td><Rank index={index} /></td>
                <td>
                  <div className="source-leaderboard__game">
                    <img className="source-leaderboard__cover" src={item.image} alt={item.name} loading="lazy" onError={hideBrokenImage} />
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.user}</small>
                      <small>ชนะ <b>{item.wins}</b></small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="source-leaderboard__provider">
                    {item.providerBadge ? <img src={item.providerBadge} alt="" loading="lazy" onError={hideBrokenImage} /> : null}
                  </span>
                </td>
                <td>
                  <a className="source-leaderboard__play" href="/browse/games" aria-label={`เข้าเล่น ${item.name}`}>
                    <PlayIcon />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>,
    host,
  );
}

function Rank({ index }: { index: number }) {
  const image = RANK_IMAGES[index];
  return (
    <span className={`source-leaderboard__rank source-leaderboard__rank--${index + 1}`}>
      {image ? <img src={image} alt="" aria-hidden="true" onError={hideBrokenImage} /> : null}
      <b>{index + 1}</b>
    </span>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 18 19" aria-hidden="true">
      <path d="M8.025 13.974h1.744V8.74H8.025v5.234Zm.872-6.978a.845.845 0 0 0 .622-.252.84.84 0 0 0 .25-.62.848.848 0 0 0-.25-.622.842.842 0 0 0-.622-.25.842.842 0 0 0-.621.25.848.848 0 0 0-.251.621c0 .247.083.454.251.622a.838.838 0 0 0 .621.25Zm0 11.34a8.49 8.49 0 0 1-3.402-.688 8.821 8.821 0 0 1-2.77-1.864 8.789 8.789 0 0 1-1.863-2.77 8.513 8.513 0 0 1-.688-3.401c0-1.207.229-2.34.688-3.402a8.828 8.828 0 0 1 1.864-2.77 8.796 8.796 0 0 1 2.77-1.864A8.497 8.497 0 0 1 8.896.89c1.206 0 2.34.229 3.402.687a8.795 8.795 0 0 1 2.77 1.864 8.84 8.84 0 0 1 1.864 2.77 8.442 8.442 0 0 1 .687 3.402 8.552 8.552 0 0 1-.688 3.401 8.749 8.749 0 0 1-1.864 2.77 8.86 8.86 0 0 1-2.769 1.865 8.45 8.45 0 0 1-3.402.686Zm0-1.745c1.948 0 3.598-.676 4.95-2.028 1.352-1.352 2.028-3.002 2.028-4.95 0-1.949-.676-3.599-2.028-4.95-1.352-1.353-3.002-2.029-4.95-2.029-1.948 0-3.598.676-4.95 2.028-1.352 1.352-2.028 3.002-2.028 4.95 0 1.949.676 3.599 2.028 4.95 1.352 1.353 3.002 2.029 4.95 2.029Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 21" aria-hidden="true">
      <path className="source-leaderboard__play-bg" d="M2 3.773C2 2.117 3.343.773 5 .773h14c1.657 0 3 1.344 3 3v14c0 1.657-1.343 3-3 3H5c-1.657 0-3-1.343-3-3v-14Z" />
      <path className="source-leaderboard__play-triangle" d="m16 10.773-6 3.465V7.309l6 3.464Z" />
    </svg>
  );
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.visibility = 'hidden';
}
