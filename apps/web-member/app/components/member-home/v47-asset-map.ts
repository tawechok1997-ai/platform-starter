import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS, REFERENCE_ICON_SPRITE } from '../reference-asset-catalog';

export const V47_ASSETS = {
  headerLogo: REFERENCE_HOME_ASSETS.logo,
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: REFERENCE_ICON_SPRITE,
  menuHome: REFERENCE_ICON_SPRITE,
  menuPromotion: REFERENCE_ICON_SPRITE,
  menuActivity: REFERENCE_ICON_SPRITE,
  menuNews: REFERENCE_ICON_SPRITE,
  menuLive: REFERENCE_ICON_SPRITE,
  menuBonus: REFERENCE_ICON_SPRITE,
  menuCasino: REFERENCE_ICON_SPRITE,
  menuSlot: REFERENCE_ICON_SPRITE,
  menuFishing: REFERENCE_ICON_SPRITE,
  menuSport: REFERENCE_ICON_SPRITE,
  menuCard: REFERENCE_ICON_SPRITE,
  menuLottery: REFERENCE_ICON_SPRITE,
  heroSide: REFERENCE_HOME_ASSETS.sidePromotion,
  heroWinners: REFERENCE_HERO_SLIDES[0]!.url,
  heroLogin: REFERENCE_HERO_SLIDES[1]!.url,
  heroNews: REFERENCE_HERO_SLIDES[2]!.url,
  quickPromotion: '/clone-assets/shortcut-promo.webp',
  quickActivity: '/clone-assets/shortcut-event.webp',
  quickNews: '/clone-assets/shortcut-news.webp',
  announcement: REFERENCE_ICON_SPRITE,
  tournament: REFERENCE_HOME_ASSETS.tournament,
  jackpot: REFERENCE_HOME_ASSETS.jackpot,
  live: REFERENCE_ICON_SPRITE,
  miniGameWheel: REFERENCE_ICON_SPRITE,
  miniGameMission: REFERENCE_ICON_SPRITE,
  mobilePopular: REFERENCE_ICON_SPRITE,
  mobileFaq: REFERENCE_ICON_SPRITE,
  rankTop3: REFERENCE_HOME_ASSETS.rankTop3,
  rankOther: REFERENCE_HOME_ASSETS.rankOther,
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  return primary && primary.trim() ? primary : V47_ASSETS[fallback];
}
