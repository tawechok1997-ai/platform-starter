import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS, REFERENCE_ICON_SPRITE } from '../reference-asset-catalog';

const MENU_ROOT = '/assets/reference-brand/menu';

export const V47_ASSETS = {
  headerLogo: '/reference-v6/logo.webp',
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: REFERENCE_ICON_SPRITE,
  menuHome: `${MENU_ROOT}/home.png`,
  menuPromotion: '/clone-assets/shortcut-promo.webp',
  menuActivity: '/clone-assets/shortcut-event.webp',
  menuNews: '/clone-assets/shortcut-news.webp',
  menuLive: `${MENU_ROOT}/live.png`,
  menuBonus: REFERENCE_ICON_SPRITE,
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
  announcement: REFERENCE_ICON_SPRITE,
  tournament: '/reference-v6/tournament.webp',
  jackpot: REFERENCE_HOME_ASSETS.jackpot,
  leaderboard: REFERENCE_HOME_ASSETS.leaderboard,
  live: REFERENCE_HOME_ASSETS.liveBackground,
  liveIcon: `${MENU_ROOT}/live.png`,
  dailyMission: REFERENCE_ICON_SPRITE,
  miniGameWheel: REFERENCE_ICON_SPRITE,
  miniGameMission: REFERENCE_ICON_SPRITE,
  openGold: REFERENCE_ICON_SPRITE,
  gameHit: REFERENCE_ICON_SPRITE,
  mostOnline: REFERENCE_ICON_SPRITE,
  coin: REFERENCE_ICON_SPRITE,
  star: REFERENCE_ICON_SPRITE,
  rank1: REFERENCE_HOME_ASSETS.rank1,
  rank2: REFERENCE_HOME_ASSETS.rank2,
  rank3: REFERENCE_HOME_ASSETS.rank3,
  mobilePopular: REFERENCE_ICON_SPRITE,
  mobileFaq: REFERENCE_ICON_SPRITE,
  rankTop3: REFERENCE_HOME_ASSETS.rankTop3,
  rankOther: REFERENCE_HOME_ASSETS.rankOther,
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  return primary && primary.trim() ? primary : V47_ASSETS[fallback];
}
