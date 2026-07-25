import { REFERENCE_HERO_SLIDES, REFERENCE_HOME_ASSETS } from '../reference-asset-catalog';

const SOURCE_IMAGE = 'https://noah345.shop/images';
const SOURCE_CDN = 'https://cdn.zabbet.com/FEZX';
const MENU_ROOT = '/assets/reference-brand/menu';

export const V47_ASSETS = {
  headerLogo: `${SOURCE_CDN}/lobby_settings/9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7.png`,
  headerFlag: `${SOURCE_IMAGE}/flags/th.svg`,
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
  quickPromotion: `${SOURCE_CDN}/lobby_settings/9d4a5498-3fd3-49fe-aca2-2fe6266bffdb.png`,
  quickActivity: `${SOURCE_CDN}/lobby_settings/ba6e40e2-2ce7-4ae8-a0dc-344197a35625.png`,
  quickNews: `${SOURCE_CDN}/lobby_settings/ced6a371-3b8f-409b-889f-71f4952cd4cb.png`,
  promoBackgroundPromotion: `${SOURCE_CDN}/lobby_settings/cc956ae5-4906-4190-8ee4-84a840a525eb.png`,
  promoBackgroundActivity: `${SOURCE_CDN}/lobby_settings/3e57c423-07f9-4334-80a9-43ebb2040871.png`,
  promoBackgroundNews: `${SOURCE_CDN}/lobby_settings/87c8770e-e158-4491-b511-5e1e271ac486.png`,
  announcement: `${SOURCE_IMAGE}/home/coin.webp`,
  tournament: 'https://cdn.zabbet.com/ZAB1/tournament/647280b5-3a23-4118-80a0-1b7feb340d1a.png',
  tournamentIcon: `${SOURCE_IMAGE}/home/tournament.svg`,
  jackpot: `${SOURCE_CDN}/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif`,
  jackpotStill: `${SOURCE_CDN}/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif`,
  leaderboard: `${SOURCE_IMAGE}/home/leader-board.svg`,
  live: `${SOURCE_IMAGE}/home/background_live.webp`,
  liveIcon: `${SOURCE_IMAGE}/home/live1.webp`,
  dailyMission: `${SOURCE_IMAGE}/mini_game/icon-dailymission-dt.webp`,
  miniGameWheel: `${SOURCE_IMAGE}/mini_game/icon-luckywheel-dt.webp`,
  miniGameMission: `${SOURCE_IMAGE}/mini_game/icon-dailymission-dt.webp`,
  miniGame: `${SOURCE_IMAGE}/home/mini-game.webp`,
  openGold: `${SOURCE_IMAGE}/home/faq1.webp`,
  gameHit: `${SOURCE_IMAGE}/highlight/icongamehit.webp`,
  mostOnline: `${SOURCE_IMAGE}/home/mostonline1.webp`,
  coin: `${SOURCE_IMAGE}/home/coin.webp`,
  fire: `${SOURCE_IMAGE}/game/fire.webp`,
  star: `${SOURCE_IMAGE}/home/star.webp`,
  line: `${SOURCE_IMAGE}/line.png`,
  rank1: REFERENCE_HOME_ASSETS.rank1,
  rank2: REFERENCE_HOME_ASSETS.rank2,
  rank3: REFERENCE_HOME_ASSETS.rank3,
  mobilePopular: `${SOURCE_IMAGE}/highlight/icongamehit.webp`,
  mobileFaq: `${SOURCE_IMAGE}/home/faq1.webp`,
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
