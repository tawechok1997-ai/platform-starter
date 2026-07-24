export const V47_ASSETS = {
  headerLogo: '/v47-assets/header/noah345-logo.png',
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: '/v47-assets/mission.webp',
  menuHome: '/v47-assets/menu/หน้าเเรก.png',
  menuPromotion: '/v47-assets/menu/โปรโมชัน.png',
  menuActivity: '/v47-assets/menu/กิจกรรม.png',
  menuNews: '/v47-assets/menu/ข่าวสาร.png',
  menuLive: '/v47-assets/menu/ถ่ายทอดสด.png',
  menuBonus: '/v47-assets/menu/โบนัส.png',
  menuCasino: '/v47-assets/menu/คาสิโน.png',
  menuSlot: '/v47-assets/menu/สล็อต.png',
  menuFishing: '/v47-assets/menu/ตกปลา.png',
  menuSport: '/v47-assets/menu/กีฬา.png',
  menuCard: '/v47-assets/menu/ไพ่.png',
  menuLottery: '/v47-assets/menu/หวย.png',
  quickPromotion: '/v47-assets/home-source/promo-special.png',
  quickActivity: '/v47-assets/home-source/promo-activity.png',
  quickNews: '/v47-assets/home-source/promo-news.png',
  announcement: '/v47-assets/home-source/announcement-megaphone.png',
  tournament: '/v47-assets/home/tournament-banner-normalized.png',
  jackpot: '/v47-assets/home-source/jackpot.gif',
  live: '/v47-assets/live/logo_live.webp',
  miniGameWheel: '/v47-assets/home/mini-game-wheel.png',
  mobilePopular: '/v47-assets/mobile-latest/icongamehit.webp',
  mobileFaq: '/v47-assets/mobile-latest/faq1.webp',
  rankTop3: '/v47-assets/mobile-latest/rankBadgeTop3.svg',
  rankOther: '/v47-assets/mobile-latest/rankBadgeOther.svg',
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  return primary && primary.trim() ? primary : V47_ASSETS[fallback];
}
