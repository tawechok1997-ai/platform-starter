'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import styles from './live-page.module.css';

type SortMode = 'league' | 'time';

type LiveMatch = {
  home: string;
  away: string;
  time: string;
  sourceLive: boolean;
  homeLogo: string;
  awayLogo: string;
};

type LiveLeague = {
  league: string;
  date: string;
  matches: LiveMatch[];
};

const SOURCE_SCHEDULE: LiveLeague[] = [
  {
    "league": "ยุโรป - ยูฟ่า ยูโรปา ลีก",
    "date": "30 - 07 - 2026",
    "matches": [
      {
        "home": "มัคคาบี้ เทล อาวีฟ",
        "away": "เชริฟฟ์ ติราสปอล",
        "time": "23:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/1204.png",
        "awayLogo": "https://googlecdn.live/teams/1498.png"
      },
      {
        "home": "ฮราเดช คราโลเว่",
        "away": "ทรอมโซ่",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/556.png",
        "awayLogo": "https://googlecdn.live/teams/1585.png"
      },
      {
        "home": "มิดทิลแลนด์",
        "away": "เบซิคตัส",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/603.png",
        "awayLogo": "https://googlecdn.live/teams/2214.png"
      },
      {
        "home": "Paphos",
        "away": "ไฮจ์ดุ๊ก สปลิท",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/34232.png",
        "awayLogo": "https://googlecdn.live/teams/478.png"
      },
      {
        "home": "พีเอโอเค",
        "away": "ดินาโม เคียฟ",
        "time": "00:45",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/1041.png",
        "awayLogo": "https://googlecdn.live/teams/2253.png"
      },
      {
        "home": "ซีเอสเคเอ โซเฟีย",
        "away": "คาราบัค",
        "time": "01:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/354.png",
        "awayLogo": "https://googlecdn.live/teams/180.png"
      },
      {
        "home": "อันเดอร์เลชท์",
        "away": "ฮัมมาร์บี้",
        "time": "01:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/215.png",
        "awayLogo": "https://googlecdn.live/teams/2147.png"
      },
      {
        "home": "เฟเรนซ์วารอส",
        "away": "ทเวนเต้",
        "time": "01:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/1101.png",
        "awayLogo": "https://googlecdn.live/teams/8577.png"
      },
      {
        "home": "เบนฟิก้า",
        "away": "เซนต์ กัลเลน",
        "time": "02:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/1679.png",
        "awayLogo": "https://googlecdn.live/teams/2177.png"
      }
    ]
  },
  {
    "league": "อาร์เจนตินา - ปรีเมร่า ดิวิซิโอน",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "ตาเยเรส คอร์โดบา",
        "away": "เวเลซ ซาร์สฟิลด์",
        "time": "02:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/110.png",
        "awayLogo": "https://googlecdn.live/teams/111.png"
      },
      {
        "home": "อินเดเปนเดียนเต้ ริวาดาเวีย",
        "away": "อูราคาน",
        "time": "05:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/7060.png",
        "awayLogo": "https://googlecdn.live/teams/123.png"
      },
      {
        "home": "เซ็นทรัล คอร์โดบ้า",
        "away": "อัตเลติโก ตูคูมาน",
        "time": "07:15",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/7031.png",
        "awayLogo": "https://googlecdn.live/teams/7064.png"
      },
      {
        "home": "อินเดเปนเดียนเต้",
        "away": "นีเวลล์ส โอลด์ บอยส์",
        "time": "07:15",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/100.png",
        "awayLogo": "https://googlecdn.live/teams/102.png"
      }
    ]
  },
  {
    "league": "บราซิล - เซเรีย อา",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "โครินเธียนส์",
        "away": "อัตเลติโก ปาราเนนเซ่",
        "time": "05:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/320.png",
        "awayLogo": "https://googlecdn.live/teams/315.png"
      },
      {
        "home": "โคริติบา",
        "away": "ครูไซโร่",
        "time": "07:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/324.png",
        "awayLogo": "https://googlecdn.live/teams/304.png"
      }
    ]
  },
  {
    "league": "ฟินแลนด์ - ยัคโคเน่น",
    "date": "30 - 07 - 2026",
    "matches": [
      {
        "home": "ยิปโป้",
        "away": "ยาพีเอส",
        "time": "22:30",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/859.png",
        "awayLogo": "https://googlecdn.live/teams/2638.png"
      }
    ]
  },
  {
    "league": "อเมริกาใต้ - โคปา ซูดาเมริกาน่า",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "เกรมิโอ",
        "away": "โบลิวาร์",
        "time": "05:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/313.png",
        "awayLogo": "https://googlecdn.live/teams/291.png"
      },
      {
        "home": "คาราคัส",
        "away": "ซานตา เฟ่",
        "time": "07:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/2303.png",
        "awayLogo": "https://googlecdn.live/teams/469.png"
      },
      {
        "home": "อเมริกา เด กาลี",
        "away": "บาเฮีย",
        "time": "07:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/467.png",
        "awayLogo": "https://googlecdn.live/teams/305.png"
      }
    ]
  },
  {
    "league": "โลก - อุ่นเครื่องสโมสร",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "ซันเดอร์แลนด์",
        "away": "ลีดส์ ยูไนเต็ด",
        "time": "06:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/683.png",
        "awayLogo": "https://googlecdn.live/teams/681.png"
      }
    ]
  },
  {
    "league": "โคลอมเบีย - ลีกา อากีล่า",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "อัตเลติโก บูคารามังก้า",
        "away": "ยาเนรอส",
        "time": "08:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/466.png",
        "awayLogo": "https://googlecdn.live/teams/21661.png"
      }
    ]
  },
  {
    "league": "ปารากวัย - ปรีเมร่า ดิวิซิโอน",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "กัวรานี",
        "away": "นาซิอองนาล อซุนซิออง",
        "time": "07:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/474.png",
        "awayLogo": "https://googlecdn.live/teams/473.png"
      }
    ]
  },
  {
    "league": "ยุโรป - ยูฟ่า ยูโรปา คอนเฟอเรนซ์ ลีก",
    "date": "30 - 07 - 2026",
    "matches": [
      {
        "home": "เอชเจเค เฮลซิงกิ",
        "away": "ริกาส เอฟเอส",
        "time": "23:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/860.png",
        "awayLogo": "https://googlecdn.live/teams/8576.png"
      },
      {
        "home": "อารารัต อาร์เมเนีย",
        "away": "ยูนิเวอร์ซิตาเตีย คลูจ์",
        "time": "23:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/19506.png",
        "awayLogo": "https://googlecdn.live/teams/1842.png"
      },
      {
        "home": "เอฟซี โนอาห์",
        "away": "เคไอ คลากสวิก",
        "time": "23:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/21356.png",
        "awayLogo": "https://googlecdn.live/teams/10378.png"
      },
      {
        "home": "ซาบาห์",
        "away": "เซนต์ แพทริคส์",
        "time": "23:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/22986.png",
        "awayLogo": "https://googlecdn.live/teams/1018.png"
      },
      {
        "home": "อาริส ลิมาสซอล",
        "away": "ซิลเคบอร์ก",
        "time": "23:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/23956.png",
        "awayLogo": "https://googlecdn.live/teams/1317.png"
      },
      {
        "home": "เอฟซี โคเปนเฮเกน",
        "away": "เชลบอร์น",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/1308.png",
        "awayLogo": "https://googlecdn.live/teams/1016.png"
      },
      {
        "home": "เลช พอซนาน",
        "away": "เลฟสกี้ โซเฟีย",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/1961.png",
        "awayLogo": "https://googlecdn.live/teams/353.png"
      },
      {
        "home": "ดินาโม ทบิลิซี",
        "away": "สปาร์ตัก เทอร์นาวา",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/2541.png",
        "awayLogo": "https://googlecdn.live/teams/2719.png"
      },
      {
        "home": "บัลคานี",
        "away": "เดเบรเซน",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/23694.png",
        "awayLogo": "https://googlecdn.live/teams/2275.png"
      },
      {
        "home": "วาดุซ",
        "away": "เอสเจเค",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/2167.png",
        "awayLogo": "https://googlecdn.live/teams/870.png"
      },
      {
        "home": "เซลเย่",
        "away": "ไวกิงเกอร์ เรคยาวิก",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/2736.png",
        "awayLogo": "https://googlecdn.live/teams/891.png"
      },
      {
        "home": "เฟเฮร์วาร์",
        "away": "ออดด์",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/2268.png",
        "awayLogo": "https://googlecdn.live/teams/1590.png"
      },
      {
        "home": "ซาราเยโว",
        "away": "ออร์ดาบาซี่",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/2144.png",
        "awayLogo": "https://googlecdn.live/teams/3716.png"
      },
      {
        "home": "บานิค ออสตราวา",
        "away": "ฮาร์ทส์",
        "time": "00:00",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/556.png",
        "awayLogo": "https://googlecdn.live/teams/245.png"
      },
      {
        "home": "เออีเค เอเธนส์",
        "away": "โอลิมปิยา ลูบลิยานา",
        "time": "00:30",
        "sourceLive": true,
        "homeLogo": "https://googlecdn.live/teams/1038.png",
        "awayLogo": "https://googlecdn.live/teams/2735.png"
      },
      {
        "home": "มาริบอร์",
        "away": "คราโคเวีย คราคอฟ",
        "time": "01:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/2733.png",
        "awayLogo": "https://googlecdn.live/teams/1977.png"
      },
      {
        "home": "ออสเตรีย เวียนนา",
        "away": "โบรัค บันยา ลูก้า",
        "time": "01:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/1648.png",
        "awayLogo": "https://googlecdn.live/teams/2146.png"
      },
      {
        "home": "ยัง บอยส์",
        "away": "อูราร์ตู",
        "time": "01:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/2160.png",
        "awayLogo": "https://googlecdn.live/teams/19508.png"
      },
      {
        "home": "บรอนด์บี้",
        "away": "รากุฟ เชนสโตโควา",
        "time": "01:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/1309.png",
        "awayLogo": "https://googlecdn.live/teams/1982.png"
      },
      {
        "home": "โรเซนบอร์ก",
        "away": "อูจเปสต์",
        "time": "01:30",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/1579.png",
        "awayLogo": "https://googlecdn.live/teams/2274.png"
      },
      {
        "home": "เบซิคตัส",
        "away": "มิดทิลแลนด์",
        "time": "02:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/2214.png",
        "awayLogo": "https://googlecdn.live/teams/603.png"
      },
      {
        "home": "ฮิเบอร์เนียน",
        "away": "ซูริค",
        "time": "02:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/246.png",
        "awayLogo": "https://googlecdn.live/teams/2161.png"
      },
      {
        "home": "ลินฟิลด์",
        "away": "บราก้า",
        "time": "02:45",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/968.png",
        "awayLogo": "https://googlecdn.live/teams/1677.png"
      }
    ]
  },
  {
    "league": "ฟุตบอลหญิง ชิงแชมป์แห่งชาติแอฟริกา 2026",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "ไนจีเรีย (หญิง)",
        "away": "แอฟริกาใต้ (หญิง)",
        "time": "02:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/15048.png",
        "awayLogo": "https://googlecdn.live/teams/15051.png"
      },
      {
        "home": "โมร็อกโก (หญิง)",
        "away": "แซมเบีย (หญิง)",
        "time": "05:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/15052.png",
        "awayLogo": "https://googlecdn.live/teams/15055.png"
      }
    ]
  },
  {
    "league": "อเมริกาเหนือ/กลาง - คอนคาเคฟ แชมเปี้ยนส์ชิพ ยู-20",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "เม็กซิโก ยู-20",
        "away": "คอสตาริกา ยู-20",
        "time": "06:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/13818.png",
        "awayLogo": "https://googlecdn.live/teams/13816.png"
      },
      {
        "home": "สหรัฐอเมริกา ยู-20",
        "away": "ฮอนดูรัส ยู-20",
        "time": "09:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/13821.png",
        "awayLogo": "https://googlecdn.live/teams/13819.png"
      }
    ]
  },
  {
    "league": "อเมริกาเหนือ/กลาง - คอนคาเคฟ เซ็นทรัล อเมริกัน คัพ",
    "date": "31 - 07 - 2026",
    "matches": [
      {
        "home": "ซาปริสซ่า",
        "away": "โมตากัว",
        "time": "07:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/4938.png",
        "awayLogo": "https://googlecdn.live/teams/4781.png"
      },
      {
        "home": "โอลิมเปีย",
        "away": "เฮเรดิอาโน",
        "time": "09:00",
        "sourceLive": false,
        "homeLogo": "https://googlecdn.live/teams/4782.png",
        "awayLogo": "https://googlecdn.live/teams/4936.png"
      }
    ]
  }
];

export default function LivePage() {
  const [sortMode, setSortMode] = useState<SortMode>('league');
  const [notice, setNotice] = useState('');

  const groups = useMemo(() => {
    if (sortMode === 'league') return SOURCE_SCHEDULE;

    const byDate = new Map<string, Array<LiveMatch & { league: string }>>();
    SOURCE_SCHEDULE.forEach((group) => {
      const current = byDate.get(group.date) ?? [];
      current.push(...group.matches.map((match) => ({ ...match, league: group.league })));
      byDate.set(group.date, current);
    });

    return Array.from(byDate.entries()).map(([date, matches]) => ({
      league: 'ตารางตามเวลา',
      date,
      matches: matches.sort((left, right) => left.time.localeCompare(right.time)),
    }));
  }, [sortMode]);

  const openStream = (match: LiveMatch) => {
    setNotice(`ยังไม่มีลิงก์ถ่ายทอดสดสำหรับ ${match.home} พบ ${match.away} จากระบบผู้ให้บริการ`);
  };

  return (
    <main className={styles.page} data-live-page>
      <section className={styles.hero}>
        <img
          className={styles.heroLogo}
          src="/assets/asset-pc/images/live/logo_live.webp"
          alt="ถ่ายทอดสด"
        />
        <h1>ถ่ายทอดสด</h1>
      </section>

      <section className={styles.sportBar} aria-label="ประเภทกีฬา">
        <button type="button" className={styles.sportPill} aria-pressed="true">ฟุตบอล</button>
      </section>

      <section className={styles.sortBar} aria-label="เรียงรายการถ่ายทอดสด">
        <div className={styles.sortSwitch}>
          <button
            type="button"
            className={sortMode === 'time' ? styles.sortActive : ''}
            onClick={() => setSortMode('time')}
            aria-pressed={sortMode === 'time'}
          >
            เรียงเวลา
          </button>
          <button
            type="button"
            className={sortMode === 'league' ? styles.sortActive : ''}
            onClick={() => setSortMode('league')}
            aria-pressed={sortMode === 'league'}
          >
            เรียงลีก
          </button>
        </div>
      </section>

      {notice ? (
        <div className={styles.notice} role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="ปิดข้อความ">×</button>
        </div>
      ) : null}

      <div className={styles.schedule}>
        {groups.map((group) => (
          <section key={`${group.league}-${group.date}`} className={styles.league}>
            <header className={styles.leagueHeader}>
              <strong>{group.league}</strong>
              <time>{group.date}</time>
            </header>

            <div className={styles.matches}>
              {group.matches.map((match, index) => {
                const live = isCurrentlyLive(group.date, match.time, match.sourceLive);
                const leagueLabel = 'league' in match ? String(match.league) : '';
                return (
                  <article
                    key={`${group.league}-${match.home}-${match.away}-${index}`}
                    className={`${styles.match} ${index % 2 ? styles.matchAlt : ''}`}
                  >
                    <div className={styles.fixture}>
                      <div className={styles.teamHome}>
                        <span title={match.home}>{match.home}</span>
                        <img src={match.homeLogo} alt="" loading="lazy" />
                      </div>

                      <div className={styles.kickoff}>
                        {leagueLabel ? <small title={leagueLabel}>{leagueLabel}</small> : null}
                        <strong>{match.time}</strong>
                        {live ? <span className={styles.liveBadge}>LIVE</span> : null}
                      </div>

                      <div className={styles.teamAway}>
                        <img src={match.awayLogo} alt="" loading="lazy" />
                        <span title={match.away}>{match.away}</span>
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={live ? styles.watchLive : styles.watchUpcoming}
                        onClick={() => openStream(match)}
                      >
                        <span>ดูถ่ายทอดสด</span>
                        <PlayIcon live={live} />
                      </button>
                      {live ? (
                        <Link className={styles.betNow} href="/browse/games?category=sport">
                          <span>เดิมพันทันที</span>
                          <CoinIcon />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function isCurrentlyLive(dateText: string, timeText: string, sourceLive: boolean) {
  const match = /^(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{4})$/.exec(dateText);
  const time = /^(\d{2}):(\d{2})$/.exec(timeText);
  if (!match || !time) return sourceLive;

  const kickoff = new Date(
    Number(match[3]),
    Number(match[2]) - 1,
    Number(match[1]),
    Number(time[1]),
    Number(time[2]),
  ).getTime();
  const now = Date.now();
  return now >= kickoff && now <= kickoff + 2 * 60 * 60 * 1000;
}

function PlayIcon({ live }: { live: boolean }) {
  return live ? (
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="7" cy="7" r="6.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7" cy="7" r="3.2" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#ffee57" />
      <path d="M8.45 11.65v.8h-.9v-.78c-1.42-.2-2.05-1.35-2.05-1.35l.9-.74s.56.98 1.58.98c.56 0 .99-.3.99-.82 0-1.2-3.25-1.05-3.25-3.28 0-.97.77-1.67 1.83-1.84v-.9h.9v.9c.74.1 1.61.49 1.61 1.32v.64H8.91v-.31c0-.32-.41-.53-.87-.53-.58 0-1.01.29-1.01.7 0 1.23 3.25.93 3.25 3.27 0 .96-.72 1.8-1.83 1.94Z" fill="#ffcc4d" />
    </svg>
  );
}
