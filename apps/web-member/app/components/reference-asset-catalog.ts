export type ReferenceAsset = { name: string; url: string };

export const REFERENCE_ICON_SPRITE = '/clone-assets/reference-icon-sprite.webp';

export const REFERENCE_HERO_SLIDES: ReferenceAsset[] = [
  { name: 'ผู้ชนะและรางวัล', url: 'https://cdn.zabbet.com/FEZX/imageslides/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg' },
  { name: 'เข้าสู่ระบบและรับสิทธิ์', url: 'https://cdn.zabbet.com/FEZX/imageslides/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg' },
  { name: 'ข่าวสารล่าสุด', url: 'https://cdn.zabbet.com/FEZX/imageslides/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg' },
];

const GAME_URLS = [
  'https://cdn.zabbet.com/games/pgslot/vertical/caishen_wins.jpg',
  'https://cdn.zabbet.com/games/1704871891426-d938a4ec-5a3c-475f-a1d0-c410e0b30782.jpg',
  'https://cdn.zabbet.com/games/1755656755936-62320722-2f7a-4710-9e52-f598c9406a93.jpeg',
  'https://cdn.zabbet.com/games/NLC/elpaso0000000000.jpg',
  'https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png',
  'https://cdn.zabbet.com/games/1684776659135-399a7654-b556-4a24-885d-3946c7322fb9.jpg',
  'https://cdn.zabbet.com/games/1692882357754-c47b8426-4045-4792-8ee3-58b784ed9a78.jpg',
  'https://cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg',
  'https://cdn.zabbet.com/games/NLC/bushidoways00000.jpg',
  'https://cdn.zabbet.com/games/1672859746105-2f854e5f-234b-435f-80f0-df5be2f08d7f.jpg',
  'https://cdn.zabbet.com/games/vertical/CQ/alice_run.jpg',
  'https://cdn.zabbet.com/games/vertical/EVP/penalty_series.jpg',
  'https://cdn.zabbet.com/games/FACHAI/TH/27001.jpg',
  'https://cdn.zabbet.com/games/1672859511212-8c45edac-1680-42ba-9b6c-091d06f9ae6e.jpg',
  'https://cdn.zabbet.com/games/1671994886397-c7725f74-3996-42c6-8be6-b1d9ef7e4cf4.jpg',
  'https://cdn.zabbet.com/games/1672957788935-4d291968-4756-4893-9de0-bf88970c472f.jpg',
  'https://cdn.zabbet.com/games/pgslot/vertical/wild_bandito.jpg',
  'https://cdn.zabbet.com/games/1670387059235-83ad96bd-1709-4920-bf64-c2efb450d4d3.png',
  'https://cdn.zabbet.com/games/1674129890026-3e54dfdc-097c-4065-a345-26715abb569e.jpg',
  'https://cdn.zabbet.com/games/1773200304260-be610720-8024-4929-8259-cc72a44a32f5.jpeg',
  'https://cdn.zabbet.com/games/pgslot/vertical/ways_of_the_qilin.jpg',
  'https://cdn.zabbet.com/games/vertical/PP/sweet_bonanza.png',
] as const;

const GAME_NAMES = [
  'Caishen Wins', 'Maya Golden City', 'Roma X', 'El Paso', 'Sweet Bonanza Xmas', 'Roma Joker',
  'Golden Empire', 'Thai Hi Lo', 'Bushido Ways', 'Fortune Gems', 'Alice Run', 'Penalty Series',
  'Fortune Rabbit', 'Lucky Gold', 'Dragon Hatch', 'Cherry 777', 'Wild Bandito', 'C-Play',
  'Grand Spin', 'Royal Fishing', 'Ways of the Qilin', 'Sweet Bonanza',
] as const;

export const REFERENCE_GAMES: ReferenceAsset[] = GAME_URLS.map((url, index) => ({ name: GAME_NAMES[index] ?? `Game ${index + 1}`, url }));

export const REFERENCE_PROVIDERS: ReferenceAsset[] = [
  ['CQ9', 'https://cdn.zabbet.com/providers/set/1_1_badge/cq.png'],
  ['Evolution', 'https://cdn.zabbet.com/providers/set/1_1_badge/evp.png'],
  ['Fa Chai', 'https://cdn.zabbet.com/providers/set/1_1_badge/fachai.png'],
  ['JILI', 'https://cdn.zabbet.com/providers/set/1_1_badge/jl.png'],
  ['Joker', 'https://cdn.zabbet.com/providers/set/1_1_badge/jkgx2.png'],
  ['Kingmaker', 'https://cdn.zabbet.com/providers/set/1_1_badge/kingm.png'],
  ['NoLimit City', 'https://cdn.zabbet.com/providers/set/1_1_badge/nlc.png'],
  ['PG Soft', 'https://cdn.zabbet.com/providers/set/1_1_badge/pgsoft.png'],
  ['Pragmatic Play', 'https://cdn.zabbet.com/providers/set/1_1_badge/pp.png'],
  ['PlayStar', 'https://cdn.zabbet.com/providers/set/1_1_badge/ps.png'],
  ['Red Tiger', 'https://cdn.zabbet.com/providers/set/1_1_badge/rsg.png'],
  ['YGR', 'https://cdn.zabbet.com/providers/set/1_1_badge/ygr.png'],
].map(([name, url]) => ({ name, url }));

export const REFERENCE_BANKS: ReferenceAsset[] = [
  ['BAAC', 'https://noah345.shop/images/banks/TH/BAAC.webp'], ['BAY', 'https://noah345.shop/images/banks/TH/BAY.webp'],
  ['BBL', 'https://noah345.shop/images/banks/TH/BBL.webp'], ['CIMBT', 'https://noah345.shop/images/banks/TH/CIMBT.webp'],
  ['EXIM', 'https://noah345.shop/images/banks/TH/EXIM.webp'], ['GHB', 'https://noah345.shop/images/banks/TH/GHB.webp'],
  ['GSB', 'https://noah345.shop/images/banks/TH/GSB.webp'], ['KBANK', 'https://noah345.shop/images/banks/TH/KBANK.webp'],
  ['KKP', 'https://noah345.shop/images/banks/TH/KKP.webp'], ['KTB', 'https://noah345.shop/images/banks/TH/KTB.webp'],
  ['LHFG', 'https://noah345.shop/images/banks/TH/LHFG.webp'], ['SCB', 'https://noah345.shop/images/banks/TH/SCB.webp'],
  ['TCD', 'https://noah345.shop/images/banks/TH/TCD.webp'], ['TISCO', 'https://noah345.shop/images/banks/TH/TISCO.webp'],
  ['TMN', 'https://noah345.shop/images/banks/TH/TMN.webp'], ['TTB', 'https://noah345.shop/images/banks/TH/TTB.webp'],
  ['UOBT', 'https://noah345.shop/images/banks/TH/UOBT.webp'],
].map(([name, url]) => ({ name, url }));

export const REFERENCE_TRUST_BADGES: ReferenceAsset[] = [
  ['BMM', 'https://noah345.shop/images/footer/Bmm.webp'],
  ['Game Care', 'https://noah345.shop/images/footer/GAME%20CARE.webp'],
  ['Gaming Labs', 'https://noah345.shop/images/footer/GamingLab.webp'],
  ['GC', 'https://noah345.shop/images/footer/GC-icon%202.webp'],
  ['GoDaddy', 'https://noah345.shop/images/footer/GO%20DADDY.webp'],
  ['Group', 'https://noah345.shop/images/footer/Group%2048102721.webp'],
  ['Iovation', 'https://noah345.shop/images/footer/Iovation.webp'],
  ['iTech Labs', 'https://noah345.shop/images/footer/iTech.webp'],
].map(([name, url]) => ({ name, url }));

export const REFERENCE_HOME_ASSETS = {
  logo: 'https://cdn.zabbet.com/FEZX/lobby_settings/ba66cd74-2429-42dd-858e-aaae9fb3b688.png',
  sidePromotion: 'https://cdn.zabbet.com/FEZX/lobby_settings/26b4660d-776c-4bc4-ac49-21077498ae8d.jpg',
  jackpot: 'https://cdn.zabbet.com/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif',
  jackpotStill: 'https://cdn.zabbet.com/FEZX/lobby_settings/fc6b7ea8-3eaf-47ec-8640-33c7138d3c7c.png',
  leaderboard: 'https://noah345.shop/images/home/leader-board.svg',
  tournament: 'https://noah345.shop/images/home/tournament.svg',
  liveBackground: 'https://noah345.shop/images/home/background_live.webp',
  fire: 'https://noah345.shop/images/game/fire.webp',
  line: 'https://noah345.shop/images/line.png',
  rank1: 'https://noah345.shop/images/LeaderBoard/rank1.webp',
  rank2: 'https://noah345.shop/images/LeaderBoard/rank2.webp',
  rank3: 'https://noah345.shop/images/LeaderBoard/rank3.webp',
  rankTop3: 'https://noah345.shop/images/predict/mobile/rankBadgeTop3.svg',
  rankOther: 'https://noah345.shop/images/predict/mobile/rankBadgeOther.svg',
} as const;
