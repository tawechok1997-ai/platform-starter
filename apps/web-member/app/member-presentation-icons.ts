import { V47_ASSETS } from './components/member-home/v47-asset-map';

/**
 * Shared icon defaults are used by both Desktop and Mobile. Admin settings can
 * override any key with a platform-specific asset later; until then one asset
 * is deliberately reused to keep the two surfaces consistent.
 */
export const PRESENTATION_ICON_DEFAULTS = {
  home: V47_ASSETS.menuHome,
  casino: V47_ASSETS.menuCasino,
  slot: V47_ASSETS.menuSlot,
  games: V47_ASSETS.menuSlot,
  fishing: V47_ASSETS.menuFishing,
  sport: V47_ASSETS.menuSport,
  card: V47_ASSETS.menuCard,
  lottery: V47_ASSETS.menuLottery,
  live: V47_ASSETS.menuLive,
  mission: V47_ASSETS.headerMission,
  announcement: V47_ASSETS.announcement,
  promotion: V47_ASSETS.quickPromotion,
  bonus: V47_ASSETS.quickPromotion,
  activity: V47_ASSETS.quickActivity,
  news: V47_ASSETS.quickNews,
  notification: V47_ASSETS.quickNews,
  tournament: V47_ASSETS.tournamentIcon,
  jackpot: V47_ASSETS.jackpotIcon,
  leaderboard: V47_ASSETS.leaderboard,
  mini_game: V47_ASSETS.miniGame,
  popular_games: V47_ASSETS.gameHit,
  online_games: V47_ASSETS.mostOnline,
  classic_games: V47_ASSETS.classicIcon,
  contact: V47_ASSETS.openGold,
  support: V47_ASSETS.openGold,
  close: '/images/close.svg',
} as const;
