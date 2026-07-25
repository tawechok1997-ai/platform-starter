import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS } from '../reference-asset-catalog';

const SOURCE_IMAGE = 'https://noah345.shop/images';
const MENU_ROOT = '/assets/reference-brand/menu';
const SOURCE_CDN = 'https://cdn.zabbet.com/FEZX';

export const V47_ASSETS = {
  headerLogo: '/reference-v6/logo.webp',
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: `${SOURCE_IMAGE}/navbar/mission.webp`,
  menuHome: `${MENU_ROOT}/home.png`,
  menuPromotion: '/clone-assets/shortcut-promo.webp',
  menuActivity: '/clone-assets/shortcut-event.webp',
  menuNews: '/clone-assets/shortcut-news.webp',
  menuLive: `${MENU_ROOT}/live.png`,
  menuBonus: `${SOURCE_IMAGE}/home/icon-open-gold.webp`,
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
  promoBackgroundPromotion: `${SOURCE_CDN}/lobby_settings/cc956ae5-4906-4190-8ee4-84a840a525eb.png`,
  promoBackgroundActivity: `${SOURCE_CDN}/lobby_settings/3e57c423-07f9-4334-80a9-43ebb2040871.png`,
  promoBackgroundNews: `${SOURCE_CDN}/lobby_settings/87c8770e-e158-4491-b511-5e1e271ac486.png`,
  announcement: `${SOURCE_IMAGE}/home/coin.webp`,
  tournament: '/reference-v6/tournament.webp',
  tournamentIcon: `${SOURCE_IMAGE}/home/tournament.svg`,
  jackpot: '/clone-assets/jackpot.webp',
  jackpotStill: '/clone-assets/jackpot.webp',
  leaderboard: `${SOURCE_IMAGE}/home/leader-board.svg`,
  live: `${SOURCE_IMAGE}/home/background_live.webp`,
  liveIcon: `${MENU_ROOT}/live.png`,
  dailyMission: `${SOURCE_IMAGE}/home/icon-dailymission-dt.webp`,
  miniGameWheel: `${SOURCE_IMAGE}/home/icon-luckywheel-dt.webp`,
  miniGameMission: `${SOURCE_IMAGE}/home/icon-dailymission-dt.webp`,
  miniGame: '/clone-assets/mini-game.webp',
  openGold: '/clone-assets/mini-game.webp',
  gameHit: `${SOURCE_IMAGE}/home/icongamehit.webp`,
  mostOnline: `${SOURCE_IMAGE}/home/mostonline1.webp`,
  coin: `${SOURCE_IMAGE}/home/coin.webp`,
  fire: `${SOURCE_IMAGE}/game/fire.webp`,
  star: `${SOURCE_IMAGE}/home/star.webp`,
  line: REFERENCE_HOME_ASSETS.line,
  rank1: REFERENCE_HOME_ASSETS.rank1,
  rank2: REFERENCE_HOME_ASSETS.rank2,
  rank3: REFERENCE_HOME_ASSETS.rank3,
  mobilePopular: `${SOURCE_IMAGE}/home/icongamehit.webp`,
  mobileFaq: '/clone-assets/mini-game.webp',
  rankTop3: REFERENCE_HOME_ASSETS.rankTop3,
  rankOther: REFERENCE_HOME_ASSETS.rankOther,
  fallbackHeroSlides: REFERENCE_HERO_SLIDES,
  fallbackHomeAssets: REFERENCE_HOME_ASSETS,
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  const fallbackValue = V47_ASSETS[fallback];
  return primary && primary.trim() ? primary : typeof fallbackValue === 'string' ? fallbackValue : '';
}
