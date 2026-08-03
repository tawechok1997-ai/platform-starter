export type ReferenceAsset = { name: string; url: string };
type ReferencePair = readonly [name: string, url: string];

function fromPairs(pairs: readonly ReferencePair[]): ReferenceAsset[] {
  return pairs.map(([name, url]) => ({ name, url }));
}

/** Kept for old pages only. New home components prefer named files or stable CDN fallbacks. */
export const REFERENCE_ICON_SPRITE = '/clone-assets/reference-icon-sprite.webp';

export const REFERENCE_HERO_SLIDES: ReferenceAsset[] = [
  { name: 'ผู้ชนะและรางวัล', url: '/assets/asset-pc/images/FEZX/imageslides/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg' },
  { name: 'เข้าสู่ระบบและรับสิทธิ์', url: '/assets/asset-pc/images/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg' },
  { name: 'ข่าวสารล่าสุด', url: '/assets/asset-pc/images/FEZX/imageslides/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg' },
];

const GAME_URLS = [
  '/assets/asset-pc/images/games/1667451216350-67ca671b-fac7-444c-9dff-c09d9524ee0e.png',
  '/assets/asset-pc/images/games/1667928508204-7c69c936-becb-4ed3-9371-6ddb13bf9202.png',
  '/assets/asset-pc/images/games/1667966480919-47d05318-41f4-4ac6-8410-66f1fb2ff6ba.jpg',
  '/assets/asset-pc/images/games/1669261283933-bdf90850-76d5-4d19-b35a-521613258f45.png',
  '/assets/asset-pc/images/games/1670387059235-83ad96bd-1709-4920-bf64-c2efb450d4d3.png',
  '/assets/asset-pc/images/games/1670595737720-4a51357f-9592-45bc-9223-78b674b217a4.png',
  '/assets/asset-pc/images/games/1670596360948-8b1915ee-c2d6-4fb0-b22c-0c7fb32b0117.png',
  '/assets/asset-pc/images/games/1670597130583-deb6f6a2-361d-4db5-82b7-9e80ac989fa3.png',
  '/assets/asset-pc/images/games/1670762806140-c77734fa-db11-4e7f-a2df-bf79d49d3034.png',
  '/assets/asset-pc/images/games/1670762884919-364a6e35-5fe4-41f9-8ce7-892e9e2ac9b6.png',
  '/assets/asset-pc/images/games/1670768496011-19d616c5-7433-444f-9a85-3be1f646b0ea.png',
  '/assets/asset-pc/images/games/1670776487213-6ed41e8e-89a2-47e4-be4d-302ee517c643.png',
  '/assets/asset-pc/images/games/1671503437258-6858b67e-74b0-4f92-a2c1-0baa9b8ce8a5.png',
  '/assets/asset-pc/images/games/1671509206276-e82fd2f2-1486-47dd-8191-1d459a8ffc41.png',
  '/assets/asset-pc/images/games/1671517863554-e1d59079-f6b7-4a2a-859f-197d48246f0c.png',
  '/assets/asset-pc/images/games/1671994315928-172db1ee-1be1-41c6-acd9-cc769efedad3.jpg',
  '/assets/asset-pc/images/games/1671994444194-d735dfdb-19c3-49dc-acda-a5130a1e3f44.jpg',
  '/assets/asset-pc/images/games/1671994502814-033d1aac-0e0b-45bc-9303-d526c0693505.jpg',
  '/assets/asset-pc/images/games/1671994673825-206c020f-0ba3-4786-8f23-6cc68ecf6e99.jpg',
  '/assets/asset-pc/images/games/1671994735565-2aff6cc0-0eaf-4317-8a2d-24207a8c23ad.jpg',
  '/assets/asset-pc/images/games/1671994860832-bba5ef07-bb15-494c-a193-fa6c50d3ac54.jpg',
  '/assets/asset-pc/images/games/1671994886397-c7725f74-3996-42c6-8be6-b1d9ef7e4cf4.jpg',
] as const;

const GAME_NAMES = [
  'Caishen Wins', 'Maya Golden City', 'Roma X', 'El Paso', 'Sweet Bonanza Xmas', 'Roma Joker',
  'Golden Empire', 'Thai Hi Lo', 'Bushido Ways', 'Fortune Gems', 'Alice Run', 'Penalty Series',
  'Fortune Rabbit', 'Lucky Gold', 'Dragon Hatch', 'Cherry 777', 'Wild Bandito', 'C-Play',
  'Grand Spin', 'Royal Fishing', 'Ways of the Qilin', 'Sweet Bonanza',
] as const;

export const REFERENCE_GAMES: ReferenceAsset[] = GAME_URLS.map((url, index) => ({
  name: GAME_NAMES[index] ?? `Game ${index + 1}`,
  url,
}));

export const REFERENCE_PROVIDERS = fromPairs([
  ['CQ9', '/assets/asset-pc/images/providers/set/1_1_badge/cq.png'],
  ['Evolution', '/assets/asset-pc/images/providers/set/1_1_badge/evp.png'],
  ['Fa Chai', '/assets/asset-pc/images/providers/set/1_1_badge/fachai.png'],
  ['JILI', '/assets/asset-pc/images/providers/set/1_1_badge/jl.png'],
  ['Joker', '/assets/asset-pc/images/providers/set/1_1_badge/jkgx2.png'],
  ['Kingmaker', '/assets/asset-pc/images/providers/set/1_1_badge/kingm.png'],
  ['NoLimit City', '/assets/asset-pc/images/providers/set/1_1_badge/nlc.png'],
  ['PG Soft', '/assets/asset-pc/images/providers/set/1_1_badge/pgsoft.png'],
  ['Pragmatic Play', '/assets/asset-pc/images/providers/set/1_1_badge/pp.png'],
  ['PlayStar', '/assets/asset-pc/images/providers/set/1_1_badge/ps.png'],
  ['Red Tiger', '/assets/asset-pc/images/providers/set/1_1_badge/rsg.png'],
  ['YGR', '/assets/asset-pc/images/providers/set/1_1_badge/ygr.png'],
] as const);

export const REFERENCE_BANKS = fromPairs([
  ['BAAC', '/assets/asset-pc/images/banks/TH/BAAC.webp'],
  ['BAY', '/assets/asset-pc/images/banks/TH/BAY.webp'],
  ['BBL', '/assets/asset-pc/images/banks/TH/BBL.webp'],
  ['CIMBT', '/assets/asset-pc/images/banks/TH/CIMBT.webp'],
  ['EXIM', '/assets/asset-pc/images/banks/TH/EXIM.webp'],
  ['GHB', '/assets/asset-pc/images/banks/TH/GHB.webp'],
  ['GSB', '/assets/asset-pc/images/banks/TH/GSB.webp'],
  ['KBANK', '/assets/asset-pc/images/banks/TH/KBANK.webp'],
  ['KKP', '/assets/asset-pc/images/banks/TH/KKP.webp'],
  ['KTB', '/assets/asset-pc/images/banks/TH/KTB.webp'],
  ['LHFG', '/assets/asset-pc/images/banks/TH/LHFG.webp'],
  ['SCB', '/assets/asset-pc/images/banks/TH/SCB.webp'],
  ['TCD', '/assets/asset-pc/images/banks/TH/TCD.webp'],
  ['TISCO', '/assets/asset-pc/images/banks/TH/TISCO.webp'],
  ['TMN', '/assets/asset-pc/images/banks/TH/TMN.webp'],
  ['TTB', '/assets/asset-pc/images/banks/TH/TTB.webp'],
  ['UOBT', '/assets/asset-pc/images/banks/TH/UOBT.webp'],
] as const);

export const REFERENCE_TRUST_BADGES = fromPairs([
  ['BMM', '/assets/asset-pc/images/footer/BBM-Cert.webp'],
  ['Game Care', '/assets/asset-pc/images/footer/gamecare.webp'],
  ['Gaming Labs', '/assets/asset-pc/images/footer/GamingLab.webp'],
  ['GC', '/assets/asset-pc/images/footer/GC-icon%202.webp'],
  ['GoDaddy', '/assets/asset-pc/images/footer/GO%20DADDY.webp'],
  ['Group', '/assets/asset-pc/images/footer/Group%2048102721.webp'],
  ['Iovation', '/assets/asset-pc/images/footer/Iovation.webp'],
  ['iTech Labs', '/assets/asset-pc/images/footer/iTech.webp'],
] as const);

export const REFERENCE_HOME_ASSETS = {
  logo: '/reference-v6/logo.webp',
  sidePromotion: '/assets/asset-pc/images/FEZX/lobby_settings/26b4660d-776c-4bc4-ac49-21077498ae8d.jpg',
  jackpot: '/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25_220.gif',
  jackpotStill: '/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25_220.gif',
  leaderboard: '/assets/asset-pc/images/home/leader-board.svg',
  tournament: '/assets/asset-pc/images/home/tournament.svg',
  tournamentBanner: '/assets/asset-pc/images/ZAB1/tournament/4a7df032-03f5-4999-ba59-f38d12c13761.png',
  liveBackground: '/assets/asset-pc/images/home/live1.webp',
  fire: '/assets/asset-pc/images/game/fire.webp',
  line: '/assets/asset-pc/images/line.png',
  rank1: '/assets/asset-pc/images/LeaderBoard/rank1.webp',
  rank2: '/assets/asset-pc/images/LeaderBoard/rank2.webp',
  rank3: '/assets/asset-pc/images/LeaderBoard/rank3.webp',
  rankTop3: '/assets/asset-moblie/images/predict/mobile/rankBadgeTop3.svg',
  rankOther: '/assets/asset-moblie/images/predict/mobile/rankBadgeOther.svg',
} as const;
