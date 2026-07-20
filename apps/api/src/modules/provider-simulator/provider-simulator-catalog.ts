export type SimulatorGamePlatform = 'mobile' | 'pc';

export type SimulatorGameCatalogItem = {
  code: string;
  name: string;
  provider: string;
  platform: SimulatorGamePlatform;
  category: string;
  accent: string;
  symbol: string;
  assetPath?: string;
  providerLogoPath?: string;
};

const MOBILE_ASSET_ROOT = 'asset/mobil/cdn.zabbet.com';

export const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  cq: 'CQ9 Gaming',
  evp: 'Evolution Play',
  fachai: 'Fa Chai Gaming',
  kingm: 'Kingmaker',
  nlc: 'NoLimit City',
  pgsoft: 'PG Soft',
  pp: 'Pragmatic Play',
};

export const GAME_CATALOG: readonly SimulatorGameCatalogItem[] = [
  {
    code: 'thai-hi-lo-2',
    name: 'Thai Hi-Lo 2',
    provider: 'kingm',
    platform: 'mobile',
    category: 'casino',
    accent: '#f59e0b',
    symbol: 'HL',
    assetPath: `${MOBILE_ASSET_ROOT}/games/KM/TH/Thai_Hi_Lo_2.jpg`,
    providerLogoPath: `${MOBILE_ASSET_ROOT}/providers/set/1_1_badge/kingm.png`,
  },
  {
    code: 'bushido-ways',
    name: 'Bushido Ways',
    provider: 'nlc',
    platform: 'mobile',
    category: 'slot',
    accent: '#dc2626',
    symbol: '武',
    assetPath: `${MOBILE_ASSET_ROOT}/games/NLC/bushidoways00000.jpg`,
    providerLogoPath: `${MOBILE_ASSET_ROOT}/providers/set/1_1_badge/nlc.png`,
  },
  {
    code: 'el-paso',
    name: 'El Paso',
    provider: 'nlc',
    platform: 'mobile',
    category: 'slot',
    accent: '#b45309',
    symbol: 'EP',
    assetPath: `${MOBILE_ASSET_ROOT}/games/NLC/elpaso0000000000.jpg`,
    providerLogoPath: `${MOBILE_ASSET_ROOT}/providers/set/1_1_badge/nlc.png`,
  },
  {
    code: 'alice-run',
    name: 'Alice Run',
    provider: 'cq',
    platform: 'mobile',
    category: 'arcade',
    accent: '#0ea5e9',
    symbol: 'AR',
    assetPath: `${MOBILE_ASSET_ROOT}/games/vertical/CQ/alice_run.jpg`,
    providerLogoPath: `${MOBILE_ASSET_ROOT}/providers/set/1_1_badge/cq.png`,
  },
  {
    code: 'penalty-series',
    name: 'Penalty Series',
    provider: 'evp',
    platform: 'mobile',
    category: 'sport',
    accent: '#16a34a',
    symbol: 'PS',
    assetPath: `${MOBILE_ASSET_ROOT}/games/vertical/EVP/penalty_series.jpg`,
    providerLogoPath: `${MOBILE_ASSET_ROOT}/providers/set/1_1_badge/evp.png`,
  },
  {
    code: 'sweet-bonanza-xmas',
    name: 'Sweet Bonanza Xmas',
    provider: 'pp',
    platform: 'mobile',
    category: 'slot',
    accent: '#db2777',
    symbol: 'SB',
    assetPath: `${MOBILE_ASSET_ROOT}/games/vertical/PP/sweet_bonanza_xmas.png`,
    providerLogoPath: `${MOBILE_ASSET_ROOT}/providers/set/1_1_badge/pp.png`,
  },
  {
    code: 'fachai-27001',
    name: 'Fa Chai 27001',
    provider: 'fachai',
    platform: 'mobile',
    category: 'slot',
    accent: '#eab308',
    symbol: '發',
    assetPath: `${MOBILE_ASSET_ROOT}/games/FACHAI/TH/27001.jpg`,
    providerLogoPath: `${MOBILE_ASSET_ROOT}/providers/set/1_1_badge/fachai.png`,
  },
  { code: 'golden-mines', name: 'Golden Mines', provider: 'platform-pc', platform: 'pc', category: 'arcade', accent: '#eab308', symbol: '⛏' },
  { code: 'ocean-treasure', name: 'Ocean Treasure', provider: 'platform-pc', platform: 'pc', category: 'arcade', accent: '#0ea5e9', symbol: '⚓' },
  { code: 'neon-racer', name: 'Neon Racer', provider: 'platform-pc', platform: 'pc', category: 'racing', accent: '#ec4899', symbol: 'N' },
  { code: 'classic-blackjack', name: 'Classic Blackjack', provider: 'evolution', platform: 'pc', category: 'casino', accent: '#334155', symbol: '21' },
];

export function assetUrl(path: string | undefined, publicBaseUrl: string) {
  if (!path) return null;
  const configured = process.env.GAME_ASSET_BASE_URL?.replace(/\/$/, '');
  if (configured) return `${configured}/${path}`;
  const repository = process.env.GITHUB_REPOSITORY ?? 'tawechok1997-ai/platform-starter';
  const ref = process.env.GAME_ASSET_GIT_REF ?? 'main';
  return `https://raw.githubusercontent.com/${repository}/${ref}/${path}`;
}
