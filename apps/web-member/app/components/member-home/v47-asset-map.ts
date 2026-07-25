import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS } from '../reference-asset-catalog';

const HOME_ASSET = '/home-asset';
const MENU_ROOT = '/assets/reference-brand/menu';
const SOURCE_CDN = 'https://cdn.zabbet.com/FEZX';

export const V47_ASSETS = {
  headerLogo: '/reference-v6/logo.webp',
  headerFlag: '/v47-assets/header/th.svg',
  headerMission: `${HOME_ASSET}/mission.webp`,
  menuHome: `${MENU_ROOT}/home.png`,
  menuPromotion: '/clone-assets/shortcut-promo.webp',
  menuActivity: '/clone-assets/shortcut-event.webp',
  menuNews: '/clone-assets/shortcut-news.webp',
  menuLive: `${MENU_ROOT}/live.png`,
  menuBonus: `${HOME_ASSET}/icon-open-gold.webp`,
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
  announcement: `${HOME_ASSET}/coin.webp`,
  tournament: `${HOME_ASSET}/tournament.png`,
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
