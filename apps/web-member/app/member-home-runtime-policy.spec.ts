import assert from 'node:assert/strict';
import test from 'node:test';
import type { TypedPublicSiteSettings } from './site-settings-types';
import type { MemberHomeContentRuntime } from './member-runtime-contract';
import type { MemberHomeDataRuntime } from './member-home-data-runtime';
import {
  applyMemberHomeContentPolicy,
  applyMemberHomeDataPolicy,
} from './member-home-runtime-policy';

const JACKPOT_ART = '/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25_220.gif';

const settings = {
  features: {
    quick_promotion_title: 'โปรโมชั่นพิเศษ',
    quick_promotion_summary: 'โปรโมชั่นพิเศษเฉพาะคุณ',
    quick_activity_title: 'กิจกรรม',
    quick_activity_summary: 'กิจกรรมตลอด 24 ชั่วโมง',
    quick_news_title: 'ข่าวสาร',
    quick_news_summary: 'ข่าวสารที่คุณไม่ควรพลาด',
    jackpot_title: 'Jackpot',
    jackpot_image_url: JACKPOT_ART,
    leaderboard_limit: 5,
    cms_content: {
      assets: [
        {
          id: 'member.ui.jackpot',
          name: 'ไอคอน Jackpot',
          type: 'image',
          url: '/assets/asset-pc/images/home/coin.webp',
          enabled: true,
        },
        {
          id: 'member.presentation.jackpot',
          name: 'ภาพ Jackpot',
          type: 'image',
          url: JACKPOT_ART,
          enabled: true,
        },
      ],
      announcements: [],
      banners: [],
      faqs: [],
      popup: { enabled: false },
    },
  },
} as unknown as TypedPublicSiteSettings;

const home = {
  quickActions: [
    quickAction('โบนัสต้อนรับสมาชิกใหม่', 'ข้อความโปรโมชั่นยาวจากประกาศ'),
    quickAction('NOAH Championship Weekend', 'ข้อความกิจกรรมยาวจากประกาศ'),
    quickAction('อัปเดตเกมใหม่และค่ายยอดนิยม', 'ข้อความข่าวยาวจากประกาศ'),
  ],
  jackpot: {
    title: 'JACKPOTS',
    amount: '198,270,683',
    subtitle: '',
    image: '/assets/asset-pc/images/home/coin.webp',
    icon: '/assets/asset-pc/images/home/coin.webp',
    enabled: true,
  },
} as unknown as MemberHomeContentRuntime;

function quickAction(title: string, summary: string) {
  return {
    id: title,
    title,
    summary,
    href: '/',
    image: '',
    icon: '',
    kind: 'promotion' as const,
    priority: 0,
    enabled: true,
  };
}

test('home content uses dedicated backend quick-action copy and the canonical jackpot art', () => {
  const result = applyMemberHomeContentPolicy(settings, home);

  assert.deepEqual(
    result.quickActions.map((item) => [item.title, item.summary]),
    [
      ['โปรโมชั่นพิเศษ', 'โปรโมชั่นพิเศษเฉพาะคุณ'],
      ['กิจกรรม', 'กิจกรรมตลอด 24 ชั่วโมง'],
      ['ข่าวสาร', 'ข่าวสารที่คุณไม่ควรพลาด'],
    ],
  );
  assert.equal(result.jackpot.title, 'Jackpot');
  assert.equal(result.jackpot.image, JACKPOT_ART);
  assert.match(result.jackpot.image, /_220\.gif$/);
  assert.doesNotMatch(result.jackpot.image, /coin\.webp|iconjackpot/i);
});

test('leaderboard keeps configured rows and fills from the shared mobile source', () => {
  const data = {
    tournaments: [],
    miniGames: [],
    leaderboard: [
      {
        rank: 1,
        name: 'Configured Game',
        user: 'NOA***001',
        amount: '9,999',
        image: '',
      },
    ],
  } satisfies MemberHomeDataRuntime;

  const result = applyMemberHomeDataPolicy(settings, data);

  assert.equal(result.leaderboard.length, 5);
  assert.deepEqual(
    result.leaderboard.map((item) => item.name),
    ['Configured Game', 'Fortune Tiger', 'ไฮโลไทย 2', 'Lalika', 'SBO'],
  );
  assert.equal(result.leaderboard[0]?.image, 'https://cdn.zabbet.com/providers/set/1_1_v/evt.png');
  assert.deepEqual(result.leaderboard.map((item) => item.rank), [1, 2, 3, 4, 5]);
});
