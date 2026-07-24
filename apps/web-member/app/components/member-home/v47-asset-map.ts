export const V47_ASSETS = {
  headerLogo: '/home-asset/logo.png',
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: '/home-asset/mission.png',
  menuHome: '/home-asset/home.png',
  menuPromotion: '/home-asset/promotion.png',
  menuActivity: '/home-asset/activity.png',
  menuNews: '/home-asset/news.png',
  menuLive: '/home-asset/live.png',
  menuBonus: '/home-asset/promotion.png',
  menuCasino: '/home-asset/casino.png',
  menuSlot: '/home-asset/slot.png',
  menuFishing: '/home-asset/fish.png',
  menuSport: '/home-asset/sport.png',
  menuCard: '/home-asset/card.png',
  menuLottery: '/home-asset/loto.png',
  heroSide: '/home-asset/promo-side.webp',
  heroWinners: '/home-asset/hero-winners.webp',
  heroLogin: '/home-asset/hero-login.webp',
  heroNews: '/home-asset/hero-news.webp',
  quickPromotion: '/clone-assets/shortcut-promo.webp',
  quickActivity: '/clone-assets/shortcut-event.webp',
  quickNews: '/clone-assets/shortcut-news.webp',
  announcement: '/home-asset/news.png',
  tournament: '/home-asset/tournament.webp',
  jackpot: '/clone-assets/jackpot.webp',
  live: '/v47-assets/live/logo_live.webp',
  miniGameWheel: '/clone-assets/mini-game.webp',
  miniGameMission: '/home-asset/icon-dailymission.webp',
  mobilePopular: '/v47-assets/mobile-latest/icongamehit.webp',
  mobileFaq: '/v47-assets/mobile-latest/faq1.webp',
  rankTop3: '/v47-assets/mobile-latest/rankBadgeTop3.svg',
  rankOther: '/v47-assets/mobile-latest/rankBadgeOther.svg',
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  return primary && primary.trim() ? primary : V47_ASSETS[fallback];
}
