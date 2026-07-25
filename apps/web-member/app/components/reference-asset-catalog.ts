export type ReferenceAsset = { name: string; url: string };
type ReferencePair = readonly [name: string, url: string];

function fromPairs(pairs: readonly ReferencePair[]): ReferenceAsset[] {
  return pairs.map(([name, url]) => ({ name, url }));
}

const HOME_ASSET = '/home-asset';

/** Kept for old pages only. New home components use the named files below. */
export const REFERENCE_ICON_SPRITE = '/clone-assets/reference-icon-sprite.webp';

export const REFERENCE_HERO_SLIDES: ReferenceAsset[] = [
  { name: 'ผู้ชนะและรางวัล', url: `${HOME_ASSET}/hero-winners.jpg` },
  { name: 'เข้าสู่ระบบและรับสิทธิ์', url: `${HOME_ASSET}/hero-login.jpg` },
  { name: 'ข่าวสารล่าสุด', url: `${HOME_ASSET}/hero-news.jpg` },
];

const GAME_NAMES = [
  'Caishen Wins', 'Maya Golden City', 'Roma X', 'El Paso', 'Sweet Bonanza Xmas', 'Roma Joker',
  'Golden Empire', 'Thai Hi Lo', 'Bushido Ways', 'Fortune Gems', 'Alice Run', 'Penalty Series',
  'Fortune Rabbit', 'Lucky Gold', 'Dragon Hatch', 'Cherry 777', 'Wild Bandito', 'C-Play',
  'Grand Spin', 'Royal Fishing', 'Ways of the Qilin', 'Sweet Bonanza',
] as const;

export const REFERENCE_GAMES: ReferenceAsset[] = GAME_NAMES.map((name, index) => ({
  name,
  url: `${HOME_ASSET}/game-${String(index + 1).padStart(2, '0')}.webp`,
}));

export const REFERENCE_PROVIDERS = fromPairs([
  ['CQ9', `${HOME_ASSET}/provider-cq.png`],
  ['Evolution', `${HOME_ASSET}/provider-evp.png`],
  ['Fa Chai', `${HOME_ASSET}/provider-fachai.png`],
  ['JILI', `${HOME_ASSET}/provider-jili.png`],
  ['Joker', `${HOME_ASSET}/provider-joker.png`],
  ['Kingmaker', `${HOME_ASSET}/provider-kingm.png`],
  ['NoLimit City', `${HOME_ASSET}/provider-nlc.png`],
  ['PG Soft', `${HOME_ASSET}/provider-pg.png`],
  ['Pragmatic Play', `${HOME_ASSET}/provider-pp.png`],
  ['PlayStar', `${HOME_ASSET}/provider-ps.png`],
  ['Red Tiger', `${HOME_ASSET}/provider-rsg.png`],
  ['YGR', `${HOME_ASSET}/provider-ygr.png`],
] as const);

export const REFERENCE_BANKS = fromPairs([
  ['BAAC', `${HOME_ASSET}/bank-baac.webp`],
  ['BAY', `${HOME_ASSET}/bank-bay.webp`],
  ['BBL', `${HOME_ASSET}/bank-bbl.webp`],
  ['CIMBT', `${HOME_ASSET}/bank-cimbt.webp`],
  ['EXIM', `${HOME_ASSET}/bank-exim.webp`],
  ['GHB', `${HOME_ASSET}/bank-ghb.webp`],
  ['GSB', `${HOME_ASSET}/bank-gsb.webp`],
  ['KBANK', `${HOME_ASSET}/bank-kbank.webp`],
  ['KKP', `${HOME_ASSET}/bank-kkp.webp`],
  ['KTB', `${HOME_ASSET}/bank-ktb.webp`],
  ['LHFG', `${HOME_ASSET}/bank-lhfg.webp`],
  ['SCB', `${HOME_ASSET}/bank-scb.webp`],
  ['TCD', `${HOME_ASSET}/bank-tcd.webp`],
  ['TISCO', `${HOME_ASSET}/bank-tisco.webp`],
  ['TMN', `${HOME_ASSET}/bank-tmn.webp`],
  ['TTB', `${HOME_ASSET}/bank-ttb.webp`],
  ['UOBT', `${HOME_ASSET}/bank-uobt.webp`],
] as const);

export const REFERENCE_TRUST_BADGES = fromPairs([
  ['BMM', `${HOME_ASSET}/footer-bmm.webp`],
  ['Game Care', `${HOME_ASSET}/footer-gamecare.webp`],
  ['Gaming Labs', `${HOME_ASSET}/footer-gaminglab.webp`],
  ['GC', `${HOME_ASSET}/footer-gc.webp`],
  ['GoDaddy', `${HOME_ASSET}/footer-godaddy.webp`],
  ['Group', `${HOME_ASSET}/footer-group.webp`],
  ['Iovation', `${HOME_ASSET}/footer-iovation.webp`],
  ['iTech Labs', `${HOME_ASSET}/footer-itech.webp`],
] as const);

export const REFERENCE_HOME_ASSETS = {
  logo: `${HOME_ASSET}/logo.png`,
  sidePromotion: `${HOME_ASSET}/promo-side.jpg`,
  jackpot: `${HOME_ASSET}/jackpot.gif`,
  jackpotStill: `${HOME_ASSET}/jackpot.webp`,
  leaderboard: `${HOME_ASSET}/leader-board.svg`,
  tournament: `${HOME_ASSET}/tournament.svg`,
  tournamentBanner: `${HOME_ASSET}/tournament.png`,
  liveBackground: `${HOME_ASSET}/live-bg.webp`,
  fire: `${HOME_ASSET}/fire.webp`,
  line: `${HOME_ASSET}/line.png`,
  rank1: `${HOME_ASSET}/rank1.webp`,
  rank2: `${HOME_ASSET}/rank2.webp`,
  rank3: `${HOME_ASSET}/rank3.webp`,
  rankTop3: `${HOME_ASSET}/rankBadgeTop3.svg`,
  rankOther: `${HOME_ASSET}/rankBadgeOther.svg`,
} as const;
