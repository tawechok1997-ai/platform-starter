const IMAGE_ROOT = '/assets/asset-pc/images';
const HOME_ICON_ROOT = `${IMAGE_ROOT}/home`;
const MENU_ROOT = '/assets/reference-brand/menu';
const LOCAL_HERO_SLIDES = [
  { name: 'ผู้ชนะและรางวัล', url: `${IMAGE_ROOT}/FEZX/imageslides/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg` },
  { name: 'เข้าสู่ระบบและรับสิทธิ์', url: `${IMAGE_ROOT}/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg` },
  { name: 'ข่าวสารล่าสุด', url: `${IMAGE_ROOT}/FEZX/imageslides/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg` },
] as const;

const LOCAL_PROMO = {
  promotion: `${IMAGE_ROOT}/FEZX/lobby_settings/9d4a5498-3fd3-49fe-aca2-2fe6266bffdb.png`,
  activity: `${IMAGE_ROOT}/FEZX/lobby_settings/ba6e40e2-2ce7-4ae8-a0dc-344197a35625.png`,
  news: `${IMAGE_ROOT}/FEZX/lobby_settings/ced6a371-3b8f-409b-889f-71f4952cd4cb.png`,
  promotionBackground: `${IMAGE_ROOT}/FEZX/lobby_settings/cc956ae5-4906-4190-8ee4-84a840a525eb.png`,
  activityBackground: `${IMAGE_ROOT}/FEZX/lobby_settings/3e57c423-07f9-4334-80a9-43ebb2040871.png`,
  newsBackground: `${IMAGE_ROOT}/FEZX/lobby_settings/87c8770e-e158-4491-b511-5e1e271ac486.png`,
} as const;

const LOCAL_JACKPOT = `${IMAGE_ROOT}/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25_220.gif`;
const LOCAL_TOURNAMENT = `${IMAGE_ROOT}/ZAB1/tournament/4a7df032-03f5-4999-ba59-f38d12c13761.png`;

export const V47_ASSETS = {
  headerLogo: '/reference-v6/logo.webp',
  headerFlag: `${IMAGE_ROOT}/flags/th.svg`,
  headerMission: `${IMAGE_ROOT}/navbar/mission.webp`,
  menuHome: `${MENU_ROOT}/home.png`,
  menuPromotion: LOCAL_PROMO.promotion,
  menuActivity: LOCAL_PROMO.activity,
  menuNews: LOCAL_PROMO.news,
  menuLive: `${MENU_ROOT}/live.png`,
  menuBonus: `${IMAGE_ROOT}/footer/contact/icon-open-gold.webp`,
  menuCasino: `${MENU_ROOT}/casino.png`,
  menuSlot: `${MENU_ROOT}/slot.png`,
  menuFishing: `${MENU_ROOT}/fishing.png`,
  menuSport: `${MENU_ROOT}/sport.png`,
  menuCard: `${MENU_ROOT}/card.png`,
  menuLottery: `${MENU_ROOT}/lottery.png`,
  heroSide: `${IMAGE_ROOT}/FEZX/lobby_settings/26b4660d-776c-4bc4-ac49-21077498ae8d.jpg`,
  heroWinners: LOCAL_HERO_SLIDES[0].url,
  heroLogin: LOCAL_HERO_SLIDES[1].url,
  heroNews: LOCAL_HERO_SLIDES[2].url,
  quickPromotion: LOCAL_PROMO.promotion,
  quickActivity: LOCAL_PROMO.activity,
  quickNews: LOCAL_PROMO.news,
  promoBackgroundPromotion: LOCAL_PROMO.promotionBackground,
  promoBackgroundActivity: LOCAL_PROMO.activityBackground,
  promoBackgroundNews: LOCAL_PROMO.newsBackground,
  announcement: `${IMAGE_ROOT}/home/coin.webp`,
  tournament: LOCAL_TOURNAMENT,
  tournamentIcon: `${HOME_ICON_ROOT}/tournament.svg`,
  jackpot: LOCAL_JACKPOT,
  jackpotStill: LOCAL_JACKPOT,
  jackpotIcon: `${HOME_ICON_ROOT}/iconjackpot.webp`,
  leaderboard: `${HOME_ICON_ROOT}/leader-board.svg`,
  live: `${IMAGE_ROOT}/home/live1.webp`,
  liveIcon: `${HOME_ICON_ROOT}/live.svg`,
  dailyMission: `${IMAGE_ROOT}/mini_game/icon-dailymission-dt.webp`,
  miniGameWheel: `${IMAGE_ROOT}/mini_game/icon-luckywheel-dt.webp`,
  miniGameMission: `${IMAGE_ROOT}/mini_game/icon-dailymission-dt.webp`,
  miniGame: `${IMAGE_ROOT}/home/mini-game.webp`,
  openGold: `${IMAGE_ROOT}/footer/contact/icon-open-gold.webp`,
  gameHit: `${IMAGE_ROOT}/highlight/icongamehit.webp`,
  highlightIcon: `${HOME_ICON_ROOT}/icongamehighlight.webp`,
  classicIcon: `${HOME_ICON_ROOT}/icongameclassic.webp`,
  mostOnline: `${HOME_ICON_ROOT}/mostonline.svg`,
  coin: `${IMAGE_ROOT}/home/coin.webp`,
  fire: `${HOME_ICON_ROOT}/fire.svg`,
  star: `${HOME_ICON_ROOT}/icongamehighlight.webp`,
  line: `${IMAGE_ROOT}/line.png`,
  rank1: `${IMAGE_ROOT}/LeaderBoard/rank1.webp`,
  rank2: `${IMAGE_ROOT}/LeaderBoard/rank2.webp`,
  rank3: `${IMAGE_ROOT}/LeaderBoard/rank3.webp`,
  mobilePopular: `${HOME_ICON_ROOT}/fire.svg`,
  mobileFaq: `${HOME_ICON_ROOT}/iconguide.webp`,
  rankTop3: `${IMAGE_ROOT}/predict/mobile/rankBadgeTop3.svg`,
  rankOther: `${IMAGE_ROOT}/predict/mobile/rankBadgeOther.svg`,
  fallbackHeroSlides: LOCAL_HERO_SLIDES,
  fallbackHomeAssets: {
    logo: '/reference-v6/logo.webp',
    sidePromotion: `${IMAGE_ROOT}/FEZX/lobby_settings/26b4660d-776c-4bc4-ac49-21077498ae8d.jpg`,
    jackpot: LOCAL_JACKPOT,
    jackpotStill: LOCAL_JACKPOT,
    leaderboard: `${HOME_ICON_ROOT}/leader-board.svg`,
    tournament: `${HOME_ICON_ROOT}/tournament.svg`,
    tournamentBanner: LOCAL_TOURNAMENT,
    liveBackground: `${IMAGE_ROOT}/home/live1.webp`,
    fire: `${HOME_ICON_ROOT}/fire.svg`,
    line: `${IMAGE_ROOT}/line.png`,
    rank1: `${IMAGE_ROOT}/LeaderBoard/rank1.webp`,
    rank2: `${IMAGE_ROOT}/LeaderBoard/rank2.webp`,
    rank3: `${IMAGE_ROOT}/LeaderBoard/rank3.webp`,
    rankTop3: `${IMAGE_ROOT}/predict/mobile/rankBadgeTop3.svg`,
    rankOther: `${IMAGE_ROOT}/predict/mobile/rankBadgeOther.svg`,
  },
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  const fallbackValue = V47_ASSETS[fallback];
  return primary && primary.trim() ? primary : typeof fallbackValue === 'string' ? fallbackValue : '';
}
