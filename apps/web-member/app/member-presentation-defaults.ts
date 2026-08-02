import type {
  CmsAnnouncement,
  CmsAsset,
  CmsContent,
  PromotionCampaign,
} from './site-settings';
import { V47_ASSETS } from './components/member-home/v47-asset-map';
import type {
  MemberLeaderboardEntry,
  MemberMiniGameRuntime,
} from './member-runtime-contract';
import type {
  MemberTournamentRuntime,
} from './member-home-data-runtime';

export const PRESENTATION_DEMO_FLAG = 'presentation_demo_enabled';

const HERO_ROOT = '/assets/asset-pc/images/FEZX/imageslides';

export const PRESENTATION_TOURNAMENTS: MemberTournamentRuntime[] = [
  {
    id: 'noah-championship-weekend',
    title: 'NOAH Championship Weekend',
    status: 'กำลังแข่งขัน',
    href: '/browse/tournaments#noah-championship-weekend',
    players: [
      { rank: 1, name: 'NOA***874', score: 26840, stats: [48, 31, 9, 5, 2, 1] },
      { rank: 2, name: 'NOA***219', score: 24450, stats: [44, 29, 8, 4, 2, 1] },
      { rank: 3, name: 'NOA***562', score: 22120, stats: [41, 26, 8, 4, 2, 1] },
      { rank: 4, name: 'NOA***105', score: 19880, stats: [38, 24, 7, 4, 2, 1] },
      { rank: 5, name: 'NOA***731', score: 17640, stats: [35, 22, 6, 4, 2, 1] },
    ],
  },
  {
    id: 'slot-master-series',
    title: 'Slot Master Series',
    status: 'เปิดรับสมัคร',
    href: '/browse/tournaments#slot-master-series',
    players: [
      { rank: 1, name: 'NOA***448', score: 15850, stats: [31, 20, 6, 3, 1, 1] },
      { rank: 2, name: 'NOA***993', score: 14200, stats: [29, 18, 6, 3, 1, 1] },
      { rank: 3, name: 'NOA***307', score: 12750, stats: [27, 17, 5, 3, 1, 1] },
    ],
  },
];

export const PRESENTATION_LEADERBOARD: MemberLeaderboardEntry[] = [
  { rank: 1, name: 'Fortune Gems 3', user: 'NOA***874', amount: '฿268,400', image: '' },
  { rank: 2, name: 'Mahjong Ways 2', user: 'NOA***219', amount: '฿244,500', image: '' },
  { rank: 3, name: 'Super Ace', user: 'NOA***562', amount: '฿221,200', image: '' },
  { rank: 4, name: 'Wild Bounty Showdown', user: 'NOA***105', amount: '฿198,800', image: '' },
  { rank: 5, name: 'Lucky Neko', user: 'NOA***731', amount: '฿176,400', image: '' },
];

export const PRESENTATION_MINI_GAMES: MemberMiniGameRuntime[] = [
  {
    id: 'daily-mission',
    title: 'ภารกิจประจำวัน',
    subtitle: 'ทำภารกิจและสะสมรางวัลทุกวัน',
    href: '/mobile/member/guide',
    image: V47_ASSETS.dailyMission,
    enabled: true,
  },
  {
    id: 'lucky-wheel',
    title: 'วงล้อนำโชค',
    subtitle: 'รับสิทธิ์หมุนจากกิจกรรมและยอดเล่น',
    href: '/?auth=login',
    image: V47_ASSETS.miniGameWheel,
    enabled: true,
  },
];

export const PRESENTATION_LIVE_MATCHES = [
  {
    id: 'live-premier-01',
    league: 'Premier League',
    time: 'คืนนี้ 21:00',
    home: 'Manchester Blue',
    away: 'London Red',
    homeLogo: '',
    awayLogo: '',
    watchHref: '/mobile/member/live',
    playHref: '/browse/games?category=sport',
  },
];

export const PRESENTATION_CMS_ASSETS: CmsAsset[] = [
  asset('member.ui.home', 'ไอคอนหน้าหลัก', V47_ASSETS.menuHome, 'ui icon home shared pc mobile'),
  asset('member.ui.casino', 'ไอคอนคาสิโน', V47_ASSETS.menuCasino, 'ui icon casino shared pc mobile'),
  asset('member.ui.slot', 'ไอคอนสล็อต', V47_ASSETS.menuSlot, 'ui icon slot games shared pc mobile'),
  asset('member.ui.fishing', 'ไอคอนยิงปลา', V47_ASSETS.menuFishing, 'ui icon fishing fish shared pc mobile'),
  asset('member.ui.sport', 'ไอคอนกีฬา', V47_ASSETS.menuSport, 'ui icon sport shared pc mobile'),
  asset('member.ui.card', 'ไอคอนไพ่', V47_ASSETS.menuCard, 'ui icon card table shared pc mobile'),
  asset('member.ui.lottery', 'ไอคอนหวย', V47_ASSETS.menuLottery, 'ui icon lottery lotto shared pc mobile'),
  asset('member.ui.live', 'ไอคอนถ่ายทอดสด', V47_ASSETS.menuLive, 'ui icon live shared pc mobile'),
  asset('member.ui.mission', 'ไอคอนภารกิจ', V47_ASSETS.headerMission, 'ui icon mission shared pc mobile'),
  asset('member.ui.announcement', 'ไอคอนประกาศ', V47_ASSETS.announcement, 'ui icon announcement shared pc mobile'),
  asset('member.ui.promotion', 'ไอคอนโปรโมชั่น', V47_ASSETS.quickPromotion, 'ui icon promotion bonus shared pc mobile'),
  asset('member.ui.activity', 'ไอคอนกิจกรรม', V47_ASSETS.quickActivity, 'ui icon activity event shared pc mobile'),
  asset('member.ui.news', 'ไอคอนข่าวสาร', V47_ASSETS.quickNews, 'ui icon news notification shared pc mobile'),
  asset('member.ui.tournament', 'ไอคอน Tournament', V47_ASSETS.tournamentIcon, 'ui icon tournament competition shared pc mobile'),
  asset('member.ui.jackpot', 'ไอคอน Jackpot', V47_ASSETS.jackpotIcon, 'ui icon jackpot shared pc mobile'),
  asset('member.ui.leaderboard', 'ไอคอน Leaderboard', V47_ASSETS.leaderboard, 'ui icon leaderboard rank shared pc mobile'),
  asset('member.ui.popular', 'ไอคอนเกมยอดนิยม', V47_ASSETS.gameHit, 'ui icon popular games hot shared pc mobile'),
  asset('member.ui.online', 'ไอคอนเกมออนไลน์', V47_ASSETS.mostOnline, 'ui icon online games shared pc mobile'),
  asset('member.ui.classic', 'ไอคอนเกมคลาสสิก', V47_ASSETS.classicIcon, 'ui icon classic games shared pc mobile'),
  asset('member.presentation.tournament', 'ภาพ Tournament', V47_ASSETS.tournament, 'presentation tournament competition shared pc mobile'),
  asset('member.presentation.jackpot', 'ภาพ Jackpot', V47_ASSETS.jackpot, 'presentation jackpot shared pc mobile'),
  asset('member.presentation.promotion.welcome', 'โปรโมชั่นสมาชิกใหม่', `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`, 'promotion welcome shared pc mobile'),
  asset('member.presentation.promotion.cashback', 'โปรโมชั่นคืนยอดเสีย', `${HERO_ROOT}/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg`, 'promotion cashback shared pc mobile'),
  asset('member.presentation.promotion.referral', 'โปรโมชั่นแนะนำเพื่อน', `${HERO_ROOT}/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg`, 'promotion referral shared pc mobile'),
];

export const PRESENTATION_CMS_ANNOUNCEMENTS: CmsAnnouncement[] = [
  {
    id: 'presentation-promotion-welcome',
    kind: 'promotion',
    title: 'โบนัสต้อนรับสมาชิกใหม่',
    message: 'รับโบนัสเพิ่มตามยอดฝากแรก พร้อมเกมแนะนำสำหรับสมาชิกใหม่',
    href: '/mobile/member/promotions',
    enabled: true,
    lifecycle: 'published',
    imageUrl: `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`,
    desktopImageUrl: `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`,
    mobileImageUrl: `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`,
    assetId: 'member.presentation.promotion.welcome',
    desktopAssetId: 'member.presentation.promotion.welcome',
    mobileAssetId: 'member.presentation.promotion.welcome',
  },
  {
    id: 'presentation-activity-tournament',
    kind: 'event',
    title: 'NOAH Championship Weekend',
    message: 'ร่วมแข่งขันสะสมคะแนนและติดอันดับ Leaderboard ประจำสัปดาห์',
    href: '/browse/tournaments',
    enabled: true,
    lifecycle: 'published',
    imageUrl: V47_ASSETS.tournament,
    desktopImageUrl: V47_ASSETS.tournament,
    mobileImageUrl: V47_ASSETS.tournament,
    assetId: 'member.presentation.tournament',
    desktopAssetId: 'member.presentation.tournament',
    mobileAssetId: 'member.presentation.tournament',
  },
  {
    id: 'presentation-news-new-games',
    kind: 'news',
    title: 'อัปเดตเกมใหม่และค่ายยอดนิยม',
    message: 'รวมเกมใหม่ เกมฮิต และค่ายที่กำลังได้รับความนิยมไว้ในหน้าเดียว',
    href: '/mobile/member/news',
    enabled: true,
    lifecycle: 'published',
    imageUrl: V47_ASSETS.quickNews,
    desktopImageUrl: V47_ASSETS.quickNews,
    mobileImageUrl: V47_ASSETS.quickNews,
    assetId: 'member.ui.news',
    desktopAssetId: 'member.ui.news',
    mobileAssetId: 'member.ui.news',
  },
];

export const PRESENTATION_PROMOTION_CAMPAIGNS: PromotionCampaign[] = [
  {
    id: 'presentation-welcome-bonus',
    title: 'โบนัสต้อนรับสมาชิกใหม่',
    description: 'รับโบนัสเพิ่ม 100% สำหรับยอดฝากแรกตามเงื่อนไขที่กำหนด',
    enabled: true,
    lifecycle: 'published',
    bonusType: 'percent',
    bonusValue: 100,
    minDeposit: 100,
    maxBonus: 3000,
    turnoverMultiplier: 5,
    claimMode: 'manual_review',
    imageUrl: `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`,
    desktopImageUrl: `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`,
    mobileImageUrl: `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`,
    desktopAssetId: 'member.presentation.promotion.welcome',
    mobileAssetId: 'member.presentation.promotion.welcome',
    badgeText: 'WELCOME',
    accentColor: '#f5c542',
    href: '/mobile/member/promotions',
    priority: 100,
  },
  {
    id: 'presentation-daily-cashback',
    title: 'คืนยอดเสียรายวัน',
    description: 'รับ Cashback รายวันตามยอดเล่นและเงื่อนไขของแต่ละหมวดเกม',
    enabled: true,
    lifecycle: 'published',
    bonusType: 'percent',
    bonusValue: 5,
    minDeposit: 0,
    maxBonus: 5000,
    turnoverMultiplier: 1,
    claimMode: 'auto_pending',
    imageUrl: `${HERO_ROOT}/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg`,
    desktopImageUrl: `${HERO_ROOT}/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg`,
    mobileImageUrl: `${HERO_ROOT}/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg`,
    desktopAssetId: 'member.presentation.promotion.cashback',
    mobileAssetId: 'member.presentation.promotion.cashback',
    badgeText: 'CASHBACK',
    accentColor: '#7c3aed',
    href: '/mobile/member/promotions',
    priority: 90,
  },
  {
    id: 'presentation-referral-reward',
    title: 'แนะนำเพื่อนรับรางวัล',
    description: 'แชร์ลิงก์แนะนำเพื่อนและรับรางวัลเมื่อเพื่อนทำตามเงื่อนไข',
    enabled: true,
    lifecycle: 'published',
    bonusType: 'fixed',
    bonusValue: 100,
    minDeposit: 100,
    maxBonus: 100,
    turnoverMultiplier: 1,
    claimMode: 'manual_review',
    imageUrl: `${HERO_ROOT}/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg`,
    desktopImageUrl: `${HERO_ROOT}/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg`,
    mobileImageUrl: `${HERO_ROOT}/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg`,
    desktopAssetId: 'member.presentation.promotion.referral',
    mobileAssetId: 'member.presentation.promotion.referral',
    badgeText: 'REFERRAL',
    accentColor: '#22c55e',
    href: '/?auth=login',
    priority: 80,
  },
];

export function presentationDemoEnabled(features: Record<string, unknown>) {
  return features[PRESENTATION_DEMO_FLAG] !== false;
}

export function mergePresentationCmsContent(content: CmsContent): CmsContent {
  return {
    ...content,
    assets: mergeById(PRESENTATION_CMS_ASSETS, content.assets),
    announcements: mergeById(PRESENTATION_CMS_ANNOUNCEMENTS, content.announcements),
    faqs: content.faqs.length > 0 ? content.faqs : [
      { id: 'presentation-faq-deposit', question: 'ฝากเงินใช้เวลานานไหม', answer: 'ระบบจะแสดงสถานะรายการและแจ้งเตือนเมื่อการตรวจสอบเสร็จสิ้น', enabled: true, lifecycle: 'published' },
      { id: 'presentation-faq-game', question: 'กดเกมแล้วเข้าไม่ได้ต้องทำอย่างไร', answer: 'ตรวจสอบสถานะค่ายเกม แล้วติดต่อเจ้าหน้าที่พร้อมแจ้งชื่อเกมและเวลาที่พบปัญหา', enabled: true, lifecycle: 'published' },
      { id: 'presentation-faq-promotion', question: 'ตรวจสอบสิทธิ์โปรโมชั่นได้ที่ไหน', answer: 'เปิดหน้าโปรโมชั่นเพื่อดูเงื่อนไขและสถานะคำขอรับสิทธิ์', enabled: true, lifecycle: 'published' },
    ],
  };
}

export function mergePresentationPromotions(value: unknown): PromotionCampaign[] {
  const current = Array.isArray(value)
    ? value.filter((item): item is PromotionCampaign => Boolean(item && typeof item === 'object'))
    : [];
  return mergeById(PRESENTATION_PROMOTION_CAMPAIGNS, current);
}

function asset(id: string, name: string, url: string, tag: string): CmsAsset {
  return { id, name, url, type: 'image', tag, enabled: true, source: 'bundled' };
}

function mergeById<T extends { id?: string | undefined }>(fallback: readonly T[], current: readonly T[]) {
  const merged = new Map<string, T>();
  fallback.forEach((item, index) => merged.set(item.id || `fallback-${index}`, item));
  current.forEach((item, index) => merged.set(item.id || `current-${index}`, item));
  return Array.from(merged.values());
}
