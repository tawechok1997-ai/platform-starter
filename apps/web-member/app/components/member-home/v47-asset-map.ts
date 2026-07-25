import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS } from '../reference-asset-catalog';

const MENU_ROOT = '/assets/reference-brand/menu';
const HOME_REMOTE = 'https://noah345.shop/images/home';

export const V47_ASSETS = {
  headerLogo: '/reference-v6/logo.webp',
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: '/clone-assets/shortcut-promo.webp',
  menuHome: `${MENU_ROOT}/home.png`,
  menuPromotion: '/clone-assets/shortcut-promo.webp',
  menuActivity: '/clone-assets/shortcut-event.webp',
  menuNews: '/clone-assets/shortcut-news.webp',
  menuLive: `${MENU_ROOT}/live.png`,
  menuBonus: `${HOME_REMOTE}/icon-open-gold.webp`,
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
  announcement: `${HOME_REMOTE}/coin.webp`,
  tournament: REFERENCE_HOME_ASSETS.tournamentBanner,
  tournamentIcon: REFERENCE_HOME_ASSETS.tournament,
  jackpot: REFERENCE_HOME_ASSETS.jackpot,
  jackpotStill: REFERENCE_HOME_ASSETS.jackpotStill,
  leaderboard: REFERENCE_HOME_ASSETS.leaderboard,
  live: REFERENCE_HOME_ASSETS.liveBackground,
  liveIcon: `${MENU_ROOT}/live.png`,
  dailyMission: `${HOME_REMOTE}/icon-dailymission-dt.webp`,
  miniGameWheel: `${HOME_REMOTE}/icon-luckywheel-dt.webp`,
  miniGameMission: `${HOME_REMOTE}/icon-dailymission-dt.webp`,
  miniGame: '/clone-assets/mini-game.webp',
  openGold: `${HOME_REMOTE}/icon-open-gold.webp`,
  gameHit: `${HOME_REMOTE}/icongamehit.webp`,
  mostOnline: `${HOME_REMOTE}/mostonline1.webp`,
  coin: `${HOME_REMOTE}/coin.webp`,
  fire: REFERENCE_HOME_ASSETS.fire,
  star: `${HOME_REMOTE}/star.webp`,
  line: REFERENCE_HOME_ASSETS.line,
  rank1: REFERENCE_HOME_ASSETS.rank1,
  rank2: REFERENCE_HOME_ASSETS.rank2,
  rank3: REFERENCE_HOME_ASSETS.rank3,
  mobilePopular: `${HOME_REMOTE}/icongamehit.webp`,
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
