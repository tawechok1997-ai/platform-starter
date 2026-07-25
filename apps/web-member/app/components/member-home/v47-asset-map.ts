import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS } from '../reference-asset-catalog';

const HOME_ASSET = '/home-asset';

export const V47_ASSETS = {
  headerLogo: '/reference-v6/logo.webp',
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: `${HOME_ASSET}/mission.webp`,
  menuHome: `${HOME_ASSET}/icon-home.png`,
  menuPromotion: `${HOME_ASSET}/promo-special.png`,
  menuActivity: `${HOME_ASSET}/promo-activity.png`,
  menuNews: `${HOME_ASSET}/promo-news.png`,
  menuLive: `${HOME_ASSET}/icon-live.png`,
  menuBonus: `${HOME_ASSET}/icon-open-gold.webp`,
  menuCasino: `${HOME_ASSET}/icon-casino.png`,
  menuSlot: `${HOME_ASSET}/icon-slot.png`,
  menuFishing: `${HOME_ASSET}/icon-fish.png`,
  menuSport: `${HOME_ASSET}/icon-sport.png`,
  menuCard: `${HOME_ASSET}/icon-card.png`,
  menuLottery: `${HOME_ASSET}/icon-lotto.png`,
  heroSide: `${HOME_ASSET}/promo-side.jpg`,
  heroWinners: `${HOME_ASSET}/hero-winners.jpg`,
  heroLogin: `${HOME_ASSET}/hero-login.jpg`,
  heroNews: `${HOME_ASSET}/hero-news.jpg`,
  quickPromotion: `${HOME_ASSET}/promo-special.png`,
  quickActivity: `${HOME_ASSET}/promo-activity.png`,
  quickNews: `${HOME_ASSET}/promo-news.png`,
  announcement: `${HOME_ASSET}/coin.webp`,
  tournament: '/reference-v6/tournament.webp',
  tournamentIcon: `${HOME_ASSET}/tournament.svg`,
  jackpot: `${HOME_ASSET}/jackpot.gif`,
  jackpotStill: `${HOME_ASSET}/jackpot.webp`,
  leaderboard: `${HOME_ASSET}/leader-board.svg`,
  live: `${HOME_ASSET}/live-bg.webp`,
  liveIcon: `${HOME_ASSET}/icon-live.png`,
  dailyMission: `${HOME_ASSET}/icon-dailymission-dt.webp`,
  miniGameWheel: `${HOME_ASSET}/icon-luckywheel-dt.webp`,
  miniGameMission: `${HOME_ASSET}/icon-dailymission-dt.webp`,
  miniGame: `${HOME_ASSET}/mini-game.webp`,
  openGold: `${HOME_ASSET}/icon-open-gold.webp`,
  gameHit: `${HOME_ASSET}/icongamehit.webp`,
  mostOnline: `${HOME_ASSET}/mostonline1.webp`,
  coin: `${HOME_ASSET}/coin.webp`,
  fire: `${HOME_ASSET}/fire.webp`,
  star: `${HOME_ASSET}/star.webp`,
  line: `${HOME_ASSET}/line.png`,
  rank1: `${HOME_ASSET}/rank1.webp`,
  rank2: `${HOME_ASSET}/rank2.webp`,
  rank3: `${HOME_ASSET}/rank3.webp`,
  mobilePopular: `${HOME_ASSET}/icongamehit.webp`,
  mobileFaq: `${HOME_ASSET}/mini-game.webp`,
  rankTop3: `${HOME_ASSET}/rankBadgeTop3.svg`,
  rankOther: `${HOME_ASSET}/rankBadgeOther.svg`,
  fallbackHeroSlides: REFERENCE_HERO_SLIDES,
  fallbackHomeAssets: REFERENCE_HOME_ASSETS,
} as const;

export type V47AssetKey = keyof typeof V47_ASSETS;

export function resolveV47Asset(primary: string | undefined, fallback: V47AssetKey) {
  const fallbackValue = V47_ASSETS[fallback];
  return primary && primary.trim() ? primary : typeof fallbackValue === 'string' ? fallbackValue : '';
}
