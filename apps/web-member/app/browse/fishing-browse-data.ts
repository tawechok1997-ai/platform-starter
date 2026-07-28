export type FishingFilter = 'hot' | 'new' | 'slot';

export type FishingProvider = {
  code: string;
  name: string;
  badge: string;
};

export type FishingGame = {
  id: string;
  name: string;
  image: string;
  provider: string;
  providerLogo?: string | undefined;
  isNew?: boolean;
  isHot?: boolean;
  filters: readonly FishingFilter[];
};

const FISHING_PROVIDER_ROWS = [
  ['ygrfish', 'YGR'], ['misoltfish', 'Miso'], ['cqfish', 'CQ9'], ['fachaifish', 'Fa Chai'],
  ['jlfish', 'JILI'], ['jkgx2fish', 'Joker'], ['rsgfish', 'RSG'], ['sppfish', 'SimplePlay'],
  ['spgfish', 'Spadegaming'], ['wmfish', 'WM'], ['kagafish', 'KA Gaming'], ['r88fish', 'Rich88'],
  ['fsfish', 'FastSpin'], ['askfish', 'AskMeSlot'], ['acewinfish', 'AceWin'],
] as const;

export const FISHING_PROVIDERS: readonly FishingProvider[] = FISHING_PROVIDER_ROWS.map(([code, name]) => ({
  code,
  name,
  badge: `https://cdn.zabbet.com/providers/set/1_1_badge/${code}.png`,
}));

export const FISHING_PROVIDER_ALIASES: Record<string, string> = {
  ygr: 'ygrfish', ygrfish: 'ygrfish', miso: 'misoltfish', misolt: 'misoltfish', misoltfish: 'misoltfish',
  cq: 'cqfish', cq9: 'cqfish', cqfish: 'cqfish', fachai: 'fachaifish', fachaifish: 'fachaifish',
  jl: 'jlfish', jili: 'jlfish', jlfish: 'jlfish', jkg: 'jkgx2fish', jkgx2: 'jkgx2fish',
  joker: 'jkgx2fish', jkgx2fish: 'jkgx2fish', rsg: 'rsgfish', rsgfish: 'rsgfish',
  spp: 'sppfish', simpleplay: 'sppfish', sppfish: 'sppfish', spg: 'spgfish', spadegaming: 'spgfish',
  spgfish: 'spgfish', wm: 'wmfish', wmfish: 'wmfish', kaga: 'kagafish', kagaming: 'kagafish',
  kagafish: 'kagafish', r88: 'r88fish', rich88: 'r88fish', r88fish: 'r88fish', fs: 'fsfish',
  fastspin: 'fsfish', fsfish: 'fsfish', ask: 'askfish', askmeslot: 'askfish', askfish: 'askfish',
  acewin: 'acewinfish', acewinfish: 'acewinfish',
};

export const FISHING_FILTERS: readonly { key: FishingFilter; label: string }[] = [
  { key: 'hot', label: 'เกมส์ฮิต' },
  { key: 'new', label: 'เกมส์ใหม่' },
  { key: 'slot', label: 'เกมส์สล็อต' },
];

export const FISHING_FALLBACK_GAMES: readonly FishingGame[] = [
  ['oneshot-fishing', 'Oneshot Fishing', 'https://cdn.zabbet.com/games/vertical/CQ/oneshot_fishing.jpg', 'cqfish', false, true, ['hot']],
  ['dinosaur-tycoon-ii', 'Dinosaur Tycoon II', 'https://cdn.zabbet.com/games/1682637746669-06e685fc-2939-442d-a6de-986b82d993be.jpg', 'jlfish', true, false, ['new']],
  ['fishing-treasure', 'Fishing Treasure', 'https://cdn.zabbet.com/games/1713425309332-8a03e24d-e1ed-4a91-b5da-ff40de7f52b5.png', 'fsfish', false, true, ['hot']],
  ['three-kingdoms-of-fishing', 'Three Kingdoms Of Fishing', 'https://cdn.zabbet.com/games/1686804932871-fe6bb3c4-e7ec-4a57-8bae-96089cb4a87f.jpeg', 'wmfish', false, false, []],
  ['ocean-emperor', 'Ocean Emperor', 'https://cdn.zabbet.com/games/1684333496065-b988dfd3-ddef-4287-834c-9b4843de1e54.jpg', 'rsgfish', false, true, ['hot']],
  ['zodiac-hunting', 'Zodiac Hunting', 'https://cdn.zabbet.com/games/1696500316419-c95c9300-087f-41a3-975b-7a38d56d2181.jpg', 'kagafish', true, false, ['new']],
  ['make-a-killing-fishing', 'Make a Killing Fishing', 'https://cdn.zabbet.com/games/1705570969344-791f4565-0201-4752-8c06-e0bd7db505b2.png', 'ygrfish', true, false, ['new']],
  ['game-2552', 'ตกปลาดารกะ', 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21008.jpg', 'fachaifish', false, false, []],
  ['dragon-boom', 'Dragon Boom', 'https://cdn.zabbet.com/games/1704678891483-1766acd5-e22d-4a14-b9d4-7c7e6619e61d.jpg', 'kagafish', true, false, ['new', 'slot']],
  ['fortune-fishing', 'Fortune Fishing', 'https://cdn.zabbet.com/games/1704871947762-276f8adb-b534-4ee5-bea7-dba0fcaa9e24.jpg', 'ygrfish', true, false, ['new']],
  ['honor-of-king', 'Honor of King', 'https://cdn.zabbet.com/games/1697176887116-101a6395-131e-4372-bde4-3d4af56c7fca.jpg', 'wmfish', false, false, []],
  ['game-2549', 'ตกปลามหาเทพ', 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21003.jpg', 'fachaifish', false, false, []],
  ['game-2551', 'ศึกเดือดตกปลา', 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21006.jpg', 'fachaifish', false, false, []],
  ['game-2550', 'ตกปลาเรือสมบัติ', 'https://cdn.zabbet.com/games/FACHAIFISH/TH/21004.jpg', 'fachaifish', false, false, []],
  ['chill-fishing', 'Chill Fishing', 'https://cdn.zabbet.com/games/1697459171078-7bd5c126-34ba-493a-919a-f5d3d7f87851.jpg', 'ygrfish', false, false, []],
  ['insect-master', 'Insect Master', 'https://cdn.zabbet.com/games/1697460472114-3f89bfd3-2791-48e0-8867-d18cebf1fa1c.jpg', 'ygrfish', false, false, ['slot']],
  ['alien-hunter', 'Alien Hunter', 'https://cdn.zabbet.com/games/vertical/SPG/alien_hunter.png', 'spgfish', false, false, []],
  ['fishing-war', 'Fishing War', 'https://cdn.zabbet.com/games/vertical/SPG/fishing_war.png', 'spgfish', false, true, ['hot']],
  ['paradise', 'Paradise', 'https://cdn.zabbet.com/games/vertical/CQ/paradise.jpg', 'cqfish', false, false, []],
  ['teasure-of-pirate', 'Teasure of Pirate', 'https://cdn.zabbet.com/games/AskMeSlot/Fish/TOP.jpg', 'askfish', false, false, []],
  ['treasureland', 'Treasureland', 'https://cdn.zabbet.com/games/AskMeSlot/Fish/TREASURELAND.jpg', 'askfish', false, false, []],
  ['ghost-busters', 'Ghost Busters', 'https://cdn.zabbet.com/games/AskMeSlot/Fish/GHOSTBUSTER.jpg', 'askfish', false, false, []],
  ['fishermen-gold', 'FishermenGold', 'https://cdn.zabbet.com/games/vertical/SPP/simplay_ne.png', 'sppfish', false, false, []],
  ['rich-fishing', 'Rich Fishing', 'https://cdn.zabbet.com/games/1690996504480-9989cc58-a204-4485-921a-34663ad82864.png', 'r88fish', false, false, []],
].map(([id, name, image, provider, isNew, isHot, filters]) => ({
  id: id as string,
  name: name as string,
  image: image as string,
  provider: provider as string,
  isNew: Boolean(isNew),
  isHot: Boolean(isHot),
  filters: filters as FishingFilter[],
}));
