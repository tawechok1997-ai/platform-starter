'use client';

import { useEffect, useState, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';

type FeedMounts = {
  popular: HTMLElement | null;
  online: HTMLElement | null;
  live: HTMLElement | null;
};

type PopularItem = {
  name: string;
  imageUrl: string;
  providerLogo: string;
  badge: 'HOT' | 'NEW' | '';
};

type OnlineItem = {
  imageUrl: string;
  players: number;
};

type LiveItem = {
  league: string;
  time: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
};

const POPULAR_ITEMS: PopularItem[] = [
  {"name": "ROMA X 10000", "imageUrl": "https://cdn.zabbet.com/games/1755656755936-62320722-2f7a-4710-9e52-f598c9406a93.jpeg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/jl.png", "badge": "HOT"},
  {"name": "Maya Golden City 2", "imageUrl": "https://cdn.zabbet.com/games/1704871891426-d938a4ec-5a3c-475f-a1d0-c410e0b30782.jpg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/ygr.png", "badge": "HOT"},
  {"name": "El Paso Gunfight xNudge", "imageUrl": "https://cdn.zabbet.com/games/NLC/elpaso0000000000.jpg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/nlc.png", "badge": "NEW"},
  {"name": "Sweet Bonanza Xmas", "imageUrl": "https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/pp.png", "badge": "NEW"},
  {"name": "Roma", "imageUrl": "https://cdn.zabbet.com/games/1684776659135-399a7654-b556-4a24-885d-3946c7322fb9.jpg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/rsg.png", "badge": "NEW"},
  {"name": "TREASURES OF AZTEC Z", "imageUrl": "https://cdn.zabbet.com/games/1692882357754-c47b8426-4045-4792-8ee3-58b784ed9a78.jpg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/ps.png", "badge": "NEW"},
  {"name": "ไฮโลไทย 2", "imageUrl": "https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png", "badge": "NEW"},
  {"name": "Starlight Princess", "imageUrl": "https://cdn.zabbet.com/games/vertical/PP/starlight_princess.png", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/pp.png", "badge": "NEW"},
  {"name": "Coin Spinner", "imageUrl": "https://cdn.zabbet.com/games/vertical/CQ/coin_spinner.jpg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/cq.png", "badge": "NEW"},
  {"name": "Fortune Gems", "imageUrl": "https://cdn.zabbet.com/games/1671995554666-2fba59cf-2cb7-48bf-b619-ba56269e90ca.jpg", "providerLogo": "https://cdn.zabbet.com/providers/set/1_1_badge/jl.png", "badge": "NEW"}
];

const ONLINE_ITEMS: OnlineItem[] = [
  {"imageUrl": "https://cdn.zabbet.com/_INIT/highlight/1731332886257-a7188fa9-8abc-4e47-9ea5-cfd777cb1abe.webp", "players": 3947},
  {"imageUrl": "https://cdn.zabbet.com/FEZX/highlight/1729314673983-77cc8959-5e30-4372-96a5-75df61251087.jpeg", "players": 2979},
  {"imageUrl": "https://cdn.zabbet.com/FEZX/highlight/1729314682179-2f2cd5b6-cadd-4e83-850d-a6f9f2eb68a6.jpeg", "players": 2201},
  {"imageUrl": "https://cdn.zabbet.com/FEZX/highlight/1729314708585-cf6d4f54-740b-437c-8c68-eeb335650199.jpeg", "players": 5004},
  {"imageUrl": "https://cdn.zabbet.com/FEZX/highlight/1729314712283-8e9a06f9-6d2e-42fd-b096-a8f400df89dc.jpeg", "players": 2112},
  {"imageUrl": "https://cdn.zabbet.com/FEZX/highlight/1731504909009-3b869385-72bb-4d54-a1c5-7a99313b5409.png", "players": 1925}
];

const LIVE_ITEMS: LiveItem[] = [
  {"league": "เดนมาร์ก - ซูเปอร์ลีกา", "time": "Jul 28, 00:00", "home": "แรนเดอร์ส", "away": "ซิลเคบอร์ก", "homeLogo": "https://googlecdn.live/teams/610.png", "awayLogo": "https://googlecdn.live/teams/609.png"},
  {"league": "นอร์เวย์ - ทิปเปลีเก้น", "time": "Jul 28, 00:00", "home": "โรเซนบอร์ก", "away": "เฟรดริคสตัด", "homeLogo": "https://googlecdn.live/teams/1587.png", "awayLogo": "https://googlecdn.live/teams/2481.png"},
  {"league": "นอร์เวย์ - โอบอสลีเก้น", "time": "Jul 28, 00:00", "home": "สตาเบ็ค", "away": "ฮ็อดด์", "homeLogo": "https://googlecdn.live/teams/1593.png", "awayLogo": "https://googlecdn.live/teams/1608.png"},
  {"league": "โปแลนด์ - เอ็คสตราคลาซ่า", "time": "Jul 28, 00:00", "home": "ซาเกลบี้ ลูบิน", "away": "เพียสท์ กลิวิเซ่", "homeLogo": "https://googlecdn.live/teams/1663.png", "awayLogo": "https://googlecdn.live/teams/1673.png"},
  {"league": "โปแลนด์ - ลีกา 1", "time": "Jul 28, 00:00", "home": "มีดซ์ เล็กนิซ่า", "away": "ป็อดเบสคิดเซีย", "homeLogo": "https://googlecdn.live/teams/6940.png", "awayLogo": "https://googlecdn.live/teams/1667.png"},
  {"league": "รัสเซีย - เนชั่นแนลลีก", "time": "Jul 28, 00:00", "home": "คามาซ", "away": "โรเตอร์ โวลโกกราด", "homeLogo": "https://googlecdn.live/teams/1861.png", "awayLogo": "https://googlecdn.live/teams/13206.png"},
  {"league": "สวีเดน - อัลสเวนส์คาน", "time": "Jul 28, 00:00", "home": "ฮัคเค่น", "away": "เอไอเค โซลน่า", "homeLogo": "https://googlecdn.live/teams/2398.png", "awayLogo": "https://googlecdn.live/teams/2153.png"},
  {"league": "สวีเดน - ซูเปอร์เร็ตเท่น", "time": "Jul 28, 00:00", "home": "โอเรโบร", "away": "อ็อดเดโวลด์", "homeLogo": "https://googlecdn.live/teams/2156.png", "awayLogo": "https://googlecdn.live/teams/2402.png"},
  {"league": "สวีเดน - ซูเปอร์เร็ตเท่น", "time": "Jul 28, 00:05", "home": "วาร์เบิร์ก", "away": "ออสเตอร์", "homeLogo": "https://googlecdn.live/teams/7809.png", "awayLogo": "https://googlecdn.live/teams/2165.png"},
  {"league": "ฮังการี - เอ็นบี ไอ", "time": "Jul 28, 00:30", "home": "เอ็มทีเค บูดาเปสต์", "away": "ซาเลเกอร์สเซ็ก ทีอี", "homeLogo": "https://googlecdn.live/teams/1104.png", "awayLogo": "https://googlecdn.live/teams/1109.png"},
  {"league": "ไอซ์แลนด์ - อูร์วัลส์เดลด์", "time": "Jul 28, 01:00", "home": "ไบรดาบลิค", "away": "ไอบี เวสต์มันนาเอย่า", "homeLogo": "https://googlecdn.live/teams/1142.png", "awayLogo": "https://googlecdn.live/teams/1133.png"},
  {"league": "แอฟริกา - แอฟริกัน เนชั่นส์ คัพ หญิง", "time": "Jul 28, 01:00", "home": "แอฟริกาใต้", "away": "แทนซาเนีย", "homeLogo": "https://googlecdn.live/teams/2014.png", "awayLogo": "https://googlecdn.live/teams/2206.png"},
  {"league": "บัลแกเรีย - เอ พีเอฟจี", "time": "Jul 28, 01:15", "home": "ซีเอสเคเอ โซเฟีย", "away": "โบเตฟ พลอฟดิฟ", "homeLogo": "https://googlecdn.live/teams/354.png", "awayLogo": "https://googlecdn.live/teams/16355.png"},
  {"league": "โรมาเนีย - ลีกา 1", "time": "Jul 28, 01:30", "home": "โบโตซานี่", "away": "ราปิด บูคาเรสต์", "homeLogo": "https://googlecdn.live/teams/3243.png", "awayLogo": "https://googlecdn.live/teams/1777.png"},
  {"league": "โบลิเวีย - แอลเอฟพีบี", "time": "Jul 28, 02:00", "home": "ซาน โฮเซ่", "away": "Universitario de Vinto", "homeLogo": "https://googlecdn.live/teams/292.png", "awayLogo": "https://googlecdn.live/teams/40332.png"},
  {"league": "เอกวาดอร์ - เซเรีย อา", "time": "Jul 28, 02:00", "home": "มูชุค รูน่า", "away": "Libertad", "homeLogo": "https://googlecdn.live/teams/21111.png", "awayLogo": "https://googlecdn.live/teams/44459.png"},
  {"league": "ไอซ์แลนด์ - อูร์วัลส์เดลด์", "time": "Jul 28, 02:15", "home": "เคเอ อคูเรย์รี่", "away": "Thor Akureyri", "homeLogo": "https://googlecdn.live/teams/1134.png", "awayLogo": "https://googlecdn.live/teams/uploads/logo-none.png"}
];

const EMPTY_MOUNTS: FeedMounts = { popular: null, online: null, live: null };

export default function MemberSourceFeedSections() {
  const pathname = usePathname();
  const { isLoggedIn } = useMemberSession();
  const [mounts, setMounts] = useState<FeedMounts>(EMPTY_MOUNTS);

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/home') {
      setMounts(EMPTY_MOUNTS);
      return;
    }

    const targets = {
      popular: document.querySelector<HTMLElement>('[data-section-kind="popular"]'),
      online: document.querySelector<HTMLElement>('[data-section-kind="online"]'),
      live: document.querySelector<HTMLElement>('[data-section-kind="live"]'),
    };

    const created: HTMLElement[] = [];
    const next: FeedMounts = { popular: null, online: null, live: null };

    (Object.keys(targets) as Array<keyof FeedMounts>).forEach((key) => {
      const host = targets[key];
      if (!host) return;
      host.classList.add('source-feed-host', `source-feed-host--${key}`);
      const mount = document.createElement('div');
      mount.className = `member-source-feed-mount member-source-feed-mount--${key}`;
      host.appendChild(mount);
      created.push(mount);
      next[key] = mount;
    });

    setMounts(next);

    return () => {
      created.forEach((mount) => {
        const host = mount.parentElement;
        mount.remove();
        host?.classList.remove('source-feed-host');
        host?.classList.remove('source-feed-host--popular', 'source-feed-host--online', 'source-feed-host--live');
      });
      setMounts(EMPTY_MOUNTS);
    };
  }, [pathname]);

  const openMemberAction = () => {
    if (isLoggedIn) {
      window.location.assign('/browse/games?category=sport');
      return;
    }

    const loginButton = document.querySelector<HTMLButtonElement>(
      '.public-auth-controls .member-guest-action--login, .public-auth-controls button:first-of-type, button.member-guest-action--login',
    );

    loginButton?.click();
  };

  return (
    <>
      {mounts.popular ? createPortal(<SourcePopularSection />, mounts.popular) : null}
      {mounts.online ? createPortal(<SourceOnlineSection />, mounts.online) : null}
      {mounts.live ? createPortal(<SourceLiveSection onAction={openMemberAction} />, mounts.live) : null}
    </>
  );
}

function SourceHeading({ title, icon, iconSize = 25 }: { title: string; icon: string; iconSize?: number }) {
  return (
    <header className="source-feed-heading">
      <span className="source-feed-heading__content">
        <img src={icon} alt="" aria-hidden="true" width={iconSize} height={iconSize} onError={hideBrokenImage} />
        <strong>{title}</strong>
      </span>
    </header>
  );
}

function SourcePopularSection() {
  return (
    <div className="source-feed-section source-popular-section">
      <SourceHeading title="Top 10 Popular Games" icon="/images/highlight/icongamehit.webp" iconSize={24} />
      <div className="source-popular-track" data-drag-scroll="true">
        {POPULAR_ITEMS.map((item, index) => (
          <a key={`${item.name}-${index}`} className="source-popular-card" href="/browse/games" target="_blank" rel="noreferrer" title={item.name}>
            <span className="source-popular-card__art">
              <img className="source-popular-card__blur" src={item.imageUrl} alt="" aria-hidden="true" onError={hideBrokenImage} />
              <img className="source-popular-card__image" src={item.imageUrl} alt={item.name} onError={hideBrokenImage} />
              <span className="source-popular-card__provider"><img src={item.providerLogo} alt="" aria-hidden="true" onError={hideBrokenImage} /></span>
              {item.badge ? <span className={`source-popular-card__badge source-popular-card__badge--${item.badge.toLowerCase()}`}>{item.badge}</span> : null}
            </span>
            <span className="source-popular-card__name">{item.name}</span>
            <span className="source-popular-card__rank" aria-hidden="true">{index + 1}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function SourceOnlineSection() {
  return (
    <div className="source-feed-section source-online-section">
      <SourceHeading title="Most Online Now" icon="/images/home/mostonline1.webp" />
      <div className="source-online-track" data-drag-scroll="true">
        {ONLINE_ITEMS.map((item, index) => (
          <a key={`${item.imageUrl}-${index}`} className="source-online-card" href="/browse/games" target="_blank" rel="noreferrer">
            <span className="source-online-card__art"><img src={item.imageUrl} alt={`เกมออนไลน์อันดับ ${index + 1}`} onError={hideBrokenImage} /></span>
            <span className="source-online-card__counter"><span className="source-online-card__counter-inner"><UserIcon /><strong>{item.players.toLocaleString('en-US')}</strong></span></span>
          </a>
        ))}
      </div>
    </div>
  );
}

function SourceLiveSection({ onAction }: { onAction: () => void }) {
  return (
    <div className="source-feed-section source-live-section">
      <SourceHeading title="Live Now!!" icon="/images/home/live1.webp" />
      <div className="source-live-track" data-drag-scroll="true">
        {LIVE_ITEMS.map((match, index) => (
          <article key={`${match.league}-${index}`} className="source-live-card">
            <div className="source-live-card__inner">
              <div className="source-live-card__glow" aria-hidden="true" />
              <div className="source-live-card__content">
                <header className="source-live-card__header">
                  <span className="source-live-card__league"><SoccerIcon /><span>{match.league}</span></span>
                  <span className="source-live-card__status"><b>LIVE</b><time>{match.time}</time></span>
                </header>
                <div className="source-live-card__teams"><Team logo={match.homeLogo} name={match.home} /><strong>VS</strong><Team logo={match.awayLogo} name={match.away} /></div>
                <footer className="source-live-card__actions">
                  <button type="button" className="source-live-card__watch" onClick={onAction}><LiveIcon /><span>ดูถ่ายทอดสด</span></button>
                  <button type="button" className="source-live-card__bet" onClick={onAction}>เดิมพันทันที</button>
                </footer>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Team({ logo, name }: { logo: string; name: string }) {
  return <span className="source-live-team"><span className="source-live-team__logo"><img src={logo} alt="" aria-hidden="true" onError={hideBrokenImage} /></span><span title={name}>{name}</span></span>;
}

function UserIcon() {
  return <svg width="12" height="16" viewBox="0 0 12 16" fill="none" aria-hidden="true"><path d="M6 7.41a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666Z" fill="#944fe8" fillOpacity=".86" /><path d="M0 14.805a6 6 0 0 1 12 0 .6.6 0 0 1-.6.606H.6a.6.6 0 0 1-.6-.606Z" fill="#944fe8" fillOpacity=".86" /></svg>;
}

function SoccerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.5" /><path d="m12 7 3 2.2-1.15 3.5h-3.7L9 9.2 12 7Zm-3 2.2-3.5.4m8.35 3.1 2.2 3.05M10.15 12.7l-2.2 3.05m.05 0-1.25 2.7m9.3-2.7 1.2 2.7" stroke="white" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}

function LiveIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="white" /><path d="M3.4 3.4a6.5 6.5 0 0 0 0 9.2M12.6 3.4a6.5 6.5 0 0 1 0 9.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function hideBrokenImage(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.style.display = 'none';
}
