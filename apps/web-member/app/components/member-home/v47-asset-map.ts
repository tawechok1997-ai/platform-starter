import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS } from '../reference-asset-catalog';

const MENU_ROOT = '/assets/reference-brand/menu';

export const V47_ASSETS = {
  headerLogo: REFERENCE_HOME_ASSETS.logo,
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: '/home-asset/mission.webp',
  menuHome: `${MENU_ROOT}/home.png`,
  menuPromotion: '/clone-assets/shortcut-promo.webp',
  menuActivity: '/clone-assets/shortcut-event.webp',
  menuNews: '/clone-assets/shortcut-news.webp',
  menuLive: `${MENU_ROOT}/live.png`,
  menuBonus: '/home-asset/icon-open-gold.webp',
  menuCasino: `${MENU_ROOT}/casino.png`,
  menuSlot: `${MENU_ROOT}/slot.png`,
  menuFishing: `${MENU_ROOT}/fishing.png`,
  menuSport: `${MENU_ROOT}/sport.png`,
  menuCard: `${MENU_ROOT}/card.png`,
  menuLottery: `${MENU_ROOT}/lottery.png`,
  heroSide: REFERENCE_HOME_ASSETS.sidePromotion,
  heroWinners: REFERENCE_HERO_SLIDES[0]!.url,
  heroLogin: REFERENCE_HERO_SLIDES[1]!.url,
  heroNews: REFERENCE_HERO_SLIDES[2]!.url,
  quickPromotion: '/clone-assets/shortcut-promo.webp',
  quickActivity: '/clone-assets/shortcut-event.webp',
  quickNews: '/clone-assets/shortcut-news.webp',
  announcement: '/home-asset/coin.webp',
  tournament: REFERENCE_HOME_ASSETS.tournament,
  jackpot: REFERENCE_HOME_ASSETS.jackpot,
  leaderboard: REFERENCE_HOME_ASSETS.leaderboard,
  live: REFERENCE_HOME_ASSETS.liveBackground,
  liveIcon: `${MENU_ROOT}/live.png`,
  dailyMission: '/home-asset/icon-dailymission.webp',
  miniGameWheel: '/home-asset/icon-luckywheel.webp',
  miniGameMission: '/home-asset/icon-dailymission.webp',
  openGold: '/home-asset/icon-open-gold.webp',
  gameHit: '/home-asset/icongamehit.webp',
  mostOnline: '/home-asset/mostonline1.webp',
  coin: '/home-asset/coin.webp',
  star: '/home-asset/star.webp',
  rank1: '/home-asset/rank1.webp',
  rank2: '/home-asset/rank2.webp',
  rank3: '/home-asset/rank3.webp',
  mobilePopular: '/home-asset/icongamehit.webp',
  mobileFaq: '/home-asset/icon-dailymission.webp',
  rankTop3: REFERENCE_HOME_ASSETS.rankTop3,
  rankOther: REFERENCE_HOME_ASSETS.rankOther,
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  return primary && primary.trim() ? primary : V47_ASSETS[fallback];
}
